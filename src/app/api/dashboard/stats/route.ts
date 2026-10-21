import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

    const [userRecord, investments, transactions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, identityVerified: true },
      }),
      prisma.investment.findMany({
        where: { userId },
        include: { opportunity: true },
      }),
      prisma.transaction.findMany({
        where: { userId, status: 'COMPLETED' },
      }),
    ])

    const totalInvested = investments
      .filter((i) => i.status === 'ACTIVE' || i.status === 'MATURED')
      .reduce((s, i) => s + Number(i.amount), 0)

    const activeInvestments = investments.filter((i) => i.status === 'ACTIVE').length

    const totalDistributions = transactions
      .filter((t) => t.type === 'DISTRIBUTION')
      .reduce((s, t) => s + Number(t.netAmount), 0)

    const totalDeposited = transactions
      .filter((t) => t.type === 'DEPOSIT')
      .reduce((s, t) => s + Number(t.netAmount), 0)

    return NextResponse.json({
      success: true,
      user: userRecord,
      totalInvested,
      totalDeposited,
      activeInvestments,
      totalDistributions,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
