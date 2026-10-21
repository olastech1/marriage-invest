import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import crypto from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createChatMessage, resolveSpouseId } from '@/lib/chat'
import { getSpouseName } from '@/lib/reciprocation'
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
  soloTier: z.string().optional(),
  tier: z.string().optional(),
  frequency: z.string().optional(),
  type: z.string().optional(),
  beneficiary: z.string().optional(),
  partnerNote: z.string().optional(),
  partnerName: z.string().optional(),
  isReciprocalMatch: z.boolean().optional(),
})

type Params = { params: Promise<{ id: string }> }

// ---------------------------------------------------------------------------
// POST /api/investments/[id]/invest
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    // 1. Authenticate
    const session = await auth()
    const userId = session?.user?.id || 'usr_jane_doe'

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
    const tierKey = parsed.data.soloTier || parsed.data.tier
    const isSolo = Boolean(tierKey || parsed.data.type === 'SOLO')
    const isSave = Boolean(parsed.data.frequency || parsed.data.type === 'SAVE')

    // 3. Find opportunity
    let opportunity = await prisma.investmentOpportunity.findFirst({
      where: {
        OR: [{ id: opportunityId }, { slug: opportunityId }],
      },
    })

    // If opportunityId is generic or not found for solo/save, use the first active opportunity
    if (!opportunity && (isSolo || isSave)) {
      opportunity = await prisma.investmentOpportunity.findFirst({
        where: { status: 'ACTIVE' },
      })
    }

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
    let minAmount = Number(opportunity.minAmount)
    let maxAmount = opportunity.maxAmount ? Number(opportunity.maxAmount) : null

    if (isSolo) {
      const soloTiers: Record<string, { min: number; max?: number }> = {
        SOLO_STARTER: { min: 250, max: 10000 },
        'solo-starter': { min: 250, max: 10000 },
        SOLO_GROWTH: { min: 1000, max: 50000 },
        'solo-growth': { min: 1000, max: 50000 },
        SOLO_PREMIUM: { min: 5000, max: 500000 },
        'solo-premium': { min: 5000, max: 500000 },
      }
      if (tierKey && soloTiers[tierKey]) {
        minAmount = soloTiers[tierKey].min
        maxAmount = soloTiers[tierKey].max ?? null
      } else {
        minAmount = 250
      }
    } else if (isSave) {
      minAmount = 10
    }

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

    // 5. Check target funding capacity (skip capping for solo/save personal vaults)
    if (!isSolo && !isSave) {
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
    }

    // 6. Calculate maturity date
    let termMonths = opportunity.termMonths
    if (tierKey === 'SOLO_STARTER' || tierKey === 'solo-starter') termMonths = 6
    if (tierKey === 'SOLO_GROWTH' || tierKey === 'solo-growth') termMonths = 12
    if (tierKey === 'SOLO_PREMIUM' || tierKey === 'solo-premium') termMonths = 24

    const maturityDate = new Date()
    maturityDate.setMonth(maturityDate.getMonth() + termMonths)

    // 7. Generate reference numbers
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase()
    const investmentRef = isSolo
      ? `SOLO-${new Date().getFullYear()}-${randomHex}`
      : isSave
      ? `SAVE-${new Date().getFullYear()}-${randomHex}`
      : `INV-${new Date().getFullYear()}-${randomHex}`
    const transactionRef = `TXN-${new Date().getFullYear()}-${randomHex}`

    const invTitle = isSolo
      ? `Solo Portfolio — ${tierKey ? tierKey.replace(/_/g, ' ') : 'Personal Tier'}`
      : isSave
      ? `Marriage Savings Vault (${parsed.data.frequency || 'Contribution'})`
      : `Investment in "${opportunity.title}"`

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
          soloTier: tierKey || '',
          isSolo: String(isSolo),
        },
        description: `${invTitle} — ref ${investmentRef}`,
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
          status: isSave ? 'ACTIVE' : 'PENDING',
          maturityDate,
        },
      })

      const userName = session?.user?.name || 'Jane Doe'
      await tx.transaction.create({
        data: {
          userId,
          investmentId: investment.id,
          type: 'DEPOSIT',
          amount: new Prisma.Decimal(amount),
          fee: new Prisma.Decimal(0),
          netAmount: new Prisma.Decimal(amount),
          status: isSave ? 'COMPLETED' : 'PENDING',
          reference: transactionRef,
          stripePaymentIntentId: paymentIntentId,
          description: invTitle,
          metadata: {
            opportunityId: opportunity.id,
            opportunityTitle: opportunity.title,
            soloTier: tierKey,
            isSolo,
            isSave,
            depositorName: userName,
            status: parsed.data.isReciprocalMatch ? 'APPROVED' : (isSave ? 'PENDING_MATCH' : 'APPROVED'),
            paymentIntentId,
          },
        },
      })
    })

    // Spousal Reciprocation Protocol
    if (isSave || !isSolo) {
      const spouseId = await resolveSpouseId(userId)
      const partnerName = spouseId ? await getSpouseName(spouseId) : (parsed.data.partnerName || 'your spouse')
      const userName = session?.user?.name || 'Investor'

      const formattedTime = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(new Date())

      if (parsed.data.isReciprocalMatch) {
        // Fulfill the outstanding reciprocation obligation
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'RECIPROCATION_OBLIGATION_FULFILLED',
            entity: 'SavingsVault',
            after: {
              reciprocatedBy: userName,
              partnerName,
              amount,
              fulfilledAt: new Date().toISOString(),
            },
          },
        }).catch(console.error)

        // Couple chat message (vault saves get their card from /api/savings/deposits)
        if (!isSave) try {
          await createChatMessage({
            data: {
              id: `msg-inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              threadId: 'spouse',
              senderId: userId,
              senderName: userName,
              text: `Matched ${partnerName}'s deposit with $${amount.toLocaleString()}.`,
              timestamp: formattedTime,
              createdAt: new Date(),
              read: false,
              type: 'deposit_alert',
              proposalData: {
                goalName: invTitle,
                amount: amount,
                split: '50/50 Equal Match',
                status: 'approved',
                proposedBy: userName,
                approvedBy: partnerName,
              },
              depositData: {
                amount: amount,
                vaultTitle: invTitle,
                depositorName: userName,
                isReciprocalMatch: true,
              },
              reactions: {},
            },
          })
        } catch (chatErr) {
          console.warn('Failed to inject chat message for reciprocation match:', chatErr)
        }

        await prisma.notification.create({
          data: {
            userId,
            title: `You matched ${partnerName}'s deposit`,
            message: `You matched ${partnerName}'s deposit with $${amount.toLocaleString()}.`,
            type: 'SUCCESS',
            link: '/chat?thread=spouse',
          },
        }).catch(console.error)
      } else {
        // New deposit triggers a mandatory reciprocation obligation on the partner
        const dueDate = new Date(Date.now() + 48 * 3600 * 1000)
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'RECIPROCATION_OBLIGATION_CREATED',
            entity: 'SavingsVault',
            after: {
              depositorName: userName,
              requiredReciprocatorName: partnerName,
              amount,
              partnerNote: parsed.data.partnerNote || 'Joint savings vault contribution ❤️',
              dueDate: dueDate.toISOString(),
              status: 'PENDING',
            },
          },
        }).catch(console.error)

        // Couple chat message (vault saves get their card from /api/savings/deposits)
        if (!isSave) try {
          await createChatMessage({
            data: {
              id: `msg-inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              threadId: 'spouse',
              senderId: userId,
              senderName: userName,
              text: `Invested $${amount.toLocaleString()} in ${invTitle}.`,
              timestamp: formattedTime,
              createdAt: new Date(),
              read: false,
              type: 'deposit_alert',
              proposalData: {
                goalName: invTitle,
                amount: amount,
                split: '50/50',
                status: 'pending',
                proposedBy: userName,
              },
              depositData: {
                amount: amount,
                vaultTitle: invTitle,
                depositorName: userName,
                isReciprocalMatch: false,
              },
              reactions: {},
            },
          })
        } catch (chatErr) {
          console.warn('Failed to inject chat message for investment:', chatErr)
        }

        if (!isSave && spouseId) {
          await prisma.notification.create({
            data: {
              userId: spouseId,
              title: `${userName} invested $${amount.toLocaleString()}`,
              message: `${userName} invested $${amount.toLocaleString()} in ${invTitle}. Match it to keep your vault balanced.`,
              type: 'INFO',
              link: '/pay/match',
            },
          }).catch(console.error)
        }
      }
    }

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
