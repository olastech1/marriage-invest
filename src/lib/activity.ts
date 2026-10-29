/**
 * Every account activity reaches people the same two ways:
 *   - a card in the couple chat (or the direct chat it belongs to)
 *   - an email to each person it concerns
 * Failures are logged and never block the action itself.
 */

import { prisma } from '@/lib/db'
import { createChatMessage, resolveSpouseId } from '@/lib/chat'
import { sendActivityEmail } from '@/lib/email'

export interface ActivityEmail {
  subject: string
  heading: string
  paragraphs: string[]
  ctaLabel?: string
  ctaPath?: string
}

/** Email a member by id (no-op if they have no account/email). */
export async function emailMember(userId: string | null | undefined, email: ActivityEmail): Promise<boolean> {
  if (!userId) return false
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (!user?.email) return false
  return sendActivityEmail({ to: user.email, ...email }).catch((err) => {
    console.error('[activity] email failed', err)
    return false
  })
}

/** Post a card into the couple chat between this member and their spouse (if linked). */
export async function postToCoupleChat(
  userId: string,
  userName: string,
  card: { type: string; text: string; proposalData?: Record<string, unknown>; depositData?: Record<string, unknown> },
  /** Post as Union Verify (e.g. an admin decision) instead of as the member */
  options: { fromPlatform?: boolean } = {},
) {
  const spouseId = await resolveSpouseId(userId)
  if (!spouseId) return null
  return createChatMessage({
    spouseOf: userId,
    data: {
      threadId: 'spouse',
      senderId: options.fromPlatform ? 'system_union_verify' : userId,
      senderName: options.fromPlatform ? 'Union Verify' : userName,
      recipientId: options.fromPlatform ? undefined : spouseId,
      text: card.text,
      timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
      type: card.type,
      ...(card.proposalData ? { proposalData: card.proposalData } : {}),
      ...(card.depositData ? { depositData: card.depositData } : {}),
    },
  }).catch((err) => {
    console.error('[activity] chat post failed', err)
    return null
  })
}
