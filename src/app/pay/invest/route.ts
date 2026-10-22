import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PaymentsNotConfiguredError, startPayment } from '@/lib/payments'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// POST /pay/invest (form: opportunityId, amount)
// One tap from an "Invest $X" invitation in chat: opens Stripe Checkout for an
// investment in an open opportunity. Created only after the payment succeeds.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(`${origin}/login?callbackUrl=${encodeURIComponent('/chat')}`, 303)
  }

  const form = await req.formData()
  const opportunity = await prisma.investmentOpportunity.findUnique({ where: { id: String(form.get('opportunityId') || '') } })
  if (!opportunity || opportunity.status !== 'ACTIVE') return NextResponse.redirect(`${origin}/solo`, 303)
  const amount = Math.round(Number(form.get('amount')) * 100) / 100
  const remaining = Number(opportunity.targetAmount) - Number(opportunity.fundedAmount)
  const max = opportunity.maxAmount ? Number(opportunity.maxAmount) : Infinity
  if (!(amount >= Number(opportunity.minAmount)) || amount > max || amount > remaining) {
    return NextResponse.redirect(`${origin}/investments/${opportunity.slug}`, 303)
  }

  try {
    const checkoutUrl = await startPayment({
      purpose: 'INVESTMENT',
      amount,
      userId: session.user.id,
      userName: session.user.name || 'Member',
      email: session.user.email,
      title: `Investment: ${opportunity.title}`,
      description: opportunity.shortDescription,
      payload: { opportunityId: opportunity.id },
      origin,
      cancelPath: '/chat',
    })
    return NextResponse.redirect(checkoutUrl, 303)
  } catch (error) {
    if (!(error instanceof PaymentsNotConfiguredError)) console.error('[/pay/invest]', error)
    return NextResponse.redirect(`${origin}/investments/${opportunity.slug}`, 303)
  }
}
