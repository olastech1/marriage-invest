import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveSpouseId } from '@/lib/chat'
import { ensureAccountId } from '@/lib/accountId'

export const dynamic = 'force-dynamic'

const EMPTY_SOCIALS = { instagram: '', tiktok: '', twitter: '', whatsapp: '', linkedin: '', website: '' }

type ProfileUser = {
  id: string
  name: string
  username: string | null
  email: string
  phone: string | null
  bio: string | null
  socials: unknown
  publicChatEnabled: boolean
  showPhone: boolean
  showEmail: boolean
  role: string
  identityVerified: boolean
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

function present(u: ProfileUser) {
  return {
    id: u.id,
    name: u.name,
    username: u.username || '',
    email: u.email,
    phone: u.phone || '',
    bio: u.bio || '',
    socials: (u.socials as Record<string, string>) || EMPTY_SOCIALS,
    publicChatEnabled: u.publicChatEnabled,
    showPhone: u.showPhone,
    showEmail: u.showEmail,
    publicBioUrl: u.username ? `/u/${u.username}` : null,
    role: u.role,
    avatar: initials(u.name),
    identityVerified: u.identityVerified,
  }
}

export async function GET() {
  try {
    const session = await auth()
    const currentUserId = session?.user?.id
    if (!currentUserId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: currentUserId } })
    if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 })
    if (!user.username) user.username = (await ensureAccountId(user.id)) || null

    const spouseId = await resolveSpouseId(currentUserId)
    const spouse = spouseId ? await prisma.user.findUnique({ where: { id: spouseId } }) : null

    return NextResponse.json({
      success: true,
      user: present(user),
      spouse: spouse ? present(spouse) : null,
    })
  } catch (error: any) {
    console.error('[GET /api/user/profile]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Members can only edit their own profile (a spouse edits theirs from their own account)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    const currentUserId = session?.user?.id
    if (!currentUserId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
    const body = await req.json()
    const { name, phone, bio, socials, publicChatEnabled, showPhone, showEmail, username } = body

    const data: Record<string, unknown> = {}
    if (name) data.name = String(name).slice(0, 80)
    if (phone !== undefined) data.phone = String(phone).slice(0, 25)
    if (bio !== undefined) data.bio = String(bio).slice(0, 500)
    if (socials !== undefined) data.socials = socials
    if (publicChatEnabled !== undefined) data.publicChatEnabled = Boolean(publicChatEnabled)
    if (showPhone !== undefined) data.showPhone = Boolean(showPhone)
    if (showEmail !== undefined) data.showEmail = Boolean(showEmail)
    if (username) {
      const clean = String(username).toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40)
      const taken = await prisma.user.findFirst({ where: { username: clean, NOT: { id: currentUserId } } })
      if (taken) return NextResponse.json({ success: false, error: 'That username is taken.' }, { status: 409 })
      data.username = clean
    }

    if (Object.keys(data).length > 0) {
      await prisma.user.update({ where: { id: currentUserId }, data })
    }

    return NextResponse.json({ success: true, message: 'Saved.' })
  } catch (error: any) {
    console.error('[PATCH /api/user/profile]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
