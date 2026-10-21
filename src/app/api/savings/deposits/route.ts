import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCoupleDeposits } from '@/lib/reciprocation'
import { recordVaultDeposit } from '@/lib/vaultDeposits'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    const currentUserId = session?.user?.id
    if (!currentUserId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
    const deposits = await getCoupleDeposits(currentUserId)

    return NextResponse.json({
      success: true,
      deposits,
      summary: {
        totalDeposited: deposits.reduce((sum, d) => sum + d.amount, 0),
        approvedCount: deposits.filter((d) => d.status === 'APPROVED').length,
        pendingCount: deposits.filter((d) => d.status === 'PENDING_MATCH').length,
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
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })
    const body = await req.json()
    const amount = Number(body.amount)
    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Valid deposit amount is required.' }, { status: 400 })
    }

    const result = await recordVaultDeposit({
      userId,
      userName: session?.user?.name || 'Member',
      amount,
      applyBonus: !!body.applyBonus,
      vaultTitle: body.vaultTitle,
      note: body.note,
      isReciprocalMatch: !!body.isReciprocalMatch,
    })

    return NextResponse.json({ success: true, message: 'Deposit processed successfully.', ...result })
  } catch (error: any) {
    console.error('[POST /api/savings/deposits]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
