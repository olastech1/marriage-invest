import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
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
  const amount = Math.round(Number(form.get('amount')) * 100) / 100
  if (!(amount >= 10)) return NextResponse.redirect(`${origin}/save`, 303)

  try {
    const checkoutUrl = await startPayment({
      purpose: 'VAULT_DEPOSIT',
      amount,
      userId: session.user.id,
      userName: session.user.name || 'Member',
      email: session.user.email,
      title: 'Joint vault deposit',
      description: 'Deposit into your Union Verify joint vault',
      payload: { note: '', isReciprocalMatch: false },
      origin,
      cancelPath: '/chat',
    })
    return NextResponse.redirect(checkoutUrl, 303)
  } catch (error) {
    if (!(error instanceof PaymentsNotConfiguredError)) console.error('[/pay/deposit]', error)
    return NextResponse.redirect(`${origin}/save?amount=${amount}`, 303)
  }
}
