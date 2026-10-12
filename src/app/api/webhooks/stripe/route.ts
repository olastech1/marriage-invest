import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key', {
  apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('stripe-signature')

    let event: Stripe.Event

    if (process.env.STRIPE_WEBHOOK_SECRET && !process.env.STRIPE_WEBHOOK_SECRET.includes('placeholder')) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
      }
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
      } catch (err: any) {
        console.error('[Stripe Webhook] Signature verification failed:', err.message)
        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
      }
    } else {
      // Mock event in test / development environment without real webhook secret
      try {
        event = JSON.parse(rawBody) as Stripe.Event
      } catch {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
      }
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const paymentIntentId = paymentIntent.id

        // Find associated transaction
        const txn = await prisma.transaction.findUnique({
          where: { stripePaymentIntentId: paymentIntentId },
          include: { investment: true },
        })

        if (txn) {
          await prisma.$transaction(async (tx) => {
            // Update transaction to COMPLETED
            await tx.transaction.update({
              where: { id: txn.id },
              data: {
                status: 'COMPLETED',
                processedAt: new Date(),
              },
            })

            // If linked to an investment, activate it and increase fundedAmount
            if (txn.investmentId && txn.investment) {
              await tx.investment.update({
                where: { id: txn.investmentId },
                data: {
                  status: 'ACTIVE',
                  confirmedAt: new Date(),
                },
              })

              await tx.investmentOpportunity.update({
                where: { id: txn.investment.opportunityId },
                data: {
                  fundedAmount: {
                    increment: txn.investment.amount,
                  },
                },
              })
            }

            // Audit record
            await tx.auditLog.create({
              data: {
                userId: txn.userId,
                action: 'PAYMENT_SETTLED_WEBHOOK',
                entity: 'Transaction',
                entityId: txn.id,
                after: { status: 'COMPLETED', paymentIntentId },
              },
            })
          })
        }
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
