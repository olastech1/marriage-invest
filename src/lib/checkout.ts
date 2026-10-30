/**
 * Stripe Checkout session creation, shared by /api/payments/checkout and the
 * one-tap /pay/match redirect.
 */

import Stripe from 'stripe'
import { getStripeConfig } from '@/lib/stripeConfig'
import { siteUrl } from '@/lib/site'

export interface CheckoutInput {
  userId: string
  userName: string
  email?: string | null
  amount: number
  type?: string
  title: string
  description?: string
  metadata?: Record<string, string>
  successUrl?: string
  cancelUrl?: string
}

export type CheckoutResult = { sandbox: true } | { sandbox: false; url: string; sessionId: string }

export function appUrl(): string {
  return siteUrl()
}

export async function createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult> {
  const config = await getStripeConfig()
  if (config.isPlaceholder || !config.secretKey) return { sandbox: true }

  const type = input.type || 'DEPOSIT'
  const stripe = new Stripe(config.secretKey, {
    apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
  })

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: input.title,
            description: input.description || `Union Verify ${type}`,
          },
          unit_amount: Math.round(input.amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: input.successUrl || `${appUrl()}/save?checkout_success=true&session_id={CHECKOUT_SESSION_ID}&type=${type}`,
    cancel_url: input.cancelUrl || `${appUrl()}/save?checkout_canceled=true`,
    client_reference_id: input.userId,
    customer_email: input.email || undefined,
    metadata: {
      userId: input.userId,
      userName: input.userName,
      type,
      amount: String(input.amount),
      ...input.metadata,
    },
  })

  return { sandbox: false, url: session.url || '', sessionId: session.id }
}
