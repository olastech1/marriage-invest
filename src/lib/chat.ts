/**
 * Spousal chat storage & thread helpers.
 *
 * Chat messages must be visible to BOTH spouses, who are usually on different
 * devices and therefore hit different serverless instances. The in-memory
 * mock DB cannot share state across instances, so chat is stored in Postgres
 * (CHAT_DATABASE_URL, falling back to DATABASE_URL). If no database is
 * configured or it cannot be reached, chat falls back to the mock store so
 * local development keeps working.
 */

import { PrismaClient } from '@prisma/client'
import { mockPrismaClient } from '@/lib/mockDb'

// Demo couple used by the seeded accounts
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

type ChatClient = Pick<PrismaClient, 'chatMessage'>

const globalForChat = globalThis as unknown as {
  chatPrisma?: PrismaClient
  chatDbPromise?: Promise<ChatClient>
}

async function connectChatDb(): Promise<ChatClient> {
  const url = process.env.CHAT_DATABASE_URL || process.env.DATABASE_URL
  if (!url) return mockPrismaClient as unknown as ChatClient

  try {
    const client = globalForChat.chatPrisma ?? new PrismaClient({ datasourceUrl: url })
    globalForChat.chatPrisma = client
    // Fail fast if credentials are wrong or the chat_messages table is missing
    await client.chatMessage.count({ where: { id: '__healthcheck__' } })
    return client
  } catch (err: any) {
    console.error(
      '[chat] Postgres chat store unavailable — falling back to in-memory store. ' +
        'Spouses on different devices will NOT see each other\'s messages until this is fixed. ' +
        'Check CHAT_DATABASE_URL / DATABASE_URL and run `npx prisma db push`.',
      err?.code || err?.message,
    )
    return mockPrismaClient as unknown as ChatClient
  }
}

/** Shared chat store (Postgres when available). */
export function getChatDb(): Promise<ChatClient> {
  globalForChat.chatDbPromise ??= connectChatDb()
  return globalForChat.chatDbPromise
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
