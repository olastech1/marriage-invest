import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    const currentUserId = session?.user?.id || 'usr_jane_doe'
    const currentUserName = session?.user?.name || 'Jane Doe'

    // Fetch deposit transactions
    const rawTransactions = await prisma.transaction.findMany({
      where: {
        type: 'DEPOSIT',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const deposits = rawTransactions.map((tx: any) => {
      const isFromPartner = tx.userId === 'usr_marcus_vance' || tx.metadata?.depositorName === 'Marcus Vance'
      const depositorName = tx.metadata?.depositorName || (isFromPartner ? 'Marcus Vance' : currentUserName)
      const isPending = tx.status === 'PENDING' || tx.metadata?.status === 'PENDING_MATCH'

      return {
        id: tx.id,
        reference: tx.reference,
        amount: Number(tx.amount),
        depositorName,
        isCurrentUser: !isFromPartner,
        vaultTitle: tx.description?.includes('Swiss') ? 'Swiss Matrimonial Reserve Vault' : 'Jane Doe & Marcus Vance Spousal Contribution',
        status: isPending ? 'PENDING_MATCH' : 'APPROVED',
        statusLabel: isPending ? 'Pending Partner Match' : 'Approved & Compounding',
        canRemind: isPending || isFromPartner,
        partnerEmail: 'marcus.vance@unioninvest.com',
        partnerName: 'Marcus Vance',
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
