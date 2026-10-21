import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { recordStripeDeposit } from '@/lib/stripeDeposits'
import { getStripeConfig } from '@/lib/stripeConfig'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('stripe-signature')

    const config = await getStripeConfig()
    const stripe = new Stripe(config.secretKey || 'sk_test_placeholder_key', {
      apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
    })
    const webhookSecret = config.webhookSecret || 'whsec_placeholder'

    let event: Stripe.Event

    if (webhookSecret && !webhookSecret.includes('placeholder')) {
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
      case 'checkout.session.completed': {
        const checkoutSession = event.data.object as Stripe.Checkout.Session
        const metadata = checkoutSession.metadata || {}
        const userId = metadata.userId || checkoutSession.client_reference_id || 'usr_jane_doe'
        const type = metadata.type || 'DEPOSIT'
        const numAmount = Number(metadata.amount) || (checkoutSession.amount_total ? checkoutSession.amount_total / 100 : 0)
        const paymentIntentId = typeof checkoutSession.payment_intent === 'string' ? checkoutSession.payment_intent : checkoutSession.id

        if (type === 'DEPOSIT') {
          const applyBonus = metadata.applyBonus === 'true'
          const bonusAmount = applyBonus ? Math.round(numAmount * 0.10 * 100) / 100 : 0
          const totalAdded = numAmount + bonusAmount
          const reference = `DEP-STRIPE-${Date.now().toString(36).toUpperCase()}`

          const txn = await prisma.transaction.create({
            data: {
              userId,
              type: 'DEPOSIT',
              amount: totalAdded as any,
              fee: 0 as any,
              netAmount: totalAdded as any,
              status: 'COMPLETED',
              reference,
              stripePaymentIntentId: paymentIntentId,
              description: `Stripe Card Deposit ($${numAmount.toLocaleString()})${bonusAmount > 0 ? ` + 10% Cash Match ($${bonusAmount.toLocaleString()})` : ''}`,
              metadata: {
                ...metadata,
                stripeSessionId: checkoutSession.id,
                bonusMatch: bonusAmount,
                totalAdded,
              },
              processedAt: new Date(),
            },
          })

          // Couple chat card + spouse notification (idempotent per checkout session)
          await recordStripeDeposit(checkoutSession)

          // Bonus notification
          if (bonusAmount > 0) {
            await prisma.notification.create({
              data: {
                userId,
                title: `+$${bonusAmount.toLocaleString()} cash match credited`,
                message: `Your card deposit of $${numAmount.toLocaleString()} earned a $${bonusAmount.toLocaleString()} match. Total credited: $${totalAdded.toLocaleString()}.`,
                type: 'SUCCESS',
                read: false,
                link: '/save',
                category: 'BONUS_MATCH',
                requiresAction: false,
                attended: true,
              } as any,
            }).catch(console.error)
          }

          // Audit log
          await prisma.auditLog.create({
            data: {
              userId,
              action: 'STRIPE_CHECKOUT_DEPOSIT_SETTLED',
              entity: 'Transaction',
              entityId: txn.id,
              after: { amount: numAmount, bonusAmount, totalAdded, paymentIntentId },
            },
          }).catch(console.error)
        }
        break
      }

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
