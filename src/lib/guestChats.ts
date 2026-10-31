/**
 * Visitors (no account) chat as "guest_…". When one joins, their visitor
 * conversations move into the new account, so they stop showing as visitors.
 *
 *  - A signed pass in the sign-up link (shown to the visitor after they write,
 *    in the reply email, and in an invite) moves that one conversation, even
 *    if they sign up with another email.
 *  - Once they confirm their email, every conversation they started as a
 *    visitor with that email moves too (only ones started before the account
 *    existed, so nobody can write "as" an existing member).
 */

import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { buildThreadId } from '@/lib/chat'

export const guestIdFor = (email: string) => `guest_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`

function sign(value: string) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || ''
  return crypto.createHmac('sha256', `guest-claim:${secret}`).update(value).digest('base64url')
}

/** A pass for the conversation between a visitor and a member */
export function guestClaimToken(guestId: string, memberId: string) {
  const value = Buffer.from(`${guestId}|${memberId}`).toString('base64url')
  return `${value}.${sign(value)}`
}

function readClaimToken(token: string): { guestId: string; memberId: string } | null {
  const [value, sig] = token.split('.')
  if (!value || !sig) return null
  const expected = sign(value)
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  const [guestId, memberId] = Buffer.from(value, 'base64url').toString().split('|')
  return guestId?.startsWith('guest_') && memberId ? { guestId, memberId } : null
}

/** Move one visitor conversation (with `memberId`) into the account `userId` */
async function moveThread(guestId: string, memberId: string, userId: string) {
  if (memberId === userId) return 0
  const threadId = buildThreadId(guestId, memberId)
  const newThread = buildThreadId(userId, memberId)
  const [sent, received] = await prisma.$transaction([
    prisma.chatMessage.updateMany({ where: { threadId, senderId: guestId }, data: { senderId: userId, threadId: newThread } }),
    prisma.chatMessage.updateMany({ where: { threadId, recipientId: guestId }, data: { recipientId: userId, threadId: newThread } }),
    // Anything else left in that thread (e.g. system cards)
    prisma.chatMessage.updateMany({ where: { threadId }, data: { threadId: newThread } }),
  ])
  // The member had them in their chats: keep them there as the member
  const contact = await prisma.contact.findFirst({ where: { ownerId: memberId, contactId: guestId } }).catch(() => null)
  if (contact) {
    await prisma.contact
      .upsert({ where: { ownerId_contactId: { ownerId: memberId, contactId: userId } }, update: {}, create: { ownerId: memberId, contactId: userId } })
      .catch(() => {})
    await prisma.contact.deleteMany({ where: { ownerId: memberId, contactId: guestId } }).catch(() => {})
  }
  return sent.count + received.count
}

/** Sign-up with a pass from the link: move that conversation */
export async function claimWithToken(token: string, userId: string) {
  const claim = token ? readClaimToken(token) : null
  if (!claim) return 0
  return moveThread(claim.guestId, claim.memberId, userId)
}

/** Email confirmed: move the conversations they started as a visitor with this email */
export async function claimByVerifiedEmail(user: { id: string; email: string; createdAt: Date }) {
  const guestId = guestIdFor(user.email)
  const started = await prisma.chatMessage.findMany({
    where: { senderId: guestId, createdAt: { lt: user.createdAt } },
    select: { recipientId: true, proposalData: true },
  })
  // Different emails can share a guest id (a.b@ and a_b@): the email they left must be this one
  const members = new Set(
    started
      .filter((m) => (m.proposalData as { guestEmail?: string } | null)?.guestEmail === user.email.toLowerCase())
      .map((m) => m.recipientId)
      .filter((id): id is string => !!id),
  )
  let moved = 0
  for (const memberId of members) moved += await moveThread(guestId, memberId, user.id)
  return moved
}
