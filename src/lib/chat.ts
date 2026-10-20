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

export type ChatStoreKind = 'postgres' | 'memory'

const globalForChat = globalThis as unknown as {
  chatPrisma?: PrismaClient
  chatDbPromise?: Promise<ChatClient>
  chatStoreKind?: ChatStoreKind
  chatStoreError?: string
  chatRetryAt?: number
}

const RETRY_POSTGRES_MS = 60_000

// Mirrors the ChatMessage model so the table exists even if `prisma db push` was never run
const CREATE_CHAT_TABLE_SQL = [
  `CREATE TABLE IF NOT EXISTS "chat_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "recipientId" TEXT,
    "recipientName" TEXT,
    "text" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "reactions" JSONB,
    "proposalData" JSONB,
    "depositData" JSONB,
    "loveNoteTitle" TEXT,
    "voiceDuration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "chat_messages_threadId_createdAt_idx" ON "chat_messages"("threadId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "chat_messages_senderId_idx" ON "chat_messages"("senderId")`,
  `CREATE INDEX IF NOT EXISTS "chat_messages_recipientId_idx" ON "chat_messages"("recipientId")`,
]

function useMemoryStore(reason: string): ChatClient {
  globalForChat.chatStoreKind = 'memory'
  globalForChat.chatStoreError = reason
  console.error(
    '[chat] Postgres chat store unavailable — falling back to in-memory store. ' +
      'Spouses on different devices will NOT see each other\'s messages until this is fixed. ' +
      'Check CHAT_DATABASE_URL / DATABASE_URL.',
    reason,
  )
  return mockPrismaClient as unknown as ChatClient
}

async function connectChatDb(): Promise<ChatClient> {
  const url = process.env.CHAT_DATABASE_URL || process.env.DATABASE_URL
  if (!url) return useMemoryStore('no CHAT_DATABASE_URL / DATABASE_URL set')

  try {
    const client = globalForChat.chatPrisma ?? new PrismaClient({ datasourceUrl: url })
    globalForChat.chatPrisma = client
    try {
      await client.chatMessage.count({ where: { id: '__healthcheck__' } })
    } catch (err: any) {
      // P2021: table does not exist yet — create it, then re-check
      if (err?.code !== 'P2021') throw err
      for (const sql of CREATE_CHAT_TABLE_SQL) await client.$executeRawUnsafe(sql)
      await client.chatMessage.count({ where: { id: '__healthcheck__' } })
    }
    globalForChat.chatStoreKind = 'postgres'
    globalForChat.chatStoreError = undefined
    return client
  } catch (err: any) {
    // Retry Postgres periodically instead of caching the failure forever
    globalForChat.chatRetryAt = Date.now() + RETRY_POSTGRES_MS
    return useMemoryStore(err?.code || err?.errorCode || 'connection failed')
  }
}

/** Shared chat store (Postgres when available). */
export function getChatDb(): Promise<ChatClient> {
  if (globalForChat.chatRetryAt && Date.now() > globalForChat.chatRetryAt) {
    globalForChat.chatRetryAt = undefined
    globalForChat.chatDbPromise = undefined
  }
  globalForChat.chatDbPromise ??= connectChatDb()
  return globalForChat.chatDbPromise
}

/** Which store chat is currently using, for diagnostics. */
export function getChatStoreStatus(): { store: ChatStoreKind; error?: string } {
  return { store: globalForChat.chatStoreKind || 'memory', error: globalForChat.chatStoreError }
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
