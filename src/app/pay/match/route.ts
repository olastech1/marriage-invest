import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PaymentsNotConfiguredError, startPayment } from '@/lib/payments'
import { findPendingDeposit } from '@/lib/reciprocation'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// /pay/match?deposit=<id> — one tap to reciprocate ONE of the spouse's deposits.
// Opens Stripe Checkout for that deposit's amount only (never a running total;
// the amount always comes from the server). Without a deposit id, the oldest
// pending deposit is used. Recorded only after the payment succeeds.
// ---------------------------------------------------------------------------
async function reciprocate(req: NextRequest, depositId: string | null) {
  const origin = req.nextUrl.origin
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(`${origin}/login?callbackUrl=${encodeURIComponent('/chat')}`, 303)
  }

  const deposit = await findPendingDeposit(session.user.id, depositId)
  if (!deposit) return NextResponse.redirect(`${origin}/chat`, 303)

  const day = new Date(deposit.depositedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  try {
    const checkoutUrl = await startPayment({
      purpose: 'VAULT_DEPOSIT',
      amount: deposit.amount,
      userId: session.user.id,
      userName: session.user.name || 'Member',
      email: session.user.email,
      title: `Reciprocate ${deposit.depositorName}'s $${deposit.amount.toLocaleString()} deposit`,
      description: `Deposit made on ${day}${deposit.note ? ` — "${deposit.note}"` : ''}`,
      payload: { isReciprocalMatch: true, forDepositId: deposit.messageId },
      origin,
      cancelPath: '/chat',
    })
    return NextResponse.redirect(checkoutUrl, 303)
  } catch (error) {
    if (!(error instanceof PaymentsNotConfiguredError)) console.error('[/pay/match]', error)
    return NextResponse.redirect(`${origin}/chat?payment=unavailable`, 303)
  }
}

export function GET(req: NextRequest) {
  return reciprocate(req, req.nextUrl.searchParams.get('deposit'))
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  const depositId = (form?.get('deposit') as string | null) || req.nextUrl.searchParams.get('deposit')
  return reciprocate(req, depositId)
}
