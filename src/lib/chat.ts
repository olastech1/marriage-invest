/**
 * Spousal chat thread helpers. Messages live in the shared Postgres database
 * so both spouses see the same conversation from any device.
 */

import { prisma } from '@/lib/db'
import { cleanRelation, getPartnerIds } from '@/lib/partners'

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
 * The partner this member chats with most recently: the chat bubble and older
 * "couple chat" links open this one. Members can have several partners; code
 * acting for a pair should pass that partner explicitly instead.
 */
export async function resolveSpouseId(userId: string): Promise<string> {
  const ids = await getPartnerIds(userId)
  if (ids.length <= 1) return ids[0] || ''
  const latest = await prisma.chatMessage.findFirst({
    where: { threadId: { in: ids.map((id) => buildThreadId(userId, id)) } },
    orderBy: { createdAt: 'desc' },
    select: { threadId: true },
  })
  return ids.find((id) => latest && buildThreadId(userId, id) === latest.threadId) || ids[0]
}

/** Partner requests waiting for this user's answer: the newest one from each person not already a partner */
export async function getIncomingSpouseRequests(userId: string) {
  if (!userId) return []
  const partners = new Set(await getPartnerIds(userId))
  const rows = await prisma.chatMessage.findMany({
    where: { type: 'spouse_request', proposalData: { path: ['toUserId'], equals: userId } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, senderId: true, senderName: true, proposalData: true },
  })
  const seen = new Set<string>()
  const requests: { messageId: string; fromUserId: string; fromName: string; relation: string }[] = []
  for (const row of rows) {
    if ((row.proposalData as Record<string, string> | null)?.status !== 'pending' || seen.has(row.senderId) || partners.has(row.senderId)) continue
    seen.add(row.senderId)
    const relation = cleanRelation((row.proposalData as Record<string, string> | null)?.relation)
    requests.push({ messageId: row.id, fromUserId: row.senderId, fromName: row.senderName || 'Member', relation })
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
