import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const DEFAULT_PARTNER_NAME = 'Marcus Vance'

// ---------------------------------------------------------------------------
// GET /api/savings/reciprocation
// Retrieves current reciprocation status & covenant obligations
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const userId = session.user.id
    const userName = session.user.name || 'Investor'

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
    } else if (!latestLog) {
      // Default initial pending state so user immediately experiences the compulsory reciprocation feature
      hasPending = true
      const simulatedDepositDate = new Date(Date.now() - 6 * 3600 * 1000)
      const simulatedDueDate = new Date(Date.now() + 42 * 3600 * 1000)
      pendingData = {
        id: 'recip_demo_init',
        depositorName: DEFAULT_PARTNER_NAME,
        requiredReciprocatorName: userName,
        amount: 500,
        depositedAt: simulatedDepositDate.toISOString(),
        dueDate: simulatedDueDate.toISOString(),
        partnerNote: 'I just saved $500 for our trip to Italy! Under our Spousal Covenant, you must match this deposit ❤️',
        status: 'PENDING',
        isObligationOnCurrentUser: true,
      }
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
      covenantStreak: 6,
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const userId = session.user.id
    const userName = session.user.name || 'Investor'
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

      // 2. Create notification for user
      await prisma.notification.create({
        data: {
          userId,
          title: '⚡ Compulsory Reciprocation Triggered',
          message: `${DEFAULT_PARTNER_NAME} deposited $${depositAmount.toLocaleString()} into your Joint Vault. Under Spousal Covenant Rule 4.2, you are required to reciprocate with an equal contribution!`,
          type: 'WARNING',
          link: '/save',
        },
      })

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

      // 2. Create celebratory notification
      await prisma.notification.create({
        data: {
          userId,
          title: '✓ Spousal Covenant Reciprocated!',
          message: `You successfully matched ${DEFAULT_PARTNER_NAME}'s deposit with $${matchAmount.toLocaleString()}! Both spouses are in 100% financial harmony. Vault withdrawals unlocked.`,
          type: 'SUCCESS',
          link: '/save',
        },
      })

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
