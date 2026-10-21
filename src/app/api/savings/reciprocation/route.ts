import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getReciprocationStatus } from '@/lib/reciprocation'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// GET /api/savings/reciprocation
// What the current user owes their spouse (and vice versa), derived from the
// deposits posted in the couple's shared chat thread.
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id || 'usr_jane_doe'
    const status = await getReciprocationStatus(userId)

    return NextResponse.json({
      hasPendingReciprocation: !!status.pending,
      pendingReciprocation: status.pending,
      pastReciprocations: status.history,
      partnerId: status.spouseId,
      partnerName: status.spouseName,
      owedByMe: status.owedByMe,
      owedBySpouse: status.owedBySpouse,
      withdrawalsLocked: !!status.pending,
    })
  } catch (error) {
    console.error('[GET /api/savings/reciprocation]', error)
    return NextResponse.json({ error: 'Failed to retrieve reciprocation status' }, { status: 500 })
  }
}
