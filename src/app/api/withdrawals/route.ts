import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const withdrawalSchema = z.object({
  investmentId: z.string().min(1, 'Investment ID required'),
  amount: z.number().positive('Amount must be positive'),
  bankName: z.string().min(2, 'Bank name is required'),
  accountName: z.string().min(2, 'Account name is required'),
  accountNumber: z.string().min(4, 'Account number is required'),
  routingNumber: z.string().min(4, 'Routing number is required'),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const userId = session.user.id

    const [withdrawals, eligibleInvestments] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where: { userId },
        include: {
          investment: {
            select: {
              referenceNumber: true,
              opportunity: { select: { title: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.investment.findMany({
        where: {
          userId,
          status: { in: ['ACTIVE', 'MATURED'] },
        },
        select: {
          id: true,
          referenceNumber: true,
          amount: true,
          status: true,
          opportunity: {
            select: {
              title: true,
              termMonths: true,
            },
          },
        },
      }),
    ])

    return NextResponse.json({ withdrawals, eligibleInvestments })
  } catch (error) {
    console.error('[GET /api/withdrawals]', error)
    return NextResponse.json({ error: 'Failed to retrieve withdrawals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const parsed = withdrawalSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten().fieldErrors },
        { status: 422 },
      )
    }

    const { investmentId, amount, bankName, accountName, accountNumber, routingNumber } = parsed.data

    // Check investment belongs to user
    const investment = await prisma.investment.findUnique({
      where: { id: investmentId },
    })

    if (!investment || investment.userId !== userId) {
      return NextResponse.json({ error: 'Investment not found or access denied' }, { status: 404 })
    }

    if (investment.status !== 'ACTIVE' && investment.status !== 'MATURED') {
      return NextResponse.json(
        { error: `Investment is currently in ${investment.status} status and not eligible for withdrawal.` },
        { status: 400 },
      )
    }

    const fee = amount * 0.02
    const netAmount = amount - fee

    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId,
        investmentId,
        amount: new Prisma.Decimal(amount),
        fee: new Prisma.Decimal(fee),
        netAmount: new Prisma.Decimal(netAmount),
        status: 'PENDING',
        bankName,
        accountName,
        accountNumber,
        routingNumber,
      },
    })

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'WITHDRAWAL_REQUEST_SUBMITTED',
        entity: 'WithdrawalRequest',
        entityId: withdrawal.id,
        after: {
          amount,
          fee,
          netAmount,
          investmentId,
        },
      },
    })

    return NextResponse.json({ success: true, withdrawal }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/withdrawals]', error)
    return NextResponse.json({ error: 'Internal server error processing withdrawal' }, { status: 500 })
  }
}
