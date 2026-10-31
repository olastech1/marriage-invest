import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/admin/identity  identity checks, waiting ones first (no photos; those load one at a time)
export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
  const checks = await prisma.identityCheck.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { id: true, userId: true, documentType: true, fullName: true, status: true, reviewNote: true, createdAt: true, reviewedAt: true },
  })
  const users = await prisma.user.findMany({
    where: { id: { in: [...new Set(checks.map((c) => c.userId))] } },
    select: { id: true, name: true, email: true, accountNumber: true },
  })
  const rows = checks.map((c) => ({ ...c, user: users.find((u) => u.id === c.userId) || null }))
  rows.sort((a, b) => Number(b.status === 'PENDING') - Number(a.status === 'PENDING'))
  return NextResponse.json({ success: true, checks: rows })
}
