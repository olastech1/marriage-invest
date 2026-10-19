import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const currentUserId = session?.user?.id || 'usr_jane_doe'
    const currentUserName = session?.user?.name || 'Investor'

    const body = await req.json()
    const {
      amount,
      type = 'DEPOSIT', // 'DEPOSIT' | 'INVESTMENT' | 'WEDDING_GIFT' | 'REGISTRATION'
      title = 'Union Verify Deposit',
      description = 'Mutual Spousal Contribution Vault',
      metadata = {},
      successUrl,
      cancelUrl,
    } = body

    const numAmount = Number(amount)
    if (!numAmount || numAmount < 1) {
      return NextResponse.json({ error: 'Valid amount in USD is required (minimum $1).' }, { status: 400 })
    }

    const secretKey = process.env.STRIPE_SECRET_KEY || ''
    const isSandbox = !secretKey || secretKey.includes('placeholder')
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://unionverify.com').replace(/\/$/, '')

    // If sandbox mode, return immediate simulation flag
    if (isSandbox) {
      return NextResponse.json({
        success: true,
        isSandbox: true,
        message: 'Sandbox mode active. Mock checkout can be confirmed immediately.',
        amount: numAmount,
        type,
      })
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
    })

    const finalSuccessUrl = successUrl || `${appUrl}/save?checkout_success=true&session_id={CHECKOUT_SESSION_ID}&type=${type}`
    const finalCancelUrl = cancelUrl || `${appUrl}/save?checkout_canceled=true`

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: title,
              description: description || `Union Verify ${type}`,
            },
            unit_amount: Math.round(numAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      client_reference_id: currentUserId,
      customer_email: session?.user?.email || undefined,
      metadata: {
        userId: currentUserId,
        userName: currentUserName,
        type,
        amount: String(numAmount),
        ...metadata,
      },
    })

    return NextResponse.json({
      success: true,
      isSandbox: false,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    })
  } catch (error: any) {
    console.error('[POST /api/payments/checkout]', error)
    return NextResponse.json({ error: error.message || 'Failed to initiate checkout.' }, { status: 500 })
  }
}
