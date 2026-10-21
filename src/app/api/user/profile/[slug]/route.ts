import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { resolveSpouseId } from '@/lib/chat'

export const dynamic = 'force-dynamic'

// Public member profile by username. Only shows what the member chose to share.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const username = slug.toLowerCase().trim()

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 })
    }

    const spouseId = await resolveSpouseId(user.id)
    const spouse = spouseId ? await prisma.user.findUnique({ where: { id: spouseId }, select: { name: true } }) : null
    const socials = (user.socials as Record<string, string> | null) || {}

    return NextResponse.json({
      success: true,
      profile: {
        userId: user.id,
        name: user.name,
        username,
        avatar: user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
        bio: user.bio || '',
        identityVerified: user.identityVerified,
        memberSince: String(user.createdAt.getFullYear()),
        publicChatEnabled: user.publicChatEnabled,
        contact: {
          email: user.showEmail ? user.email : null,
          phone: user.showPhone ? user.phone || null : null,
          whatsapp: socials.whatsapp || '',
        },
        socials: {
          instagram: socials.instagram || '',
          tiktok: socials.tiktok || '',
          twitter: socials.twitter || '',
          linkedin: socials.linkedin || '',
          website: socials.website || '',
        },
        spouse: spouse ? { name: spouse.name } : null,
      },
    })
  } catch (error: any) {
    console.error('[GET /api/user/profile/[slug]]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
