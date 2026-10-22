import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { escapeHtml } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// POST /api/chat/start { email }
// Start a new chat by email. If that person is a member, returns them so the
// chat can open; otherwise emails them an invitation to join. Never lists or
// searches other members.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const email = String(body.email || '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ success: false, error: 'Enter a valid email address.' }, { status: 400 })
  }
  if (email === session.user.email?.toLowerCase()) {
    return NextResponse.json({ success: false, error: "That's your own email." }, { status: 400 })
  }

  const member = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, username: true } })
  if (member) {
    return NextResponse.json({ success: true, contact: { id: member.id, name: member.name, username: member.username } })
  }

  const inviter = session.user.name || 'A Union Verify member'
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://unionverify.com').replace(/\/$/, '')
  const sent = await sendEmail({
    to: email,
    subject: `${inviter} invited you to chat on Union Verify`,
    html: `<p>${escapeHtml(inviter)} would like to chat with you on Union Verify.</p>
<p><a href="${appUrl}/register?email=${encodeURIComponent(email)}">Create your free account</a> with this email address, then open Chat to reply.</p>`,
  }).catch(() => false)

  return NextResponse.json({
    success: true,
    invited: true,
    emailed: sent,
    inviteUrl: `${appUrl}/register?email=${encodeURIComponent(email)}`,
  })
}
