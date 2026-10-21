/**
 * Spousal deposit reciprocation, derived from the couple's chat thread.
 *
 * Every vault deposit posts exactly one `deposit_alert` message into the
 * couple thread (stored in the shared Postgres chat store), so that thread is
 * the single source of truth both spouses see:
 *   - a spouse's regular deposit adds to what I owe
 *   - my deposit flagged `isReciprocalMatch` pays that down
 * Matches made before a deposit still count toward it, so this always agrees
 * with the first-in-first-out ledger in getCoupleDeposits.
 */

import { prisma } from '@/lib/db'
import { buildThreadId, getChatDb, resolveSpouseId } from '@/lib/chat'

const MATCH_WINDOW_MS = 48 * 3600 * 1000

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
  owedByMe: number
  owedBySpouse: number
  pending: PendingReciprocation | null
  history: { id: string; action: string; createdAt: string; details: Record<string, unknown> }[]
}

function noteFromText(text: string): string {
  const match = text.match(/Note: "([^"]*)"/)
  return match ? match[1] : ''
}

export async function getSpouseName(spouseId: string, fallback?: string): Promise<string> {
  if (!spouseId) return ''
  const user = (await prisma.user.findUnique({ where: { id: spouseId } })) as { name?: string } | null
  return user?.name || fallback || spouseId
}

export async function getReciprocationStatus(userId: string): Promise<ReciprocationStatus> {
  const spouseId = await resolveSpouseId(userId)
  const empty: ReciprocationStatus = {
    spouseId,
    spouseName: await getSpouseName(spouseId),
    owedByMe: 0,
    owedBySpouse: 0,
    pending: null,
    history: [],
  }
  if (!spouseId) return empty

  const db = await getChatDb()
  const messages = await db.chatMessage.findMany({
    where: { threadId: buildThreadId(userId, spouseId), type: 'deposit_alert' },
    orderBy: { createdAt: 'asc' },
  })

  let owedByMe = 0
  let owedBySpouse = 0
  let lastSpouseDeposit: (typeof messages)[number] | null = null
  let spouseName = empty.spouseName
  const history: ReciprocationStatus['history'] = []

  for (const msg of messages) {
    const deposit = (msg.depositData || {}) as { amount?: number; isReciprocalMatch?: boolean }
    const amount = Number(deposit.amount) || 0
    if (amount <= 0) continue
    const fromMe = msg.senderId === userId
    const fromSpouse = msg.senderId === spouseId
    if (!fromMe && !fromSpouse) continue
    if (fromSpouse && msg.senderName) spouseName = msg.senderName

    if (deposit.isReciprocalMatch) {
      if (fromMe) owedByMe -= amount
      else owedBySpouse -= amount
    } else if (fromSpouse) {
      owedByMe += amount
      lastSpouseDeposit = msg
    } else {
      owedBySpouse += amount
    }

    history.push({
      id: msg.id,
      action: deposit.isReciprocalMatch ? 'RECIPROCATION_OBLIGATION_FULFILLED' : 'RECIPROCATION_OBLIGATION_CREATED',
      createdAt: new Date(msg.createdAt).toISOString(),
      details: { depositorName: msg.senderName, amount, text: msg.text },
    })
  }

  // Same rule as the ledger: total regular deposits minus total matches
  owedByMe = Math.max(0, owedByMe)
  owedBySpouse = Math.max(0, owedBySpouse)

  const pending: PendingReciprocation | null =
    owedByMe > 0 && lastSpouseDeposit
      ? {
          messageId: lastSpouseDeposit.id,
          depositorName: spouseName,
          amount: Math.round(owedByMe * 100) / 100,
          depositedAt: new Date(lastSpouseDeposit.createdAt).toISOString(),
          dueDate: new Date(new Date(lastSpouseDeposit.createdAt).getTime() + MATCH_WINDOW_MS).toISOString(),
          partnerNote: noteFromText(lastSpouseDeposit.text),
          status: 'PENDING',
          isObligationOnCurrentUser: true,
        }
      : null

  return {
    spouseId,
    spouseName,
    owedByMe: Math.round(owedByMe * 100) / 100,
    owedBySpouse: Math.round(owedBySpouse * 100) / 100,
    pending,
    history: history.reverse().slice(0, 10),
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

/**
 * Every deposit in the couple thread, newest first. Regular deposits are
 * matched first-in-first-out by the other spouse's match deposits; anything
 * not yet covered is PENDING_MATCH.
 */
export async function getCoupleDeposits(userId: string): Promise<CoupleDeposit[]> {
  const spouseId = await resolveSpouseId(userId)
  if (!spouseId) return []
  const spouseName = await getSpouseName(spouseId)

  const db = await getChatDb()
  const messages = await db.chatMessage.findMany({
    where: { threadId: buildThreadId(userId, spouseId), type: 'deposit_alert' },
    orderBy: { createdAt: 'asc' },
  })

  // Remaining match credit each spouse has paid toward the other's deposits
  const matchCredit: Record<string, number> = {}
  const rows = messages
    .map((msg) => ({ msg, deposit: (msg.depositData || {}) as Record<string, any> }))
    .filter(({ msg, deposit }) => Number(deposit.amount) > 0 && (msg.senderId === userId || msg.senderId === spouseId))

  for (const { msg, deposit } of rows) {
    if (deposit.isReciprocalMatch) matchCredit[msg.senderId] = (matchCredit[msg.senderId] || 0) + Number(deposit.amount)
  }

  const result: CoupleDeposit[] = []
  for (const { msg, deposit } of rows) {
    const amount = Number(deposit.amount)
    const isCurrentUser = msg.senderId === userId
    let pending = false
    if (!deposit.isReciprocalMatch) {
      const matcher = isCurrentUser ? spouseId : userId
      const credit = matchCredit[matcher] || 0
      pending = credit < amount
      matchCredit[matcher] = Math.max(0, credit - amount)
    }
    const waitingOn = isCurrentUser ? spouseName : 'you'
    result.push({
      id: msg.id,
      reference: deposit.reference,
      amount,
      depositorName: msg.senderName,
      isCurrentUser,
      isReciprocalMatch: !!deposit.isReciprocalMatch,
      vaultTitle: deposit.vaultTitle || 'Joint Vault',
      status: pending ? 'PENDING_MATCH' : 'APPROVED',
      statusLabel: deposit.isReciprocalMatch ? 'Match deposit' : pending ? `Waiting for ${waitingOn} to match` : 'Matched',
      canRemind: pending && isCurrentUser,
      partnerEmail: '',
      partnerName: spouseName,
      createdAt: new Date(msg.createdAt).toISOString(),
    })
  }
  return result.reverse()
}
