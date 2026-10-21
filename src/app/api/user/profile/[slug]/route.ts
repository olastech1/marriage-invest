import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const cleanSlug = slug.toLowerCase().trim()

    // 1. Try to find user by username or ID
    let user: any = await prisma.user.findFirst({
      where: {
        username: cleanSlug,
      },
    })

    if (!user) {
      if (cleanSlug.includes('jane')) {
        user = await prisma.user.findUnique({ where: { id: 'usr_jane_doe' } })
      } else if (cleanSlug.includes('marcus')) {
        user = await prisma.user.findUnique({ where: { id: 'usr_marcus_vance' } })
      } else {
        user = await prisma.user.findFirst()
      }
    }

    if (!user) {
      user = {
        id: 'usr_jane_doe',
        name: 'Investor',
        username: 'investor',
        email: '',
        phone: '',
        bio: 'Building our generational wealth together on Union Verify. Co-managing our 6.8% compounding joint spousal vault. 💍✨',
        socials: {
          instagram: '',
          tiktok: '',
          twitter: '',
          whatsapp: '',
          linkedin: '',
          website: 'https://unionverify.com',
        },
        publicChatEnabled: true,
        showPhone: true,
        showEmail: true,
        role: 'INVESTOR',
        identityVerified: true,
      }
    }

    const isMarcus = user.id === 'usr_marcus_vance' || cleanSlug.includes('marcus')
    const spouseId = isMarcus ? 'usr_jane_doe' : 'usr_marcus_vance'
    const spouse: any = (await prisma.user.findUnique({ where: { id: spouseId } })) || {
      id: spouseId,
      name: isMarcus ? 'Jane Doe' : 'Marcus Vance',
      username: isMarcus ? 'jane-doe' : 'marcus-vance',
      email: '',
      phone: '',
      bio: isMarcus ? 'Building our generational wealth together.' : 'Husband & Joint Signatory on Union Verify.',
    }

    const primaryName = user.name || (isMarcus ? 'Marcus Vance' : 'Jane Doe')
    const spouseName = spouse.name || (isMarcus ? 'Jane Doe' : 'Marcus Vance')
    const username = user.username || cleanSlug

    return NextResponse.json({
      success: true,
      profile: {
        userId: user.id,
        name: primaryName,
        username,
        avatar: primaryName.split(' ').map((n: string) => n[0]).join('').slice(0, 2),
        bio: user.bio || 'Verified Member of Union Verify · Co-managing our joint 6.8% compounding matrimonial savings vault.',
        identityVerified: true,
        memberSince: '2024',
        covenantSeal: 'UV-2026-98420',
        vaultName: `${isMarcus ? spouseName : primaryName} & ${isMarcus ? primaryName : spouseName} Spousal Contribution`,
        status: 'Online & Verified',
        publicChatEnabled: user.publicChatEnabled !== false,
        contact: {
          email: user.showEmail !== false ? user.email : null,
          phone: user.showPhone !== false ? (user.phone || '') : null,
          whatsapp: user.socials?.whatsapp || user.phone || '',
        },
        socials: {
          instagram: user.socials?.instagram || '',
          tiktok: user.socials?.tiktok || '',
          twitter: user.socials?.twitter || '',
          linkedin: user.socials?.linkedin || '',
          website: user.socials?.website || 'https://unionverify.com',
        },
        spouse: {
          name: spouseName,
          relationship: isMarcus ? 'Wife & Joint Signatory' : 'Husband & Joint Signatory',
          avatar: spouseName.split(' ').map((n: string) => n[0]).join('').slice(0, 2),
          covenantId: 'UV-2026-98420',
          email: spouse.email,
        },
        metrics: {
          covenantParity: '100% Balanced',
          compoundingApy: '6.8% APY',
          dualApprovalEnabled: true,
          fiduciaryCustody: 'Union Verify Standards',
        },
      },
    })
  } catch (error: any) {
    console.error('[GET /api/user/profile/[slug]]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
