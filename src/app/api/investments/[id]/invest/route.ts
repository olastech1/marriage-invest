import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import crypto from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

// ---------------------------------------------------------------------------
// Stripe client
// ---------------------------------------------------------------------------

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key', {
  apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
})

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const investSchema = z.object({
  amount: z.number().positive('Investment amount must be positive'),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
})

type Params = { params: Promise<{ id: string }> }

// ---------------------------------------------------------------------------
// POST /api/investments/[id]/invest
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    // 1. Authenticate
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const userId = session.user.id

    // 2. Parse & validate body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = investSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten().fieldErrors },
        { status: 422 },
      )
    }

    const { amount } = parsed.data
    const { id: opportunityId } = await params

    // 3. Find opportunity
    const opportunity = await prisma.investmentOpportunity.findFirst({
      where: {
        OR: [{ id: opportunityId }, { slug: opportunityId }],
      },
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Investment opportunity not found' }, { status: 404 })
    }

    if (opportunity.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `This opportunity is not open for investment (current status: ${opportunity.status})` },
        { status: 400 },
      )
    }

    // 4. Validate amount against limits
    const minAmount = Number(opportunity.minAmount)
    const maxAmount = opportunity.maxAmount ? Number(opportunity.maxAmount) : null

    if (amount < minAmount) {
      return NextResponse.json(
        { error: `Minimum investment amount is $${minAmount.toLocaleString()}` },
        { status: 400 },
      )
    }

    if (maxAmount !== null && amount > maxAmount) {
      return NextResponse.json(
        { error: `Maximum investment amount is $${maxAmount.toLocaleString()}` },
        { status: 400 },
      )
    }

    // 5. Check target funding capacity
    const currentFunded = Number(opportunity.fundedAmount)
    const targetAmount = Number(opportunity.targetAmount)

    if (currentFunded + amount > targetAmount) {
      const remaining = targetAmount - currentFunded
      return NextResponse.json(
        {
          error: `This investment would exceed the funding target. Maximum remaining allocation is $${remaining.toLocaleString()}`,
        },
        { status: 400 },
      )
    }

    // 6. Calculate maturity date
    const maturityDate = new Date()
    maturityDate.setMonth(maturityDate.getMonth() + opportunity.termMonths)

    // 7. Generate reference numbers
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase()
    const investmentRef = `INV-${new Date().getFullYear()}-${randomHex}`
    const transactionRef = `TXN-${new Date().getFullYear()}-${randomHex}`

    // 8. Create Stripe PaymentIntent or mock in dev
    let clientSecret: string | null = null
    let paymentIntentId = `pi_mock_${crypto.randomBytes(8).toString('hex')}`

    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        metadata: {
          userId,
          opportunityId: opportunity.id,
          investmentRef,
          transactionRef,
        },
        description: `Investment in "${opportunity.title}" — ref ${investmentRef}`,
      })
      clientSecret = paymentIntent.client_secret
      paymentIntentId = paymentIntent.id
    } else {
      clientSecret = `mock_secret_${randomHex}`
    }

    // 9. Create Investment + Transaction atomically
    await prisma.$transaction(async (tx) => {
      const investment = await tx.investment.create({
        data: {
          userId,
          opportunityId: opportunity.id,
          referenceNumber: investmentRef,
          amount: new Prisma.Decimal(amount),
          status: 'PENDING',
          maturityDate,
        },
      })

      await tx.transaction.create({
        data: {
          userId,
          investmentId: investment.id,
          type: 'DEPOSIT',
          amount: new Prisma.Decimal(amount),
          fee: new Prisma.Decimal(0),
          netAmount: new Prisma.Decimal(amount),
          status: 'PENDING',
          reference: transactionRef,
          stripePaymentIntentId: paymentIntentId,
          description: `Investment in "${opportunity.title}"`,
          metadata: {
            opportunityId: opportunity.id,
            opportunityTitle: opportunity.title,
            paymentIntentId,
          },
        },
      })
    })

    return NextResponse.json(
      {
        clientSecret,
        investmentRef,
        transactionRef,
        paymentIntentId,
        amount,
        opportunity: {
          id: opportunity.id,
          title: opportunity.title,
          slug: opportunity.slug,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[POST /api/investments/[id]/invest]', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
