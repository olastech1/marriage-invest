import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getReciprocationStatus } from '@/lib/reciprocation'
import { getPartners } from '@/lib/partners'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// GET /api/savings/reciprocation?partner=<id>
// What I owe that partner (and they owe me), from the deposits in our chat,
// plus the list of my partners (each has a separate joint vault).
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
    const partners = await getPartners(userId)
    const asked = req.nextUrl.searchParams.get('partner') || ''
    const partnerId = partners.some((p) => p.id === asked) ? asked : partners[0]?.id || ''
    const status = await getReciprocationStatus(userId, partnerId || undefined)

    return NextResponse.json({
      hasPendingReciprocation: !!status.pending,
      pendingReciprocation: status.pending,
      pastReciprocations: status.history,
      partnerId: status.spouseId,
      partnerName: status.spouseName,
      owedByMe: status.owedByMe,
      pendingDeposits: status.pendingDeposits,
      spousePendingDeposits: status.spousePendingDeposits,
      owedBySpouse: status.owedBySpouse,
      withdrawalsLocked: !!status.pending,
      partners: partners.map(({ email: _email, ...p }) => p),
    })
  } catch (error) {
    console.error('[GET /api/savings/reciprocation]', error)
    return NextResponse.json({ error: 'Failed to retrieve reciprocation status' }, { status: 500 })
  }
}
