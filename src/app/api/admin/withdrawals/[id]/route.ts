import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import { Prisma } from '@prisma/client'

type Params = { params: Promise<{ id: string }> }

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
    })

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 })
    }

    if (action === 'approve') {
      const txnRef = `TXN-WD-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

      await prisma.$transaction(async (tx) => {
        // Update request status
        await tx.withdrawalRequest.update({
          where: { id },
          data: {
            status: 'APPROVED',
            approvedById: session.user.id,
            approvedAt: new Date(),
            processedAt: new Date(),
            adminNote: adminNote || 'Approved by financial officer',
          },
        })

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
            description: `Contractual withdrawal from investment`,
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

      return NextResponse.json({ success: true, message: 'Withdrawal approved successfully' })
    } else {
      // Reject
      await prisma.withdrawalRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          adminNote: adminNote || 'Rejected per compliance policy',
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'WITHDRAWAL_REJECTED',
          entity: 'WithdrawalRequest',
          entityId: id,
          after: { status: 'REJECTED', adminNote },
        },
      })

      return NextResponse.json({ success: true, message: 'Withdrawal rejected' })
    }
  } catch (error) {
    console.error('[PATCH /api/admin/withdrawals/[id]]', error)
    return NextResponse.json({ error: 'Failed to process decision' }, { status: 500 })
  }
}
