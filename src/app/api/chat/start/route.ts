import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { escapeHtml } from '@/lib/utils'
import { resolveSpouseId } from '@/lib/chat'
import { findMember, isEmail, normalizeAccountId } from '@/lib/accountId'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// POST /api/chat/start { query }   (an account ID like chad4821, or an email)
// Finds that one member so you can chat, add them or link as spouses. An email
// that isn't a member gets an invitation to join. Never lists or searches
// other members.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const query = String(body.query ?? body.email ?? '').trim()
  if (!query) {
    return NextResponse.json({ success: false, error: 'Enter an account ID or an email address.' }, { status: 400 })
  }

  const member = await findMember(query)
  if (member?.id === me) {
    return NextResponse.json({ success: false, error: "That's your own account." }, { status: 400 })
  }
  if (member) {
    const [spouseId, saved] = await Promise.all([
      resolveSpouseId(me),
      prisma.contact.findUnique({ where: { ownerId_contactId: { ownerId: me, contactId: member.id } } }).catch(() => null),
    ])
    return NextResponse.json({
      success: true,
      contact: { id: member.id, name: member.name, username: member.username, isSpouse: spouseId === member.id, added: !!saved },
    })
  }

  if (!isEmail(query)) {
    return NextResponse.json(
      { success: false, error: `No member has the account ID "${normalizeAccountId(query)}". Check it and try again.` },
      { status: 404 },
    )
  }

  const email = query.toLowerCase()
  if (email === session.user.email?.toLowerCase()) {
    return NextResponse.json({ success: false, error: "That's your own email." }, { status: 400 })
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
