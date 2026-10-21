import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/admin/health — checks the database really answers a query (admin only)
export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const started = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ success: true, database: 'ok', latencyMs: Date.now() - started })
  } catch (error) {
    console.error('[GET /api/admin/health]', error)
    return NextResponse.json(
      { success: false, database: 'error', error: 'The database did not respond to a test query.' },
      { status: 503 },
    )
  }
}
