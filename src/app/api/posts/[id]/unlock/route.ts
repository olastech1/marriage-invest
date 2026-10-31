import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PaymentsNotConfiguredError, startPayment } from '@/lib/payments'
import { UnlockError, postUrl, unlockPost } from '@/lib/posts'
import { WalletBalanceError } from '@/lib/wallet'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// POST /api/posts/[id]/unlock  { source: card | wallet }
// Card: returns a Stripe checkout link. Wallet: pays from wallet cash at once.
// Credit can't be used here: it would become the author's withdrawable cash.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return NextResponse.json({ success: false, error: 'Sign in to unlock this post.' }, { status: 401 })
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const post = await prisma.profilePost.findUnique({ where: { id } })
  if (!post?.price) return NextResponse.json({ success: false, error: 'This post is no longer available.' }, { status: 404 })
  if (post.authorId === me) return NextResponse.json({ success: false, error: "That's your own post." }, { status: 400 })
  if (await prisma.postUnlock.findUnique({ where: { postId_buyerId: { postId: id, buyerId: me } } })) {
    return NextResponse.json({ success: true, message: 'You already unlocked this post.' })
  }
  const amount = Number(post.price)
  const name = session.user.name || 'Member'

  if (body.source === 'wallet') {
    try {
      await unlockPost({ postId: id, buyerId: me, buyerName: name, source: 'WALLET' })
      return NextResponse.json({ success: true, message: 'Post unlocked.' })
    } catch (error) {
      if (error instanceof WalletBalanceError || error instanceof UnlockError) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ success: true, message: 'You already unlocked this post.' })
      }
      throw error
    }
  }

  const back = await postUrl(post.authorId, id)
  try {
    const checkoutUrl = await startPayment({
      purpose: 'POST_UNLOCK',
      amount,
      userId: me,
      userName: name,
      email: session.user.email,
      title: 'Unlock a post',
      payload: { postId: id },
      origin: req.nextUrl.origin,
      cancelPath: back,
    })
    return NextResponse.json({ success: true, checkoutUrl })
  } catch (error) {
    if (error instanceof PaymentsNotConfiguredError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 503 })
    }
    console.error('[POST /api/posts/[id]/unlock]', error)
    return NextResponse.json({ success: false, error: 'Could not start the payment. Please try again.' }, { status: 502 })
  }
}
