import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PaymentsNotConfiguredError, startPayment } from '@/lib/payments'

const investSchema = z.object({
  amount: z.number().positive('Investment amount must be positive'),
})

type Params = { params: Promise<{ id: string }> }

// ---------------------------------------------------------------------------
// POST /api/investments/[id]/invest { amount }
// Starts a Stripe Checkout for an investment in an admin-created opportunity.
// The investment is created only after the payment succeeds.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

    const parsed = investSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid amount.' }, { status: 422 })
    }
    const amount = Math.round(parsed.data.amount * 100) / 100

    const { id } = await params
    const opportunity = await prisma.investmentOpportunity.findFirst({ where: { OR: [{ id }, { slug: id }] } })
    if (!opportunity) {
      return NextResponse.json({ error: 'Investment opportunity not found' }, { status: 404 })
    }
    if (opportunity.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'This opportunity is not open for investment.' }, { status: 400 })
    }

    const minAmount = Number(opportunity.minAmount)
    const maxAmount = opportunity.maxAmount ? Number(opportunity.maxAmount) : null
    if (amount < minAmount) {
      return NextResponse.json({ error: `The minimum investment is $${minAmount.toLocaleString()}.` }, { status: 400 })
    }
    if (maxAmount !== null && amount > maxAmount) {
      return NextResponse.json({ error: `The maximum investment is $${maxAmount.toLocaleString()}.` }, { status: 400 })
    }
    const remaining = Number(opportunity.targetAmount) - Number(opportunity.fundedAmount)
    if (amount > remaining) {
      return NextResponse.json({ error: `Only $${Math.max(0, remaining).toLocaleString()} of this round remains.` }, { status: 400 })
    }

    const checkoutUrl = await startPayment({
      purpose: 'INVESTMENT',
      amount,
      userId,
      userName: session.user.name || 'Member',
      email: session.user.email,
      title: `Investment: ${opportunity.title}`,
      description: opportunity.shortDescription,
      payload: { opportunityId: opportunity.id },
      origin: req.nextUrl.origin,
      cancelPath: `/investments/${opportunity.slug}`,
    })
    return NextResponse.json({ success: true, checkoutUrl })
  } catch (error) {
    if (error instanceof PaymentsNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('[POST /api/investments/[id]/invest]', error)
    return NextResponse.json({ error: 'Could not start the payment. Please try again.' }, { status: 500 })
  }
}
