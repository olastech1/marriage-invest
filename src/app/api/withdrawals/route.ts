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
  partnerName: z.string().optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const userId = session.user.id
    const userName = session.user.name || 'Investor'

    const [userWithdrawals, allPendingWithdrawals, eligibleInvestments] = await Promise.all([
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
      prisma.withdrawalRequest.findMany({
        where: {
          status: 'PENDING',
        },
        include: {
          investment: {
            select: {
              referenceNumber: true,
              opportunity: { select: { title: true } },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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

    // Parse adminNote metadata on user's own withdrawals
    const withdrawals = userWithdrawals.map((w) => {
      let partnerApproval: any = null
      try {
        if (w.adminNote && w.adminNote.startsWith('{')) {
          partnerApproval = JSON.parse(w.adminNote)
        }
      } catch {
        partnerApproval = null
      }
      return {
        ...w,
        partnerApproval,
      }
    })

    // Find pending partner approvals:
    // Any pending withdrawal where adminNote specifies requiresPartnerApproval AND partnerApprovalStatus === 'AWAITING_PARTNER'
    const pendingPartnerApprovals = allPendingWithdrawals
      .map((w) => {
        let meta: any = null
        try {
          if (w.adminNote && w.adminNote.startsWith('{')) {
            meta = JSON.parse(w.adminNote)
          }
        } catch {
          meta = null
        }
        return {
          id: w.id,
          amount: Number(w.amount),
          fee: Number(w.fee),
          netAmount: Number(w.netAmount),
          bankName: w.bankName,
          accountNumber: w.accountNumber,
          createdAt: w.createdAt,
          requesterId: w.userId,
          requesterName: meta?.requestedByName || w.user?.name || 'Your Partner',
          partnerName: meta?.partnerName || 'Marcus Vance',
          opportunityTitle: w.investment?.opportunity?.title || 'Joint Marriage Reserve',
          referenceNumber: w.investment?.referenceNumber,
          partnerApprovalStatus: meta?.partnerApprovalStatus || 'AWAITING_PARTNER',
          requiresPartnerApproval: meta?.requiresPartnerApproval ?? true,
        }
      })
      .filter((w) => w.requiresPartnerApproval && w.partnerApprovalStatus === 'AWAITING_PARTNER')

    return NextResponse.json({
      withdrawals,
      eligibleInvestments,
      pendingPartnerApprovals,
      partnerName: 'Marcus Vance',
    })
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
    const userName = session.user.name || 'Investor'
    const body = await req.json()
    const parsed = withdrawalSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten().fieldErrors },
        { status: 422 },
      )
    }

    const { investmentId, amount, bankName, accountName, accountNumber, routingNumber, partnerName: customPartnerName } = parsed.data

    // Check investment belongs to user
    const investment = await prisma.investment.findUnique({
      where: { id: investmentId },
      include: { opportunity: true },
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

    const isSolo = investment.referenceNumber?.startsWith('SOLO-')
    const fee = amount * 0.02
    const penalty = amount * 0.01
    const netAmount = Math.max(0, amount - fee - penalty)

    const partnerName = customPartnerName || 'Marcus Vance'

    const partnerMetadata = {
      requiresPartnerApproval: !isSolo,
      partnerApprovalStatus: isSolo ? 'NOT_REQUIRED' : 'AWAITING_PARTNER',
      requestedByName: userName,
      partnerName,
      initiatedAt: new Date().toISOString(),
      fee,
      penalty,
      netAmount,
    }

    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId,
        investmentId,
        amount: new Prisma.Decimal(amount),
        fee: new Prisma.Decimal(fee + penalty),
        netAmount: new Prisma.Decimal(netAmount),
        status: 'PENDING',
        bankName,
        accountName,
        accountNumber,
        routingNumber,
        adminNote: JSON.stringify(partnerMetadata),
      },
    })

    // If joint account, create partner notification
    if (!isSolo) {
      await prisma.notification.create({
        data: {
          userId,
          title: 'Partner Approval Required 🔐',
          message: `Your withdrawal request of $${amount.toLocaleString()} is locked pending digital approval from ${partnerName}. Under our Spousal Covenant, joint funds cannot be released unilaterally.`,
          type: 'INFO',
          link: '/withdrawals',
        },
      }).catch(console.error)
    }

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'WITHDRAWAL_REQUEST_SUBMITTED',
        entity: 'WithdrawalRequest',
        entityId: withdrawal.id,
        after: {
          amount,
          fee: fee + penalty,
          netAmount,
          investmentId,
          partnerApprovalRequired: !isSolo,
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        withdrawal,
        partnerApprovalRequired: !isSolo,
        partnerName,
        message: isSolo
          ? 'Solo withdrawal submitted for review.'
          : `Withdrawal submitted. Under our Spousal Covenant, ${partnerName} must approve before funds can be liquidated.`,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[POST /api/withdrawals]', error)
    return NextResponse.json({ error: 'Internal server error processing withdrawal' }, { status: 500 })
  }
}
