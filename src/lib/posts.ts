/**
 * Profile posts: a caption with an optional photo or video, free or locked
 * behind a price. Unlocking pays the author into their wallet cash (which they
 * withdraw through the usual reviewed payout). Credit can't be used to unlock,
 * so credit never turns into withdrawable cash.
 */

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { moveWallet, walletRef } from '@/lib/wallet'

export const MIN_POST_PRICE = 1
export const MAX_POST_PRICE = 500
export const MAX_PINNED = 3
export const POST_REACTIONS = ['❤️', '👍', '😂', '😮', '🔥']

export const postThread = (authorId: string) => `post:${authorId}`

/** Can this viewer (signed out: '') see the photo or video of a post? */
export async function canSeePost(post: { id: string; authorId: string; price: Prisma.Decimal | null }, viewerId: string) {
  if (!post.price || Number(post.price) <= 0) return true
  if (!viewerId) return false
  if (viewerId === post.authorId) return true
  return !!(await prisma.postUnlock.findUnique({ where: { postId_buyerId: { postId: post.id, buyerId: viewerId } }, select: { id: true } }))
}

/** Who can open a stored post photo/video (used by /api/chat/media/[id]) */
export async function canSeePostMedia(mediaId: string, viewerId: string) {
  const post = await prisma.profilePost.findFirst({ where: { mediaId }, select: { id: true, authorId: true, price: true } })
  return post ? canSeePost(post, viewerId) : false
}

export class UnlockError extends Error {}

/**
 * A paid unlock (post or chat photo/video): take the buyer's wallet cash when
 * paying from the wallet, record the unlock and pay the seller, all in one
 * transaction; then tell the seller.
 */
export async function settleSale(input: {
  buyerId: string
  buyerName: string
  sellerId: string
  amount: number
  source: 'CARD' | 'WALLET'
  what: string
  record: (tx: Prisma.TransactionClient) => Promise<unknown>
}) {
  const reference = walletRef('PST')
  await prisma.$transaction(async (tx) => {
    if (input.source === 'WALLET') {
      await moveWallet(tx, { userId: input.buyerId, kind: 'CASH', amount: -input.amount, reason: `Unlocked a ${input.what}`, reference: `${reference}-B` })
    }
    await input.record(tx)
    await moveWallet(tx, { userId: input.sellerId, kind: 'CASH', amount: input.amount, reason: `${input.buyerName} unlocked your ${input.what}`, reference: `${reference}-S` })
  })
  await prisma.notification
    .create({
      data: {
        userId: input.sellerId,
        title: `${input.buyerName} unlocked your ${input.what}`,
        message: `$${input.amount.toLocaleString()} was added to your wallet.`,
        type: 'SUCCESS',
        link: '/wallet',
      },
    })
    .catch(() => {})
}

/** Card paid twice for the same thing: the second payment goes to the buyer's wallet */
export async function refundToWallet(userId: string, amount: number, reason: string) {
  await prisma.$transaction((tx) => moveWallet(tx, { userId, kind: 'CASH', amount, reason, reference: `TXN-${walletRef('REF')}` }))
}

/**
 * Record that `buyerId` paid for a post and pay its author. Wallet payments take
 * the buyer's cash in the same transaction. A card payment for a post that was
 * already unlocked (paid twice) goes back to the buyer's wallet cash.
 */
export async function unlockPost(input: { postId: string; buyerId: string; buyerName: string; source: 'CARD' | 'WALLET'; paymentRef?: string }) {
  const post = await prisma.profilePost.findUnique({ where: { id: input.postId } })
  if (!post || !post.price) throw new UnlockError('This post is no longer available.')
  if (post.authorId === input.buyerId) throw new UnlockError("That's your own post.")
  const amount = Number(post.price)

  const already = await prisma.postUnlock.findUnique({ where: { postId_buyerId: { postId: post.id, buyerId: input.buyerId } } })
  if (already) {
    if (input.source === 'CARD') {
      await refundToWallet(input.buyerId, amount, 'Refund: you had already unlocked this post')
      return { post, refunded: true }
    }
    return { post, refunded: false }
  }

  await settleSale({
    buyerId: input.buyerId,
    buyerName: input.buyerName,
    sellerId: post.authorId,
    amount,
    source: input.source,
    what: 'post',
    // The unique (post, buyer) stops a second unlock racing this one
    record: (tx) =>
      tx.postUnlock.create({
        data: { postId: post.id, buyerId: input.buyerId, amount: new Prisma.Decimal(amount), source: input.source, paymentRef: input.paymentRef },
      }),
  })
  return { post, refunded: false }
}

/** Where a post lives: the author's profile */
export async function postUrl(authorId: string, postId: string) {
  const author = await prisma.user.findUnique({ where: { id: authorId }, select: { username: true, accountNumber: true } })
  return `/u/${author?.username || author?.accountNumber || ''}#post-${postId}`
}
