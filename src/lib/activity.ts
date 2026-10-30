/**
 * Every account activity reaches people the same two ways:
 *   - a card in the couple chat (or the direct chat it belongs to)
 *   - an email to each person it concerns
 * Failures are logged and never block the action itself.
 */

import { prisma } from '@/lib/db'
import { buildThreadId, createChatMessage } from '@/lib/chat'
import { isPartner } from '@/lib/partners'
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

/** Post a card into the chat between this member and one of their partners */
export async function postToCoupleChat(
  userId: string,
  userName: string,
  /** The partner the activity is shared with (nothing is posted without one) */
  partnerId: string | null | undefined,
  card: { type: string; text: string; proposalData?: Record<string, unknown>; depositData?: Record<string, unknown> },
  /** Post as Union Verify (e.g. an admin decision) instead of as the member */
  options: { fromPlatform?: boolean } = {},
) {
  const spouseId = partnerId && (await isPartner(userId, partnerId)) ? partnerId : ''
  if (!spouseId) return null
  return createChatMessage({
    data: {
      threadId: buildThreadId(userId, spouseId),
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
