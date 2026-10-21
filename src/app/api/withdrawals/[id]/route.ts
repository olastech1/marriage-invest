import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

// ---------------------------------------------------------------------------
// GET /api/withdrawals/[id]
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

    const { id } = await params
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
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
    })

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 })
    }

    let parsedNote: any = null
    try {
      if (withdrawal.adminNote && withdrawal.adminNote.startsWith('{')) {
        parsedNote = JSON.parse(withdrawal.adminNote)
      }
    } catch {
      parsedNote = null
    }

    return NextResponse.json({ withdrawal, partnerApproval: parsedNote })
  } catch (error) {
    console.error('[GET /api/withdrawals/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/withdrawals/[id] — Partner Approval or Admin Action
// ---------------------------------------------------------------------------

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { action, partnerSignature, partnerNote } = body

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        investment: { select: { referenceNumber: true, opportunity: { select: { title: true } } } },
      },
    })

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 })
    }

    let currentMetadata: any = {}
    try {
      if (withdrawal.adminNote && withdrawal.adminNote.startsWith('{')) {
        currentMetadata = JSON.parse(withdrawal.adminNote)
      } else if (withdrawal.adminNote) {
        currentMetadata = { legacyNote: withdrawal.adminNote }
      }
    } catch {
      currentMetadata = {}
    }

    const partnerName = session?.user?.name || 'Marcus Vance'

    if (action === 'partner_approve') {
      const updatedMetadata = {
        ...currentMetadata,
        requiresPartnerApproval: true,
        partnerApprovalStatus: 'APPROVED',
        partnerApprovedAt: new Date().toISOString(),
        partnerApproverId: userId,
        partnerApproverName: partnerName,
        partnerSignature: partnerSignature || `${partnerName} (Digital Spousal Consent)`,
        partnerNote: partnerNote || 'Mutual spousal consent granted for fund liquidation.',
      }

      const updated = await prisma.withdrawalRequest.update({
        where: { id },
        data: {
          adminNote: JSON.stringify(updatedMetadata),
        },
      })

      // Create notification for original requester
      await prisma.notification.create({
        data: {
          userId: withdrawal.userId,
          title: 'Spousal Consent Granted ✓',
          message: `${partnerName} has approved your withdrawal of $${Number(withdrawal.amount).toLocaleString()}. Your request is now proceeding to financial processing.`,
          type: 'SUCCESS',
          link: '/withdrawals',
        },
      }).catch(console.error)

      return NextResponse.json({
        success: true,
        message: 'Spousal consent verified and granted.',
        withdrawal: updated,
      })
    }

    if (action === 'partner_reject') {
      const updatedMetadata = {
        ...currentMetadata,
        requiresPartnerApproval: true,
        partnerApprovalStatus: 'REJECTED',
        partnerRejectedAt: new Date().toISOString(),
        partnerApproverId: userId,
        partnerApproverName: partnerName,
        partnerNote: partnerNote || 'Declined by spouse to preserve compound growth and covenant vault integrity.',
      }

      const updated = await prisma.withdrawalRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          adminNote: JSON.stringify(updatedMetadata),
          rejectedAt: new Date(),
        },
      })

      // Create notification for original requester
      await prisma.notification.create({
        data: {
          userId: withdrawal.userId,
          title: 'Withdrawal Declined by Partner',
          message: `${partnerName} has declined the withdrawal of $${Number(withdrawal.amount).toLocaleString()}. Capital remains protected in your compounding vault.`,
          type: 'WARNING',
          link: '/withdrawals',
        },
      }).catch(console.error)

      return NextResponse.json({
        success: true,
        message: 'Withdrawal declined by spouse. Funds remain protected in the vault.',
        withdrawal: updated,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[PATCH /api/withdrawals/[id]]', error)
    return NextResponse.json({ error: 'Failed to process partner approval' }, { status: 500 })
  }
}
