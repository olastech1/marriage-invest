import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    const currentUserId = session?.user?.id || 'usr_jane_doe'

    const user: any = (await prisma.user.findUnique({
      where: { id: currentUserId },
    })) || {
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

    const spouse: any = (await prisma.user.findUnique({
      where: { id: 'usr_marcus_vance' },
    })) || {
      id: 'usr_marcus_vance',
      name: 'Your Partner',
      username: 'partner',
      email: '',
      phone: '',
      bio: 'Joint Signatory on Union Verify. Committed to financial freedom, covenant growth, and mutual compound yield.',
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

    const userSlug = user.username || 'investor'
    const spouseSlug = spouse.username || 'partner'

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: userSlug,
        email: user.email,
        phone: user.phone || '',
        bio: user.bio || 'Building our generational wealth together on Union Verify. 💍✨',
        socials: user.socials || {
          instagram: '',
          tiktok: '',
          twitter: '',
          whatsapp: user.phone || '',
          linkedin: '',
          website: 'https://unionverify.com',
        },
        publicChatEnabled: user.publicChatEnabled !== false,
        showPhone: user.showPhone !== false,
        showEmail: user.showEmail !== false,
        publicBioUrl: `/u/${userSlug}`,
        role: user.role,
        avatar: user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2),
        identityVerified: user.identityVerified,
      },
      spouse: {
        id: spouse.id,
        name: spouse.name,
        username: spouseSlug,
        email: spouse.email,
        phone: spouse.phone || '',
        bio: spouse.bio || 'Joint Signatory on Union Verify.',
        socials: spouse.socials || {
          instagram: '',
          tiktok: '',
          twitter: '',
          whatsapp: spouse.phone || '',
          linkedin: '',
          website: 'https://unionverify.com',
        },
        publicChatEnabled: spouse.publicChatEnabled !== false,
        showPhone: spouse.showPhone !== false,
        showEmail: spouse.showEmail !== false,
        publicBioUrl: `/u/${spouseSlug}`,
        avatar: spouse.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2),
        relationship: 'Joint Signatory',
        covenantId: 'UV-2026-98420',
        status: 'Online',
      },
      covenant: {
        seal: 'UV-2026-98420',
        jointVault: `${user.name} & ${spouse.name} Spousal Contribution`,
        rule: 'Rule 4.2: Mutual Matrimonial Savings Reciprocation Protocol',
        parity: '100% Balanced',
      },
    })
  } catch (error: any) {
    console.error('[GET /api/user/profile]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    const currentUserId = session?.user?.id || 'usr_jane_doe'
    const body = await req.json()
    const {
      name,
      phone,
      bio,
      socials,
      publicChatEnabled,
      showPhone,
      showEmail,
      username,
      spousePhone,
      spouseEmail,
      spouseBio,
      spouseSocials,
    } = body

    const userUpdateData: any = {}
    if (name) userUpdateData.name = name
    if (phone) userUpdateData.phone = phone
    if (bio !== undefined) userUpdateData.bio = bio
    if (socials !== undefined) userUpdateData.socials = socials
    if (publicChatEnabled !== undefined) userUpdateData.publicChatEnabled = Boolean(publicChatEnabled)
    if (showPhone !== undefined) userUpdateData.showPhone = Boolean(showPhone)
    if (showEmail !== undefined) userUpdateData.showEmail = Boolean(showEmail)
    if (username) userUpdateData.username = username.toLowerCase().replace(/[^a-z0-9_-]/g, '')

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: currentUserId },
        data: userUpdateData,
      })
    }

    const spouseUpdateData: any = {}
    if (spousePhone) spouseUpdateData.phone = spousePhone
    if (spouseEmail) spouseUpdateData.email = spouseEmail
    if (spouseBio !== undefined) spouseUpdateData.bio = spouseBio
    if (spouseSocials !== undefined) spouseUpdateData.socials = spouseSocials

    if (Object.keys(spouseUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: 'usr_marcus_vance' },
        data: spouseUpdateData,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Contact and social profile information updated successfully.',
    })
  } catch (error: any) {
    console.error('[PATCH /api/user/profile]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
