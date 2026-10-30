/**
 * Spousal deposit reciprocation, derived from the couple's chat thread.
 *
 * Every paid vault deposit posts exactly one `deposit_alert` message into the
 * couple thread, so that thread is the single source of truth both spouses see.
 * Each regular deposit is reciprocated on its own:
 *   - a reciprocation names the deposit it pays for (`forDepositId`)
 *   - older reciprocations without one are applied to the oldest unmatched
 *     deposits first (only a fully covered deposit counts as matched)
 */

import { prisma } from '@/lib/db'
import { buildThreadId, getChatDb, resolveSpouseId } from '@/lib/chat'

const MATCH_WINDOW_MS = 48 * 3600 * 1000

/**
 * Only deposits actually paid through Stripe count (their reference is the
 * Stripe PaymentIntent or Checkout Session id). Cards from before real
 * payments existed are history only and never create or settle a balance.
 */
function isPaidDeposit(deposit: { amount?: unknown; reference?: unknown }): boolean {
  const ref = String(deposit.reference || '')
  return Number(deposit.amount) > 0 && (ref.startsWith('pi_') || ref.startsWith('cs_'))
}

function noteFromText(text: string): string {
  const match = text.match(/Note: "([^"]*)"/)
  return match ? match[1] : ''
}

/** One deposit waiting to be reciprocated */
export interface PendingDeposit {
  messageId: string
  depositorName: string
  amount: number
  depositedAt: string
  dueDate: string
  note: string
}

/** Kept for existing callers: the most recent pending deposit */
export interface PendingReciprocation {
  messageId: string
  depositorName: string
  amount: number
  depositedAt: string
  dueDate: string
  partnerNote: string
  status: 'PENDING'
  isObligationOnCurrentUser: true
}

export interface ReciprocationStatus {
  spouseId: string
  spouseName: string
  /** Sum of the spouse's deposits I still have to reciprocate */
  owedByMe: number
  /** Sum of my deposits my spouse still has to reciprocate */
  owedBySpouse: number
  /** Each of the spouse's deposits I still have to reciprocate, oldest first */
  pendingDeposits: PendingDeposit[]
  /** Each of my deposits my spouse still has to reciprocate, oldest first */
  spousePendingDeposits: PendingDeposit[]
  pending: PendingReciprocation | null
  history: { id: string; action: string; createdAt: string; details: Record<string, unknown> }[]
}

export async function getSpouseName(spouseId: string, fallback?: string): Promise<string> {
  if (!spouseId) return ''
  const user = (await prisma.user.findUnique({ where: { id: spouseId } })) as { name?: string } | null
  if (user?.name) return user.name
  // Members who signed in but aren't in the user store: use the name on their own chat messages
  const db = await getChatDb()
  const lastSent = await db.chatMessage.findFirst({
    where: { senderId: spouseId },
    orderBy: { createdAt: 'desc' },
  })
  return lastSent?.senderName || fallback || 'your partner'
}

type DepositMessage = Awaited<ReturnType<typeof loadCoupleDeposits>>[number]

async function loadCoupleDeposits(userId: string, spouseId: string) {
  const db = await getChatDb()
  const messages = await db.chatMessage.findMany({
    where: { threadId: buildThreadId(userId, spouseId), type: 'deposit_alert' },
    orderBy: { createdAt: 'asc' },
  })
  return messages
    .map((msg) => ({ msg, deposit: (msg.depositData || {}) as Record<string, any> }))
    .filter(({ msg, deposit }) => isPaidDeposit(deposit) && (msg.senderId === userId || msg.senderId === spouseId))
}

/** Which regular deposits have been reciprocated (message id → matched) */
function matchDeposits(rows: DepositMessage[]): Map<string, boolean> {
  const matched = new Map<string, boolean>()
  // Shares of an approved proposal are paid by both spouses: nothing to reciprocate
  for (const { msg, deposit } of rows) if (!deposit.isReciprocalMatch) matched.set(msg.id, !!deposit.proposalId)

  // 1. Reciprocations that name their deposit
  for (const { msg, deposit } of rows) {
    if (!deposit.isReciprocalMatch || !deposit.forDepositId) continue
    const target = rows.find((r) => r.msg.id === deposit.forDepositId)
    if (target && target.msg.senderId !== msg.senderId) matched.set(target.msg.id, true)
  }

  // 2. Older reciprocations without one: oldest unmatched deposits first
  const credit: Record<string, number> = {}
  for (const { msg, deposit } of rows) {
    if (deposit.isReciprocalMatch && !deposit.forDepositId) credit[msg.senderId] = (credit[msg.senderId] || 0) + Number(deposit.amount)
  }
  for (const { msg, deposit } of rows) {
    if (deposit.isReciprocalMatch || matched.get(msg.id)) continue
    const matcherCredit = Object.entries(credit).find(([senderId]) => senderId !== msg.senderId)
    if (matcherCredit && matcherCredit[1] >= Number(deposit.amount)) {
      matched.set(msg.id, true)
      credit[matcherCredit[0]] = matcherCredit[1] - Number(deposit.amount)
    }
  }
  return matched
}

function toPending(row: DepositMessage): PendingDeposit {
  const createdAt = new Date(row.msg.createdAt)
  return {
    messageId: row.msg.id,
    depositorName: row.msg.senderName,
    amount: Number(row.deposit.amount),
    depositedAt: createdAt.toISOString(),
    dueDate: new Date(createdAt.getTime() + MATCH_WINDOW_MS).toISOString(),
    note: noteFromText(row.msg.text),
  }
}

const round = (n: number) => Math.round(n * 100) / 100

export async function getReciprocationStatus(userId: string): Promise<ReciprocationStatus> {
  const spouseId = await resolveSpouseId(userId)
  const spouseName = await getSpouseName(spouseId)
  const empty: ReciprocationStatus = {
    spouseId,
    spouseName,
    owedByMe: 0,
    owedBySpouse: 0,
    pendingDeposits: [],
    spousePendingDeposits: [],
    pending: null,
    history: [],
  }
  if (!spouseId) return empty

  const rows = await loadCoupleDeposits(userId, spouseId)
  const matched = matchDeposits(rows)
  const unmatched = rows.filter(({ msg, deposit }) => !deposit.isReciprocalMatch && !matched.get(msg.id))
  const pendingDeposits = unmatched.filter(({ msg }) => msg.senderId === spouseId).map(toPending)
  const spousePendingDeposits = unmatched.filter(({ msg }) => msg.senderId === userId).map(toPending)
  const latest = pendingDeposits[pendingDeposits.length - 1]

  return {
    spouseId,
    spouseName,
    owedByMe: round(pendingDeposits.reduce((sum, d) => sum + d.amount, 0)),
    owedBySpouse: round(spousePendingDeposits.reduce((sum, d) => sum + d.amount, 0)),
    pendingDeposits,
    spousePendingDeposits,
    pending: latest
      ? {
          messageId: latest.messageId,
          depositorName: latest.depositorName,
          amount: latest.amount,
          depositedAt: latest.depositedAt,
          dueDate: latest.dueDate,
          partnerNote: latest.note,
          status: 'PENDING',
          isObligationOnCurrentUser: true,
        }
      : null,
    history: rows
      .slice()
      .reverse()
      .slice(0, 10)
      .map(({ msg, deposit }) => ({
        id: msg.id,
        action: deposit.isReciprocalMatch ? 'RECIPROCATION_OBLIGATION_FULFILLED' : 'RECIPROCATION_OBLIGATION_CREATED',
        createdAt: new Date(msg.createdAt).toISOString(),
        details: { depositorName: msg.senderName, amount: Number(deposit.amount), text: msg.text },
      })),
  }
}

export interface CoupleDeposit {
  id: string
  reference?: string
  amount: number
  depositorName: string
  isCurrentUser: boolean
  isReciprocalMatch: boolean
  vaultTitle: string
  status: 'APPROVED' | 'PENDING_MATCH'
  statusLabel: string
  canRemind: boolean
  partnerEmail: string
  partnerName: string
  createdAt: string
}

/** Every deposit in the couple thread, newest first, each with its own status */
export async function getCoupleDeposits(userId: string): Promise<CoupleDeposit[]> {
  const spouseId = await resolveSpouseId(userId)
  if (!spouseId) return []
  const spouseName = await getSpouseName(spouseId)
  const rows = await loadCoupleDeposits(userId, spouseId)
  const matched = matchDeposits(rows)

  return rows
    .map(({ msg, deposit }) => {
      const isCurrentUser = msg.senderId === userId
      const pending = !deposit.isReciprocalMatch && !matched.get(msg.id)
      const waitingOn = isCurrentUser ? spouseName : 'you'
      return {
        id: msg.id,
        reference: deposit.reference,
        amount: Number(deposit.amount),
        depositorName: msg.senderName,
        isCurrentUser,
        isReciprocalMatch: !!deposit.isReciprocalMatch,
        vaultTitle: deposit.vaultTitle || 'Joint Vault',
        status: pending ? ('PENDING_MATCH' as const) : ('APPROVED' as const),
        statusLabel: deposit.proposalId
          ? 'Shared plan'
          : deposit.isReciprocalMatch
            ? 'Reciprocation'
            : pending
              ? `Waiting for ${waitingOn} to reciprocate`
              : 'Reciprocated',
        canRemind: pending && isCurrentUser,
        partnerEmail: '',
        partnerName: spouseName,
        createdAt: new Date(msg.createdAt).toISOString(),
      }
    })
    .reverse()
}

/** Is this deposit one of the spouse's deposits that I still have to reciprocate? */
export async function findPendingDeposit(userId: string, messageId?: string | null): Promise<PendingDeposit | null> {
  const { pendingDeposits } = await getReciprocationStatus(userId)
  if (messageId) return pendingDeposits.find((d) => d.messageId === messageId) || null
  return pendingDeposits[0] || null // oldest first when none is named
}
