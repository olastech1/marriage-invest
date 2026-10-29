import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// POST /api/contacts { userId }  add a member to my chat list
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const member = await prisma.user.findFirst({
    where: { id: String(body.userId || ''), role: 'INVESTOR' },
    select: { id: true, name: true },
  })
  if (!member || member.id === me) return NextResponse.json({ success: false, error: 'Member not found.' }, { status: 404 })

  await prisma.contact.upsert({
    where: { ownerId_contactId: { ownerId: me, contactId: member.id } },
    update: {},
    create: { ownerId: me, contactId: member.id },
  })
  return NextResponse.json({ success: true, message: `${member.name} is in your chats.` })
}
