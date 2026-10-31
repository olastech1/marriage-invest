import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/admin/identity/[id]/document  the ID photo (admins only, never cached)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return new Response('Unauthorised', { status: 403 })
  const { id } = await params
  const check = await prisma.identityCheck.findUnique({ where: { id }, select: { document: true, mimeType: true } })
  if (!check) return new Response('Not found', { status: 404 })
  return new Response(Buffer.from(check.document), {
    headers: {
      'Content-Type': check.mimeType,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  })
}
