/**
 * One-time links for email verification and password resets. The link holds a
 * random token; only its SHA-256 hash is stored, and each token works once.
 */

import crypto from 'crypto'
import { prisma } from '@/lib/db'

export type TokenKind = 'verify_email' | 'reset_password'

const hash = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

/** A new link token (earlier unused ones of the same kind stop working) */
export async function createAuthToken(userId: string, kind: TokenKind, ttlMs: number): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  await prisma.authToken.deleteMany({ where: { userId, kind, usedAt: null } })
  await prisma.authToken.create({ data: { userId, kind, tokenHash: hash(token), expiresAt: new Date(Date.now() + ttlMs) } })
  return token
}

/** The account a token belongs to, using it up; null if unknown, used or expired */
export async function consumeAuthToken(token: string, kind: TokenKind): Promise<string | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null
  const row = await prisma.authToken.findUnique({ where: { tokenHash: hash(token) } })
  if (!row || row.kind !== kind || row.usedAt || row.expiresAt < new Date()) return null
  const { count } = await prisma.authToken.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } })
  return count ? row.userId : null
}

/** True if a link of this kind was sent in the last `ms` (to avoid sending many) */
export async function sentRecently(userId: string, kind: TokenKind, ms: number) {
  return !!(await prisma.authToken.findFirst({ where: { userId, kind, createdAt: { gt: new Date(Date.now() - ms) } } }))
}
