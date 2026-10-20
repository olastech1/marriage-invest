import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { buildThreadId } from '@/app/api/chat/route'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    const currentUserId = session?.user?.id || 'usr_jane_doe'
    const currentUserName = session?.user?.name || 'Investor'

    // Fetch deposit transactions
    const rawTransactions = await prisma.transaction.findMany({
      where: {
        type: 'DEPOSIT',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const deposits = rawTransactions.map((tx: any) => {
      const isFromPartner = tx.userId === 'usr_marcus_vance' || tx.metadata?.depositorName === 'Your Partner'
      const depositorName = tx.metadata?.depositorName || (isFromPartner ? 'Your Partner' : currentUserName)
      const isPending = tx.status === 'PENDING' || tx.metadata?.status === 'PENDING_MATCH'

      return {
        id: tx.id,
        reference: tx.reference,
        amount: Number(tx.amount),
        depositorName,
        isCurrentUser: !isFromPartner,
        vaultTitle: tx.description || 'Mutual Spousal Contribution Vault',
        status: isPending ? 'PENDING_MATCH' : 'APPROVED',
        statusLabel: isPending ? 'Pending Partner Match' : 'Approved & Compounding',
        canRemind: isPending || isFromPartner,
        partnerEmail: '',
        partnerName: 'Your Partner',
        createdAt: tx.createdAt,
        metadata: tx.metadata || {},
      }
    })

    return NextResponse.json({
      success: true,
      deposits,
      summary: {
        totalDeposited: deposits.reduce((sum: number, d: any) => sum + d.amount, 0),
        approvedCount: deposits.filter((d: any) => d.status === 'APPROVED').length,
        pendingCount: deposits.filter((d: any) => d.status === 'PENDING_MATCH').length,
      },
    })
  } catch (error: any) {
    console.error('[GET /api/savings/deposits]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const currentUserId = session?.user?.id || 'usr_jane_doe'
    const currentUserName = session?.user?.name || 'Investor'
    const partnerName = 'Your Partner'

    const body = await req.json()
    const {
      amount,
      applyBonus = false,
      vaultTitle = 'Mutual Spousal Contribution Vault',
      note = '',
      isReciprocalMatch = false,
    } = body

    const numAmount = Number(amount)
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Valid deposit amount is required.' }, { status: 400 })
    }

    // 10% Cash Match Bonus calculation
    const bonusAmount = applyBonus ? Math.round(numAmount * 0.10 * 100) / 100 : 0
    const totalAdded = numAmount + bonusAmount
    const reference = `DEP-${Date.now().toString(36).toUpperCase()}`

    // 1. Create Transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: currentUserId,
        type: 'DEPOSIT',
        amount: totalAdded as any,
        fee: 0 as any,
        netAmount: totalAdded as any,
        status: 'COMPLETED',
        reference,
        description: `${vaultTitle} Deposit ($${numAmount.toLocaleString()})${bonusAmount > 0 ? ` + 10% Cash Match ($${bonusAmount.toLocaleString()})` : ''}`,
        metadata: {
          depositorName: currentUserName,
          baseAmount: numAmount,
          bonusMatch: bonusAmount,
          bonusApplied: applyBonus,
          note,
          status: 'APPROVED',
        },
      },
    })

    // 2. Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'SPOUSAL_VAULT_DEPOSIT_RECORDED',
        entity: 'SavingsVault',
        after: {
          depositorName: currentUserName,
          amount: numAmount,
          bonusMatch: bonusAmount,
          totalAdded,
          reference,
          note,
          isReciprocalMatch,
        },
      },
    }).catch(console.error)

    // 3. Create synchronized couple chat message for this deposit!
    const formattedTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(new Date())

    try {
      await (prisma as any).chatMessage.create({
        data: {
          id: `msg-dep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          threadId: buildThreadId('usr_jane_doe', 'usr_marcus_vance'),
          senderId: currentUserId,
          senderName: currentUserName,
          text: `💰 Just deposited $${numAmount.toLocaleString()} into our ${vaultTitle}!${bonusAmount > 0 ? ` (+ earned a $${bonusAmount.toLocaleString()} 10% instant cash match! Total added: $${totalAdded.toLocaleString()})` : ''} Note: "${note || 'For our shared goals ❤️'}"`,
          timestamp: formattedTime,
          createdAt: new Date(),
          read: false,
          type: 'deposit_alert',
          proposalData: {
            goalName: vaultTitle,
            amount: numAmount,
            split: '50/50 Equal Match',
            status: isReciprocalMatch ? 'approved' : 'pending',
            proposedBy: currentUserName,
          },
          depositData: {
            amount: numAmount,
            bonusMatch: bonusAmount,
            vaultTitle,
            depositorName: currentUserName,
            reference,
            isReciprocalMatch,
          },
          reactions: { '💰': 1, '🔥': 1, '❤️': 1 },
        },
      })
    } catch (chatErr) {
      console.warn('Failed to inject chat message for deposit:', chatErr)
    }

    // 4. Create persistent UNATTENDED disturbing notification for the partner!
    // Stays on their dashboard until attended to! Links to chat with direct match context.
    await prisma.notification.create({
      data: {
        userId: currentUserId, // visible in current session dashboard
        title: `🚨 Partner Action: $${numAmount.toLocaleString()} Deposited by ${currentUserName}`,
        message: `${currentUserName} contributed $${numAmount.toLocaleString()} to your Joint Vault${bonusAmount > 0 ? ` (+ earned an instant $${bonusAmount.toLocaleString()} 10% cash match!)` : ''}. Note: "${note || 'For our shared goals ❤️'}". Covenant Rule 4.2 requires equal partner attendance & match.`,
        type: 'ALERT',
        read: false,
        link: `/chat?thread=spouse&action=match&amount=${numAmount}`,
        category: 'PARTNER_DEPOSIT',
        requiresAction: true,
        attended: false,
        amount: numAmount,
        partnerName: currentUserName,
        actionLabel: `Match in Chat ($${numAmount.toLocaleString()})`,
        metadata: {
          transactionId: transaction.id,
          reference,
          bonusMatch: bonusAmount,
          chatThread: 'spouse',
        },
      } as any,
    })

    // 5. Also create celebratory notification for the depositor if 10% bonus was earned
    if (bonusAmount > 0) {
      await prisma.notification.create({
        data: {
          userId: currentUserId,
          title: `🎁 +$${bonusAmount.toLocaleString()} 10% Bonus Match Credited!`,
          message: `Congratulations! Your deposit of $${numAmount.toLocaleString()} earned an instant $${bonusAmount.toLocaleString()} 10% match. Total credited: $${totalAdded.toLocaleString()}.`,
          type: 'SUCCESS',
          read: false,
          link: '/chat?thread=spouse',
          category: 'BONUS_MATCH',
          requiresAction: false,
          attended: true,
        } as any,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Deposit processed successfully.',
      transaction,
      baseAmount: numAmount,
      bonusAmount,
      totalAdded,
    })
  } catch (error: any) {
    console.error('[POST /api/savings/deposits]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
