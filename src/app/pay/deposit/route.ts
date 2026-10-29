import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PaymentsNotConfiguredError, startPayment } from '@/lib/payments'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// POST /pay/deposit (form field: amount)
// One tap from a deposit reminder in chat: opens Stripe Checkout for a joint
// vault deposit of that amount. Recorded only after the payment succeeds.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(`${origin}/login?callbackUrl=${encodeURIComponent('/chat')}`, 303)
  }

  const form = await req.formData()
  let amount = Math.round(Number(form.get('amount')) * 100) / 100
  let title = 'Joint vault deposit'
  let payload: Record<string, unknown> = { note: '', isReciprocalMatch: false }

  // My share of an approved proposal: the server sets the amount (half), once per person
  const proposalId = String(form.get('proposal') || '')
  if (proposalId) {
    const proposal = await prisma.chatMessage.findUnique({ where: { id: proposalId } })
    const data = (proposal?.proposalData || {}) as Record<string, unknown>
    const isParticipant = proposal && (proposal.senderId === session.user.id || proposal.recipientId === session.user.id)
    if (!proposal || proposal.type !== 'proposal' || !isParticipant || data.status !== 'approved') {
      return NextResponse.redirect(`${origin}/chat`, 303)
    }
    const alreadyPaid = await prisma.chatMessage.findFirst({
      where: { threadId: proposal.threadId, senderId: session.user.id, type: 'deposit_alert', depositData: { path: ['proposalId'], equals: proposalId } },
    })
    if (alreadyPaid) return NextResponse.redirect(`${origin}/chat`, 303)
    amount = Math.round((Number(data.amount) / 2) * 100) / 100
    title = `Your share for "${String(data.goalName || 'your plan')}"`
    payload = { proposalId }
  }
  if (!(amount >= 1)) return NextResponse.redirect(`${origin}/save`, 303)

  try {
    const checkoutUrl = await startPayment({
      purpose: 'VAULT_DEPOSIT',
      amount,
      userId: session.user.id,
      userName: session.user.name || 'Member',
      email: session.user.email,
      title,
      description: 'Deposit into your Union Verify joint vault',
      payload,
      origin,
      cancelPath: '/chat',
    })
    return NextResponse.redirect(checkoutUrl, 303)
  } catch (error) {
    if (!(error instanceof PaymentsNotConfiguredError)) console.error('[/pay/deposit]', error)
    return NextResponse.redirect(`${origin}/save?amount=${amount}`, 303)
  }
}
