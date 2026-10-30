import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Public member profile by username: only this member's own details, as they chose to share them.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const username = slug.toLowerCase().trim()

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 })
    }

    const socials = (user.socials as Record<string, string> | null) || {}

    return NextResponse.json({
      success: true,
      profile: {
        userId: user.id,
        name: user.name,
        username,
        avatar: user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
        avatarUrl: user.avatarUrl || null,
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
      },
    })
  } catch (error: any) {
    console.error('[GET /api/user/profile/[slug]]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
