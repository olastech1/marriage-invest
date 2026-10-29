import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import { resolveSpouseId } from '@/lib/chat'
import { emailMember, postToCoupleChat } from '@/lib/activity'

type Params = { params: Promise<{ id: string }> }

/** Tell the member (and their spouse) about the decision: bell, couple chat and email */
async function announceDecision(
  withdrawal: { id: string; userId: string; amount: unknown; netAmount: unknown; user: { name: string | null }; investment: { opportunity: { title: string } | null } | null },
  decision: 'approved' | 'rejected',
  adminNote?: string,
) {
  const usd = `$${Number(withdrawal.amount).toLocaleString()}`
  const fund = withdrawal.investment?.opportunity?.title || 'your investment'
  const name = withdrawal.user.name || 'Member'
  const text =
    decision === 'approved'
      ? `Withdrawal of ${usd} from ${fund} approved. $${Number(withdrawal.netAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })} is on its way to ${name}'s bank account.`
      : `Withdrawal of ${usd} from ${fund} was not approved.${adminNote?.trim() ? ` Reason: ${adminNote.trim().replace(/[.!?]*$/, '.')}` : ''} The money stays invested.`
  const spouseId = await resolveSpouseId(withdrawal.userId)

  for (const id of [withdrawal.userId, spouseId].filter(Boolean)) {
    await prisma.notification.create({
      data: {
        userId: id,
        title: decision === 'approved' ? `Withdrawal of ${usd} approved` : `Withdrawal of ${usd} not approved`,
        message: text,
        type: decision === 'approved' ? 'SUCCESS' : 'WARNING',
        link: '/withdrawals',
      },
    }).catch(console.error)
    await emailMember(id, {
      subject: decision === 'approved' ? `Withdrawal approved: ${usd}` : `Withdrawal not approved: ${usd}`,
      heading: decision === 'approved' ? 'Withdrawal approved' : 'Withdrawal not approved',
      paragraphs: [text],
      ctaLabel: 'View withdrawals',
      ctaPath: '/withdrawals',
    })
  }
  await postToCoupleChat(
    withdrawal.userId,
    name,
    {
      type: 'withdrawal',
      text,
      depositData: { amount: Number(withdrawal.amount), withdrawalId: withdrawal.id, status: decision === 'approved' ? 'APPROVED' : 'REJECTED', vaultTitle: fund },
    },
    { fromPlatform: true },
  )
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.role || !['ADMIN', 'FINANCE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { action, adminNote } = body

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be approve or reject.' }, { status: 400 })
    }

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: { user: { select: { name: true } }, investment: { select: { opportunity: { select: { title: true } } } } },
    })

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 })
    }
    if (withdrawal.status !== 'PENDING') {
      return NextResponse.json(
        { error: `This request has already been ${withdrawal.status.toLowerCase()}.` },
        { status: 409 },
      )
    }

    // Keep the spouse-approval record on the request; the admin's note is added to it
    let meta: Record<string, unknown> | null = null
    try {
      if (withdrawal.adminNote?.startsWith('{')) meta = JSON.parse(withdrawal.adminNote)
    } catch {
      meta = null
    }
    if (action === 'approve' && meta?.partnerApprovalStatus === 'AWAITING_PARTNER') {
      return NextResponse.json({ error: 'The spouse has not approved this withdrawal yet.' }, { status: 409 })
    }
    const decisionNote = meta ? JSON.stringify({ ...meta, adminDecisionNote: adminNote || '' }) : adminNote || null

    if (action === 'approve') {
      const txnRef = `TXN-WD-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

      await prisma.$transaction(async (tx) => {
        // Update request status (only if still pending, so it cannot be approved twice)
        const updated = await tx.withdrawalRequest.updateMany({
          where: { id, status: 'PENDING' },
          data: {
            status: 'APPROVED',
            approvedById: session.user.id,
            approvedAt: new Date(),
            processedAt: new Date(),
            adminNote: decisionNote,
          },
        })
        if (updated.count === 0) throw new Error('ALREADY_DECIDED')

        // Create negative or withdrawal transaction record
        await tx.transaction.create({
          data: {
            userId: withdrawal.userId,
            investmentId: withdrawal.investmentId,
            type: 'WITHDRAWAL',
            amount: withdrawal.amount,
            fee: withdrawal.fee,
            netAmount: withdrawal.netAmount,
            status: 'COMPLETED',
            reference: txnRef,
            description: 'Withdrawal from investment',
            processedAt: new Date(),
          },
        })

        // Audit log
        await tx.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'WITHDRAWAL_APPROVED',
            entity: 'WithdrawalRequest',
            entityId: id,
            after: { status: 'APPROVED', txnRef },
          },
        })
      })

      await announceDecision(withdrawal, 'approved', adminNote)
      return NextResponse.json({ success: true, message: 'Withdrawal approved successfully' })
    } else {
      // Reject (only if still pending)
      const updated = await prisma.withdrawalRequest.updateMany({
        where: { id, status: 'PENDING' },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          adminNote: decisionNote,
        },
      })
      if (updated.count === 0) throw new Error('ALREADY_DECIDED')

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'WITHDRAWAL_REJECTED',
          entity: 'WithdrawalRequest',
          entityId: id,
          after: { status: 'REJECTED', adminNote },
        },
      })

      await announceDecision(withdrawal, 'rejected', adminNote)
      return NextResponse.json({ success: true, message: 'Withdrawal rejected' })
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'ALREADY_DECIDED') {
      return NextResponse.json({ error: 'This request has already been decided.' }, { status: 409 })
    }
    console.error('[PATCH /api/admin/withdrawals/[id]]', error)
    return NextResponse.json({ error: 'Failed to process decision' }, { status: 500 })
  }
}
