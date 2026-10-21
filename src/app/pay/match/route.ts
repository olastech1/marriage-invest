import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PaymentsNotConfiguredError, startPayment } from '@/lib/payments'
import { getReciprocationStatus } from '@/lib/reciprocation'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// /pay/match — one tap to reciprocate the spouse's deposit.
// Opens Stripe Checkout for exactly what the signed-in user still owes (the
// amount always comes from the server, never from the link). The
// reciprocation is recorded only after the payment succeeds.
// ---------------------------------------------------------------------------
async function reciprocate(req: NextRequest) {
  const origin = req.nextUrl.origin
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(`${origin}/login?callbackUrl=${encodeURIComponent('/chat')}`, 303)
  }

  const { owedByMe, spouseName } = await getReciprocationStatus(session.user.id)
  if (owedByMe <= 0) return NextResponse.redirect(`${origin}/chat`, 303)

  try {
    const checkoutUrl = await startPayment({
      purpose: 'VAULT_DEPOSIT',
      amount: owedByMe,
      userId: session.user.id,
      userName: session.user.name || 'Member',
      email: session.user.email,
      title: `Reciprocate ${spouseName}'s deposit`,
      description: `Joint vault reciprocation for ${spouseName}`,
      payload: { isReciprocalMatch: true },
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
  return reciprocate(req)
}

export function POST(req: NextRequest) {
  return reciprocate(req)
}
