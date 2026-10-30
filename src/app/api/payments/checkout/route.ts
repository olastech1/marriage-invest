import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createCheckoutSession } from '@/lib/checkout'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const currentUserId = session?.user?.id
    if (!currentUserId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
    const currentUserName = session?.user?.name || 'Investor'

    const body = await req.json()
    const {
      amount,
      type = 'DEPOSIT', // 'DEPOSIT' | 'INVESTMENT' | 'WEDDING_GIFT' | 'REGISTRATION'
      title = 'Union Verify Deposit',
      description = 'Mutual Partner Contribution Vault',
      metadata = {},
      successUrl,
      cancelUrl,
    } = body

    const numAmount = Number(amount)
    if (!numAmount || numAmount < 1) {
      return NextResponse.json({ error: 'Valid amount in USD is required (minimum $1).' }, { status: 400 })
    }

    const result = await createCheckoutSession({
      userId: currentUserId,
      userName: currentUserName,
      email: session?.user?.email,
      amount: numAmount,
      type,
      title,
      description,
      metadata,
      successUrl,
      cancelUrl,
    })

    // Sandbox mode (no Stripe keys): caller records the deposit directly
    if (result.sandbox) {
      return NextResponse.json({
        success: true,
        isSandbox: true,
        message: 'Sandbox mode active. Mock checkout can be confirmed immediately.',
        amount: numAmount,
        type,
      })
    }

    return NextResponse.json({
      success: true,
      isSandbox: false,
      checkoutUrl: result.url,
      sessionId: result.sessionId,
    })
  } catch (error: any) {
    console.error('[POST /api/payments/checkout]', error)
    return NextResponse.json({ error: error.message || 'Failed to initiate checkout.' }, { status: 500 })
  }
}
