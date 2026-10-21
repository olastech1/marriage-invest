import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createCheckoutSession } from '@/lib/checkout'
import { getReciprocationStatus } from '@/lib/reciprocation'
import { recordVaultDeposit } from '@/lib/vaultDeposits'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// /pay/match — one tap to reciprocate the spouse's deposit.
// The amount always comes from the server (what the user still owes).
//
//   POST (Reciprocate button): Stripe payment page if Stripe is configured,
//        otherwise records the reciprocation immediately and returns to chat.
//   GET  (plain links, e.g. notifications): Stripe payment page if configured,
//        otherwise the chat, where the Reciprocate button is. Never records.
// ---------------------------------------------------------------------------
async function reciprocate(req: NextRequest, allowDirectRecord: boolean) {
  const origin = req.nextUrl.origin
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(`${origin}/login?callbackUrl=${encodeURIComponent('/chat')}`, 303)
  }

  const userId = session.user.id
  const userName = session.user.name || 'Member'
  const { owedByMe, spouseName } = await getReciprocationStatus(userId)
  if (owedByMe <= 0) return NextResponse.redirect(`${origin}/chat`, 303)

  try {
    const checkout = await createCheckoutSession({
      userId,
      userName,
      email: session.user.email,
      amount: owedByMe,
      type: 'DEPOSIT',
      title: `Reciprocate ${spouseName}'s deposit`,
      description: `Joint vault reciprocation for ${spouseName}`,
      metadata: { isReciprocalMatch: 'true', applyBonus: 'false', beneficiary: 'JOINT', partnerName: spouseName },
      successUrl: `${origin}/chat?checkout_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/chat`,
    })
    if (!checkout.sandbox && checkout.url) return NextResponse.redirect(checkout.url, 303)
  } catch (error) {
    console.error('[/pay/match] Stripe checkout failed', error)
    return NextResponse.redirect(`${origin}/chat`, 303)
  }

  // No Stripe configured
  if (allowDirectRecord) {
    await recordVaultDeposit({ userId, userName, amount: owedByMe, isReciprocalMatch: true })
  }
  return NextResponse.redirect(`${origin}/chat`, 303)
}

export function GET(req: NextRequest) {
  return reciprocate(req, false)
}

export function POST(req: NextRequest) {
  return reciprocate(req, true)
}
