import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { buildThreadId, createChatMessage, resolveSpouseId } from '@/lib/chat'

export const dynamic = 'force-dynamic'

const DEFAULT_PARTNER_NAME = 'Marcus Vance'

// ---------------------------------------------------------------------------
// GET /api/savings/reciprocation
// Retrieves current reciprocation status & covenant obligations
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id || 'usr_jane_doe'
    const userName = session?.user?.name || 'Jane Doe'

    // Fetch latest reciprocation log
    const latestLog = await prisma.auditLog.findFirst({
      where: {
        userId,
        action: { in: ['RECIPROCATION_OBLIGATION_CREATED', 'RECIPROCATION_OBLIGATION_FULFILLED'] },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch past reciprocation history
    const historyLogs = await prisma.auditLog.findMany({
      where: {
        userId,
        action: { in: ['RECIPROCATION_OBLIGATION_CREATED', 'RECIPROCATION_OBLIGATION_FULFILLED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    let hasPending = false
    let pendingData: any = null

    if (latestLog && latestLog.action === 'RECIPROCATION_OBLIGATION_CREATED') {
      hasPending = true
      pendingData = {
        id: latestLog.id,
        depositorName: (latestLog.after as any)?.depositorName || DEFAULT_PARTNER_NAME,
        requiredReciprocatorName: (latestLog.after as any)?.requiredReciprocatorName || userName,
        amount: Number((latestLog.after as any)?.amount || 500),
        depositedAt: latestLog.createdAt.toISOString(),
        dueDate: (latestLog.after as any)?.dueDate || new Date(latestLog.createdAt.getTime() + 48 * 3600 * 1000).toISOString(),
        partnerNote: (latestLog.after as any)?.partnerNote || 'For our anniversary celebration and dream home ❤️',
        status: 'PENDING',
        isObligationOnCurrentUser: (latestLog.after as any)?.requiredReciprocatorName !== DEFAULT_PARTNER_NAME,
      }
    } else {
      hasPending = false
      pendingData = null
    }

    const pastReciprocations = historyLogs.map((log) => ({
      id: log.id,
      action: log.action,
      createdAt: log.createdAt.toISOString(),
      details: log.after,
    }))

    return NextResponse.json({
      hasPendingReciprocation: hasPending,
      pendingReciprocation: pendingData,
      pastReciprocations,
      partnerName: DEFAULT_PARTNER_NAME,
      covenantRule: 'Rule 4.2: Mutual Matrimonial Savings Reciprocation Protocol',
      covenantStreak: latestLog ? 6 : 0,
      withdrawalsLocked: hasPending,
    })
  } catch (error) {
    console.error('[GET /api/savings/reciprocation]', error)
    return NextResponse.json({ error: 'Failed to retrieve reciprocation status' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/savings/reciprocation
// Actions: 'reciprocate' | 'simulate_partner_deposit' | 'reset'
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id || 'usr_jane_doe'
    const userName = session?.user?.name || 'Jane Doe'
    const body = await req.json()
    const { action, amount, partnerNote, memo } = body

    if (action === 'simulate_partner_deposit') {
      const depositAmount = Number(amount) || 500
      const note = partnerNote || `I just saved $${depositAmount.toLocaleString()} to our joint vault! Under our Spousal Covenant, your reciprocal match is now due ❤️`
      const dueDate = new Date(Date.now() + 48 * 3600 * 1000)

      // 1. Create audit log for partner's deposit & pending reciprocation
      const log = await prisma.auditLog.create({
        data: {
          userId,
          action: 'RECIPROCATION_OBLIGATION_CREATED',
          entity: 'SavingsVault',
          after: {
            depositorName: DEFAULT_PARTNER_NAME,
            requiredReciprocatorName: userName,
            amount: depositAmount,
            partnerNote: note,
            dueDate: dueDate.toISOString(),
            status: 'PENDING',
          },
        },
      })

      // 2. Create synchronized couple chat message for partner deposit
      const formattedTime = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(new Date())

      try {
        const simulatedSpouseId = (await resolveSpouseId(userId)) || 'usr_marcus_vance'
        await createChatMessage({
          data: {
            id: `msg-recip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            threadId: buildThreadId(userId, simulatedSpouseId),
            senderId: simulatedSpouseId,
            recipientId: userId,
            senderName: DEFAULT_PARTNER_NAME,
            text: `💍 I just saved $${depositAmount.toLocaleString()} to our Joint Vault! Under Spousal Covenant Rule 4.2, your reciprocal match is now due ❤️ Note: "${note}"`,
            timestamp: formattedTime,
            createdAt: new Date(),
            read: false,
            type: 'deposit_alert',
            proposalData: {
              goalName: 'Joint Marriage Savings Vault',
              amount: depositAmount,
              split: '50/50 Equal Match',
              status: 'pending',
              proposedBy: DEFAULT_PARTNER_NAME,
            },
            depositData: {
              amount: depositAmount,
              vaultTitle: 'Joint Marriage Savings Vault',
              depositorName: DEFAULT_PARTNER_NAME,
              isReciprocalMatch: false,
            },
            reactions: { '💍': 1, '🔥': 1 },
          },
        })
      } catch (chatErr) {
        console.warn('Failed to inject chat message for reciprocation:', chatErr)
      }

      // 3. Create notification for user linking to chat
      await prisma.notification.create({
        data: {
          userId,
          title: '⚡ Compulsory Reciprocation Triggered',
          message: `${DEFAULT_PARTNER_NAME} deposited $${depositAmount.toLocaleString()} into your Joint Vault. Under Spousal Covenant Rule 4.2, you are required to reciprocate with an equal contribution!`,
          type: 'WARNING',
          link: `/chat?thread=spouse&action=match&amount=${depositAmount}`,
          category: 'PARTNER_DEPOSIT',
          requiresAction: true,
          attended: false,
          amount: depositAmount,
          partnerName: DEFAULT_PARTNER_NAME,
          actionLabel: `Match in Chat ($${depositAmount.toLocaleString()})`,
        } as any,
      })

      // 4. Create transaction record for partner's deposit
      try {
        await prisma.transaction.create({
          data: {
            userId: 'usr_marcus_vance',
            type: 'DEPOSIT',
            amount: depositAmount as any,
            fee: 0 as any,
            netAmount: depositAmount as any,
            status: 'PENDING',
            reference: `RECIP-${Date.now().toString(36).toUpperCase()}`,
            description: `${DEFAULT_PARTNER_NAME} Vault Deposit ($${depositAmount.toLocaleString()}) — Pending Spousal Match`,
            metadata: {
              depositorName: DEFAULT_PARTNER_NAME,
              targetPartnerName: userName,
              status: 'PENDING_MATCH',
              requiresMatch: true,
            },
          },
        })
      } catch (e) {
        console.warn('Failed to record transaction:', e)
      }

      return NextResponse.json({
        success: true,
        message: `${DEFAULT_PARTNER_NAME} deposited $${depositAmount.toLocaleString()}. Reciprocation obligation is now ACTIVE.`,
        obligation: {
          id: log.id,
          depositorName: DEFAULT_PARTNER_NAME,
          amount: depositAmount,
          partnerNote: note,
          dueDate: dueDate.toISOString(),
          status: 'PENDING',
        },
      })
    }

    if (action === 'reciprocate') {
      const matchAmount = Number(amount) || 500
      const completionNote = memo || `Matched ${DEFAULT_PARTNER_NAME}'s deposit of $${matchAmount.toLocaleString()}`

      // 1. Record fulfillment in audit log
      const log = await prisma.auditLog.create({
        data: {
          userId,
          action: 'RECIPROCATION_OBLIGATION_FULFILLED',
          entity: 'SavingsVault',
          after: {
            reciprocatedBy: userName,
            partnerName: DEFAULT_PARTNER_NAME,
            amount: matchAmount,
            memo: completionNote,
            fulfilledAt: new Date().toISOString(),
          },
        },
      })

      // 2. Synchronized couple chat message for fulfillment
      const formattedTime = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(new Date())

      try {
        await createChatMessage({
          data: {
            id: `msg-match-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            threadId: 'spouse',
            senderId: userId,
            senderName: userName,
            text: `✓ Matched ${DEFAULT_PARTNER_NAME}'s deposit with $${matchAmount.toLocaleString()}! Both spouses are in 100% financial harmony. Vault withdrawals unlocked. 🎉🥂`,
            timestamp: formattedTime,
            createdAt: new Date(),
            read: false,
            type: 'deposit_alert',
            proposalData: {
              goalName: 'Joint Marriage Savings Vault',
              amount: matchAmount,
              split: '50/50 Equal Match',
              status: 'approved',
              proposedBy: userName,
              approvedBy: DEFAULT_PARTNER_NAME,
            },
            depositData: {
              amount: matchAmount,
              vaultTitle: 'Joint Marriage Savings Vault',
              depositorName: userName,
              isReciprocalMatch: true,
            },
            reactions: { '🥂': 2, '❤️': 2, '🎉': 2 },
          },
        })
      } catch (chatErr) {
        console.warn('Failed to inject chat message for reciprocation fulfillment:', chatErr)
      }

      // 3. Create celebratory notification
      await prisma.notification.create({
        data: {
          userId,
          title: '✓ Spousal Covenant Reciprocated!',
          message: `You successfully matched ${DEFAULT_PARTNER_NAME}'s deposit with $${matchAmount.toLocaleString()}! Both spouses are in 100% financial harmony. Vault withdrawals unlocked.`,
          type: 'SUCCESS',
          link: '/chat?thread=spouse',
        },
      })

      // 3. Create completed transaction record for user match
      try {
        await prisma.transaction.create({
          data: {
            userId,
            type: 'DEPOSIT',
            amount: matchAmount as any,
            fee: 0 as any,
            netAmount: matchAmount as any,
            status: 'COMPLETED',
            reference: `MATCH-${Date.now().toString(36).toUpperCase()}`,
            description: `${userName} Spousal Match Deposit ($${matchAmount.toLocaleString()}) — Covenant Fulfilled`,
            metadata: {
              depositorName: userName,
              targetPartnerName: DEFAULT_PARTNER_NAME,
              status: 'APPROVED',
              matched: true,
            },
          },
        })
      } catch (e) {
        console.warn('Failed to record match transaction:', e)
      }

      return NextResponse.json({
        success: true,
        message: `Successfully reciprocated with $${matchAmount.toLocaleString()}! Spousal Covenant fulfilled.`,
        fulfilledAt: new Date().toISOString(),
      })
    }

    if (action === 'reset') {
      // Clear recent reciprocation logs by fulfilling
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'RECIPROCATION_OBLIGATION_FULFILLED',
          entity: 'SavingsVault',
          after: {
            reciprocatedBy: 'System Reset',
            fulfilledAt: new Date().toISOString(),
          },
        },
      })

      return NextResponse.json({ success: true, message: 'Reciprocation status reset.' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[POST /api/savings/reciprocation]', error)
    return NextResponse.json({ error: 'Failed to process reciprocation action' }, { status: 500 })
  }
}
