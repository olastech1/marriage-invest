import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveSpouseId } from '@/lib/chat'
import { getReciprocationStatus, getSpouseName } from '@/lib/reciprocation'
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
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
    const userName = session?.user?.name || 'Member'

    const reciprocationSpouse = resolveSpouseId(userId)
    const [userWithdrawals, allPendingWithdrawals, eligibleInvestments, reciprocation] = await Promise.all([
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
      // Only the spouse's own pending requests can need my approval
      reciprocationSpouse.then((spouseId) =>
        spouseId
          ? prisma.withdrawalRequest.findMany({
        where: {
          status: 'PENDING',
          userId: spouseId,
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
      })
          : [],
      ),
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
      getReciprocationStatus(userId),
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
          // Never expose the spouse's full account number
          accountNumber: w.accountNumber ? `••••${w.accountNumber.slice(-4)}` : null,
          createdAt: w.createdAt,
          requesterId: w.userId,
          requesterName: meta?.requestedByName || w.user?.name || 'your spouse',
          partnerName: meta?.partnerName || 'your spouse',
          opportunityTitle: w.investment?.opportunity?.title || 'Joint Marriage Reserve',
          referenceNumber: w.investment?.referenceNumber,
          partnerApprovalStatus: meta?.partnerApprovalStatus || 'AWAITING_PARTNER',
          requiresPartnerApproval: meta?.requiresPartnerApproval ?? true,
        }
      })
      .filter((w) => w.requiresPartnerApproval && w.partnerApprovalStatus === 'AWAITING_PARTNER')

    const hasPendingReciprocation = !!reciprocation.pending
    const pendingReciprocation = reciprocation.pending

    return NextResponse.json({
      withdrawals,
      eligibleInvestments,
      pendingPartnerApprovals,
      partnerName: reciprocation.spouseName || 'your spouse',
      hasPendingReciprocation,
      pendingReciprocation,
    })
  } catch (error) {
    console.error('[GET /api/withdrawals]', error)
    return NextResponse.json({ error: 'Failed to retrieve withdrawals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
    const userName = session?.user?.name || 'Member'
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

    // Enforce compulsory reciprocation lock on joint withdrawals
    if (!isSolo) {
      const { pending } = await getReciprocationStatus(userId)
      if (pending) {
        return NextResponse.json(
          {
            error: `Withdrawal locked: reciprocate ${pending.depositorName}'s deposit first ($${pending.amount.toLocaleString()}).`,
            reciprocationBlocked: true,
          },
          { status: 400 },
        )
      }
    }

    const fee = amount * 0.02
    const penalty = amount * 0.01
    const netAmount = Math.max(0, amount - fee - penalty)

    const spouseId = await resolveSpouseId(userId)
    const partnerName = spouseId ? await getSpouseName(spouseId) : (customPartnerName || 'your spouse')

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
