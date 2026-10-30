import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCoupleDeposits } from '@/lib/reciprocation'
import { getPartnerIds, isPartner } from '@/lib/partners'
import { PaymentsNotConfiguredError, startPayment } from '@/lib/payments'

export const dynamic = 'force-dynamic'

// GET /api/savings/deposits?partner=<id>  every deposit in my vault with that partner
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const currentUserId = session?.user?.id
    if (!currentUserId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
    const partnerId = req.nextUrl.searchParams.get('partner') || (await getPartnerIds(currentUserId))[0] || ''
    const deposits = await getCoupleDeposits(currentUserId, partnerId)

    return NextResponse.json({
      success: true,
      deposits,
      summary: {
        totalDeposited: deposits.reduce((sum, d) => sum + d.amount, 0),
        approvedCount: deposits.filter((d) => d.status === 'APPROVED').length,
        pendingCount: deposits.filter((d) => d.status === 'PENDING_MATCH').length,
      },
    })
  } catch (error: any) {
    console.error('[GET /api/savings/deposits]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/savings/deposits { amount, partnerId, note? }
// Starts a Stripe Checkout for a deposit into my vault with that partner; it is recorded only once paid.
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })
    const body = await req.json()
    const amount = Math.round(Number(body.amount) * 100) / 100
    if (!(amount >= 10)) {
      return NextResponse.json({ success: false, error: 'The minimum deposit is $10.' }, { status: 400 })
    }
    const partnerId = String(body.partnerId || '')
    if (!(await isPartner(userId, partnerId))) {
      return NextResponse.json({ success: false, error: 'Choose which partner this deposit is for.' }, { status: 400 })
    }

    const checkoutUrl = await startPayment({
      purpose: 'VAULT_DEPOSIT',
      amount,
      userId,
      userName: session.user.name || 'Member',
      email: session.user.email,
      title: 'Joint vault deposit',
      description: `Deposit into your Union Verify joint vault`,
      payload: { note: String(body.note || '').slice(0, 200), partnerId },
      origin: req.nextUrl.origin,
      cancelPath: `/save?partner=${encodeURIComponent(partnerId)}`,
    })
    return NextResponse.json({ success: true, checkoutUrl })
  } catch (error: any) {
    if (error instanceof PaymentsNotConfiguredError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 503 })
    }
    console.error('[POST /api/savings/deposits]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
