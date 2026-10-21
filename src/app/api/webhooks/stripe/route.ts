import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { fulfillPayment } from '@/lib/payments'
import { getStripeConfig } from '@/lib/stripeConfig'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('stripe-signature')

    const config = await getStripeConfig()
    const stripe = new Stripe(config.secretKey || 'sk_test_placeholder_key', {
      apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
    })
    const webhookSecret = config.webhookSecret

    // Only signed events from Stripe are accepted. Without a webhook secret,
    // payments are still recorded via /api/payments/confirm on return from Checkout.
    if (!webhookSecret || webhookSecret.includes('placeholder')) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 })
    }
    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message)
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
    }

    switch (event.type) {
      // Paid checkouts are fulfilled exactly once (also done by /api/payments/confirm)
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        await fulfillPayment(event.data.object as Stripe.Checkout.Session)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await prisma.transaction.updateMany({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: { status: 'FAILED' },
        })
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string | undefined
        if (paymentIntentId) {
          await prisma.transaction.updateMany({
            where: { stripePaymentIntentId: paymentIntentId },
            data: { status: 'REFUNDED' },
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[POST /api/webhooks/stripe]', error)
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 })
  }
}
