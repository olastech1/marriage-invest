import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/avatar/[userId]  a member's profile photo (the ?v= in its address changes with each upload)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const avatar = await prisma.avatar.findUnique({ where: { userId } }).catch(() => null)
  if (!avatar) return new Response('Not found', { status: 404 })
  return new Response(Buffer.from(avatar.data), {
    headers: {
      'Content-Type': avatar.mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  })
}
