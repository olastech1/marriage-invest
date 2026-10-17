import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    const currentUserId = session?.user?.id || 'usr_jane_doe'

    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
    }) || {
      id: 'usr_jane_doe',
      name: 'Jane Doe',
      email: 'jane.doe@unioninvest.com',
      phone: '+1 (555) 349-8821',
      role: 'INVESTOR',
      identityVerified: true,
    }

    const spouse = await prisma.user.findUnique({
      where: { id: 'usr_marcus_vance' },
    }) || {
      id: 'usr_marcus_vance',
      name: 'Marcus Vance',
      email: 'marcus.vance@unioninvest.com',
      phone: '+1 (555) 782-9940',
      role: 'INVESTOR',
      identityVerified: true,
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: (user as any).phone || '+1 (555) 349-8821',
        role: user.role,
        avatar: user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2),
        identityVerified: user.identityVerified,
      },
      spouse: {
        id: spouse.id,
        name: spouse.name,
        email: spouse.email,
        phone: (spouse as any).phone || '+1 (555) 782-9940',
        avatar: spouse.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2),
        relationship: 'Husband & Joint Signatory',
        covenantId: 'CH-MIC-2026-98420',
        status: 'Online',
      },
      covenant: {
        seal: 'CH-MIC-2026-98420',
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
    const { name, phone, spousePhone, spouseEmail } = body

    if (name || phone) {
      await prisma.user.update({
        where: { id: currentUserId },
        data: {
          ...(name ? { name } : {}),
          ...(phone ? { phone } : {}),
        },
      })
    }

    if (spousePhone || spouseEmail) {
      await prisma.user.update({
        where: { id: 'usr_marcus_vance' },
        data: {
          ...(spousePhone ? { phone: spousePhone } : {}),
          ...(spouseEmail ? { email: spouseEmail } : {}),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Contact and profile information updated successfully.',
    })
  } catch (error: any) {
    console.error('[PATCH /api/user/profile]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
