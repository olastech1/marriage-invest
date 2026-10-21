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

function isRealUser(id?: string | null): id is string {
  return !!id && id.startsWith('usr_') && id !== 'usr_admin'
}

/**
 * Resolve a user's spouse: the demo pairing for the seeded couple, otherwise
 * the most recent member they have exchanged direct messages with.
 */
export async function resolveSpouseId(userId: string): Promise<string> {
  if (DEMO_SPOUSES[userId]) return DEMO_SPOUSES[userId]

  const db = await getChatDb()
  const recent = await db.chatMessage.findMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  for (const msg of recent) {
    const other = msg.senderId === userId ? msg.recipientId : msg.senderId
    if (isRealUser(other) && other !== userId) return other
  }
  return ''
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
