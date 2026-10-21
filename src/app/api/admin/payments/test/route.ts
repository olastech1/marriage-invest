import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/lib/auth'
import { getStripeConfig } from '@/lib/stripeConfig'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const config = await getStripeConfig()
    // A masked key (sk_…1234) from the admin UI means "use the stored key"
    const typedKey = body.secretKey && !String(body.secretKey).includes('…') ? body.secretKey : ''
    const secretKey = (typedKey || config.secretKey || process.env.STRIPE_SECRET_KEY || '').trim()

    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: 'No Stripe Secret Key provided or configured.' },
        { status: 400 }
      )
    }

    if (secretKey.includes('placeholder')) {
      return NextResponse.json(
        {
          success: false,
          error: 'The configured Stripe key is a placeholder, so no payments can be taken. Enter a real Stripe secret key (sk_test_... or sk_live_...).',
        },
        { status: 400 }
      )
    }

    // Initialize Stripe client
    const stripe = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
    })

    // Perform API handshake by retrieving account balance
    const balance = await stripe.balance.retrieve()

    return NextResponse.json({
      success: true,
      livemode: balance.livemode,
      isSandbox: false,
      mode: balance.livemode ? 'LIVE_PRODUCTION' : 'TEST_SANDBOX',
      currency: balance.available?.[0]?.currency?.toUpperCase() || 'USD',
      availableBalance: balance.available?.map((b) => ({
        amount: b.amount / 100,
        currency: b.currency.toUpperCase(),
      })),
      pendingBalance: balance.pending?.map((b) => ({
        amount: b.amount / 100,
        currency: b.currency.toUpperCase(),
      })),
      message: `Stripe accepted the key. Mode: ${balance.livemode ? 'live' : 'test'}.`,
    })
  } catch (error: any) {
    console.error('[POST /api/admin/payments/test]', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Stripe API connection failed.',
        code: error.code || error.type,
      },
      { status: 400 }
    )
  }
}
