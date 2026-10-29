import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveSpouseId } from '@/lib/chat'
import { emailMember, postToCoupleChat } from '@/lib/activity'

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

    // Visible to the requester, their spouse, or an admin
    const requesterSpouse = await resolveSpouseId(withdrawal?.userId || '')
    if (
      !withdrawal ||
      (withdrawal.userId !== userId && requesterSpouse !== userId && session?.user?.role !== 'ADMIN')
    ) {
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

    // Only the requester's spouse can approve or decline (never the requester)
    if (withdrawal.userId === userId || (await resolveSpouseId(withdrawal.userId)) !== userId) {
      return NextResponse.json({ error: 'Only your spouse can approve this withdrawal.' }, { status: 403 })
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

    if (withdrawal.status !== 'PENDING' || currentMetadata.partnerApprovalStatus !== 'AWAITING_PARTNER') {
      return NextResponse.json({ error: 'This withdrawal has already been decided.' }, { status: 409 })
    }

    const partnerName = session?.user?.name || 'Your spouse'
    const usd = `$${Number(withdrawal.amount).toLocaleString()}`
    const fund = withdrawal.investment?.opportunity?.title || 'your investment'
    const card = { amount: Number(withdrawal.amount), withdrawalId: withdrawal.id, vaultTitle: fund }

    if (action === 'partner_approve') {
      const updatedMetadata = {
        ...currentMetadata,
        requiresPartnerApproval: true,
        partnerApprovalStatus: 'APPROVED',
        partnerApprovedAt: new Date().toISOString(),
        partnerApproverId: userId,
        partnerApproverName: partnerName,
        partnerSignature: partnerSignature || partnerName,
        partnerNote: partnerNote || '',
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
          title: `${partnerName} approved your withdrawal`,
          message: `${partnerName} approved your withdrawal of $${Number(withdrawal.amount).toLocaleString()}. It will now be processed.`,
          type: 'SUCCESS',
          link: '/withdrawals',
        },
      }).catch(console.error)
      await postToCoupleChat(userId, partnerName, {
        type: 'withdrawal',
        text: `Approved the withdrawal of ${usd} from ${fund}.${partnerNote ? ` Note: "${String(partnerNote).slice(0, 300)}"` : ''}`,
        depositData: { ...card, status: 'PARTNER_APPROVED' },
      })
      await emailMember(withdrawal.userId, {
        subject: `${partnerName} approved your ${usd} withdrawal`,
        heading: 'Your spouse approved the withdrawal',
        paragraphs: [`${partnerName} approved your withdrawal of ${usd} from ${fund}. It is now with our team for processing.`],
        ctaLabel: 'View withdrawals',
        ctaPath: '/withdrawals',
      })

      return NextResponse.json({
        success: true,
        message: 'Withdrawal approved.',
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
        partnerNote: partnerNote || '',
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
          title: `${partnerName} declined your withdrawal`,
          message: `${partnerName} declined the withdrawal of $${Number(withdrawal.amount).toLocaleString()}. The funds stay in your joint vault.`,
          type: 'WARNING',
          link: '/withdrawals',
        },
      }).catch(console.error)
      await postToCoupleChat(userId, partnerName, {
        type: 'withdrawal',
        text: `Declined the withdrawal of ${usd} from ${fund}. The money stays invested.${partnerNote ? ` Note: "${String(partnerNote).slice(0, 300)}"` : ''}`,
        depositData: { ...card, status: 'PARTNER_REJECTED' },
      })
      await emailMember(withdrawal.userId, {
        subject: `${partnerName} declined your ${usd} withdrawal`,
        heading: 'Your spouse declined the withdrawal',
        paragraphs: [`${partnerName} declined your withdrawal of ${usd} from ${fund}. The money stays invested.`],
        ctaLabel: 'View withdrawals',
        ctaPath: '/withdrawals',
      })

      return NextResponse.json({
        success: true,
        message: 'Withdrawal declined.',
        withdrawal: updated,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[PATCH /api/withdrawals/[id]]', error)
    return NextResponse.json({ error: 'Failed to process partner approval' }, { status: 500 })
  }
}
