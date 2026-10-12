import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.role || !['ADMIN', 'FINANCE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    const withdrawals = await prisma.withdrawalRequest.findMany({
      include: {
        user: { select: { name: true, email: true } },
        investment: {
          select: {
            referenceNumber: true,
            opportunity: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ withdrawals })
  } catch (error) {
    console.error('[GET /api/admin/withdrawals]', error)
    return NextResponse.json({ error: 'Failed to retrieve withdrawal requests' }, { status: 500 })
  }
}
