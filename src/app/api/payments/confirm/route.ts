import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/lib/auth'
import { getStripeConfig } from '@/lib/stripeConfig'
import { fulfillPayment } from '@/lib/payments'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// POST /api/payments/confirm  { sessionId }
// Called when the payer returns from Stripe Checkout. Checks with Stripe that
// the session is paid and belongs to the signed-in user, then fulfills it
// (a no-op if the webhook already did).
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })

    const { sessionId } = await req.json()
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ success: false, error: 'sessionId is required' }, { status: 400 })
    }

    const config = await getStripeConfig()
    if (config.isPlaceholder || !config.secretKey) {
      return NextResponse.json({ success: false, error: 'Card payments are not set up.' }, { status: 400 })
    }

    const stripe = new Stripe(config.secretKey, { apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion })
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    const ownerId = checkoutSession.metadata?.userId || checkoutSession.client_reference_id
    if (ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'This payment belongs to another account.' }, { status: 403 })
    }
    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Your payment has not completed yet.', status: checkoutSession.payment_status },
        { status: 409 },
      )
    }

    const result = await fulfillPayment(checkoutSession)
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('[POST /api/payments/confirm]', error)
    return NextResponse.json({ success: false, error: 'We could not confirm your payment. Please contact support.' }, { status: 500 })
  }
}
