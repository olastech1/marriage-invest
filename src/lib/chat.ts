/**
 * Spousal chat thread helpers. Messages live in the shared Postgres database
 * so both spouses see the same conversation from any device.
 */

import { prisma } from '@/lib/db'

// Demo couple used by the seeded test accounts
const DEMO_SPOUSES: Record<string, string> = {
  usr_jane_doe: 'usr_marcus_vance',
  usr_marcus_vance: 'usr_jane_doe',
}

const CHAT_FIELDS = [
  'id',
  'threadId',
  'senderId',
  'senderName',
  'recipientId',
  'recipientName',
  'text',
  'timestamp',
  'type',
  'read',
  'reactions',
  'proposalData',
  'depositData',
  'loveNoteTitle',
  'voiceDuration',
  'createdAt',
] as const

/** Chat store (kept as a function so callers don't change if storage moves). */
export async function getChatDb() {
  return prisma
}

// ---------------------------------------------------------------------------
// Thread IDs
// ---------------------------------------------------------------------------

/** Deterministic thread ID for two users (order-independent). */
export function buildThreadId(userA: string, userB: string): string {
  const cleanA = String(userA || '').trim().toLowerCase()
  const cleanB = String(userB || '').trim().toLowerCase()
  return `dm_${[cleanA, cleanB].sort().join('_')}`
}

/**
 * Given a dm thread ID and one participant, return the other participant.
 * User IDs contain underscores, so the thread ID can't simply be split on '_'.
 */
export function otherParticipant(threadId: string, userId: string): string {
  if (!threadId.startsWith('dm_')) return ''
  const body = threadId.slice(3)
  const me = userId.toLowerCase()
  if (body.startsWith(`${me}_`)) return body.slice(me.length + 1)
  if (body.endsWith(`_${me}`)) return body.slice(0, -(me.length + 1))
  return ''
}

/** True if the thread is a direct thread that includes this user. */
export function isParticipant(threadId: string, userId: string): boolean {
  return otherParticipant(threadId, userId) !== ''
}

// ---------------------------------------------------------------------------
// Spouse resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a user's spouse: the demo pairing for the seeded test couple, or the
 * account's spouse link.
 */
export async function resolveSpouseId(userId: string): Promise<string> {
  if (!userId) return ''
  if (DEMO_SPOUSES[userId]) return DEMO_SPOUSES[userId]

  // Only an explicit link counts (union registration or an accepted spouse
  // request). Chatting with someone never makes them your spouse.
  const linked = await prisma.user.findUnique({ where: { id: userId }, select: { spouseId: true } })
  return linked?.spouseId || ''
}

/** Spouse requests waiting for this user's answer: the newest one from each person */
export async function getIncomingSpouseRequests(userId: string) {
  if (!userId || (await resolveSpouseId(userId))) return []
  const rows = await prisma.chatMessage.findMany({
    where: { type: 'spouse_request', proposalData: { path: ['toUserId'], equals: userId } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, senderId: true, senderName: true, proposalData: true },
  })
  const seen = new Set<string>()
  const requests: { messageId: string; fromUserId: string; fromName: string }[] = []
  for (const row of rows) {
    if ((row.proposalData as Record<string, string> | null)?.status !== 'pending' || seen.has(row.senderId)) continue
    seen.add(row.senderId)
    requests.push({ messageId: row.id, fromUserId: row.senderId, fromName: row.senderName || 'Member' })
  }
  return requests
}

/**
 * Create a chat message. A `threadId` of 'spouse' is resolved to the private
 * couple thread of `spouseOf` (defaults to the sender) — never a single thread
 * shared by every couple. Pass `spouseOf` for system-sent messages.
 */
export async function createChatMessage(args: { data: Record<string, any>; spouseOf?: string }) {
  const input = { ...args.data }

  if (input.threadId === 'spouse' || !input.threadId) {
    const owner = args.spouseOf || input.senderId
    const spouseId = (owner === input.senderId && input.recipientId) || (await resolveSpouseId(owner))
    // No spouse linked yet: keep it in the user's own thread
    input.threadId = buildThreadId(owner, spouseId || owner)
    if (owner === input.senderId && spouseId) input.recipientId ??= spouseId
  }

  const data: Record<string, any> = {}
  for (const key of CHAT_FIELDS) {
    if (input[key] !== undefined) data[key] = input[key]
  }
  data.id ??= `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const db = await getChatDb()
  return db.chatMessage.create({ data: data as any })
}
