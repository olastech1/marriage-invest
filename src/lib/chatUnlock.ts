/**
 * Locked photos and videos in chat: the sender sets a price, the person they
 * sent it to pays (card or wallet cash, never credit) to see it, and the sender
 * gets it as wallet cash. The price and a tiny blurred preview live in the
 * message's proposalData.
 */

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { UnlockError, refundToWallet, settleSale } from '@/lib/posts'

type LockedData = { mediaId?: string; price?: number }

export const lockedPrice = (data: unknown) => {
  const price = Number((data as LockedData | null)?.price)
  return price > 0 ? price : 0
}

/** Can this viewer open the photo/video of a chat message? (both are in the thread already) */
export async function canSeeChatMedia(mediaId: string, threadId: string, viewerId: string) {
  const msg = await prisma.chatMessage.findFirst({
    where: { threadId, proposalData: { path: ['mediaId'], equals: mediaId } },
    select: { id: true, senderId: true, proposalData: true },
  })
  if (!msg || !lockedPrice(msg.proposalData) || msg.senderId === viewerId) return true
  return !!(await prisma.chatUnlock.findUnique({ where: { messageId_buyerId: { messageId: msg.id, buyerId: viewerId } }, select: { id: true } }))
}

export async function unlockChatMessage(input: { messageId: string; buyerId: string; buyerName: string; source: 'CARD' | 'WALLET'; paymentRef?: string }) {
  const msg = await prisma.chatMessage.findUnique({ where: { id: input.messageId } })
  const amount = msg ? lockedPrice(msg.proposalData) : 0
  if (!msg || !amount) throw new UnlockError('This photo or video is no longer available.')
  if (msg.recipientId !== input.buyerId) throw new UnlockError('Only the person it was sent to can unlock it.')

  const already = await prisma.chatUnlock.findUnique({ where: { messageId_buyerId: { messageId: msg.id, buyerId: input.buyerId } } })
  if (already) {
    if (input.source === 'CARD') await refundToWallet(input.buyerId, amount, 'Refund: you had already unlocked this')
    return { msg, refunded: input.source === 'CARD' }
  }
  await settleSale({
    buyerId: input.buyerId,
    buyerName: input.buyerName,
    sellerId: msg.senderId,
    amount,
    source: input.source,
    what: msg.type === 'video' ? 'video' : 'photo',
    record: (tx) =>
      tx.chatUnlock.create({
        data: { messageId: msg.id, buyerId: input.buyerId, amount: new Prisma.Decimal(amount), source: input.source, paymentRef: input.paymentRef },
      }),
  })
  return { msg, refunded: false }
}
