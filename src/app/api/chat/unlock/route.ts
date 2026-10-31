import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PaymentsNotConfiguredError, startPayment } from '@/lib/payments'
import { UnlockError } from '@/lib/posts'
import { lockedPrice, unlockChatMessage } from '@/lib/chatUnlock'
import { WalletBalanceError } from '@/lib/wallet'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// POST /api/chat/unlock  { messageId, source: card | wallet }
// A locked photo/video sent to me. Card: a Stripe checkout link. Wallet: pays
// from wallet cash at once. Credit can't be used (it would become the sender's cash).
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const messageId = String(body.messageId || '')

  const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } })
  const amount = msg ? lockedPrice(msg.proposalData) : 0
  if (!msg || !amount || msg.recipientId !== me) return NextResponse.json({ success: false, error: 'Not found.' }, { status: 404 })
  if (await prisma.chatUnlock.findUnique({ where: { messageId_buyerId: { messageId, buyerId: me } } })) {
    return NextResponse.json({ success: true, message: 'You already unlocked this.' })
  }
  const name = session.user.name || 'Member'

  if (body.source === 'wallet') {
    try {
      await unlockChatMessage({ messageId, buyerId: me, buyerName: name, source: 'WALLET' })
      return NextResponse.json({ success: true, message: 'Unlocked.' })
    } catch (error) {
      if (error instanceof WalletBalanceError || error instanceof UnlockError) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ success: true, message: 'You already unlocked this.' })
      }
      throw error
    }
  }

  try {
    const checkoutUrl = await startPayment({
      purpose: 'CHAT_UNLOCK',
      amount,
      userId: me,
      userName: name,
      email: session.user.email,
      title: msg.type === 'video' ? 'Unlock a video' : 'Unlock a photo',
      payload: { messageId },
      origin: req.nextUrl.origin,
      cancelPath: `/chat?recipientId=${encodeURIComponent(msg.senderId)}`,
    })
    return NextResponse.json({ success: true, checkoutUrl })
  } catch (error) {
    if (error instanceof PaymentsNotConfiguredError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 503 })
    }
    console.error('[POST /api/chat/unlock]', error)
    return NextResponse.json({ success: false, error: 'Could not start the payment. Please try again.' }, { status: 502 })
  }
}
