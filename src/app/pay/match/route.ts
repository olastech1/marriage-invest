import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createCheckoutSession } from '@/lib/checkout'
import { getReciprocationStatus } from '@/lib/reciprocation'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// GET /pay/match
// One tap from any "Match" button: works out what the signed-in user owes
// their spouse and sends them straight to the Stripe payment page.
// The amount always comes from the server, never from the link.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(`${origin}/login?callbackUrl=${encodeURIComponent('/pay/match')}`, 303)
  }

  const { owedByMe, spouseName } = await getReciprocationStatus(session.user.id)
  if (owedByMe <= 0) {
    return NextResponse.redirect(`${origin}/save`, 303)
  }

  try {
    const checkout = await createCheckoutSession({
      userId: session.user.id,
      userName: session.user.name || 'Member',
      email: session.user.email,
      amount: owedByMe,
      type: 'DEPOSIT',
      title: `Match ${spouseName}'s deposit`,
      description: `Joint vault match for ${spouseName}`,
      metadata: {
        isReciprocalMatch: 'true',
        applyBonus: 'true',
        beneficiary: 'JOINT',
        partnerName: spouseName,
      },
      successUrl: `${origin}/save?checkout_success=true&session_id={CHECKOUT_SESSION_ID}&type=DEPOSIT`,
      cancelUrl: `${origin}/chat`,
    })

    // No Stripe keys configured: fall back to the save page with the match pre-filled
    if (checkout.sandbox || !checkout.url) {
      return NextResponse.redirect(`${origin}/save?match=${owedByMe}`, 303)
    }
    return NextResponse.redirect(checkout.url, 303)
  } catch (error) {
    console.error('[GET /pay/match]', error)
    return NextResponse.redirect(`${origin}/save?match=${owedByMe}`, 303)
  }
}
