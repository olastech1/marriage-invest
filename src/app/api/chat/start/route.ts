import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { escapeHtml, formatAccountNumber } from '@/lib/utils'
import { isPartner } from '@/lib/partners'
import { ensureAccountNumber, findMember, isEmail } from '@/lib/accountId'
import { siteUrl } from '@/lib/site'
import { recordInvitation } from '@/lib/invitations'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// POST /api/chat/start { query, send?, note? }   (an 8-digit account ID, or an email)
// Finds that one member so you can chat, add them or link as spouses. An email
// that isn't a member gets an invite link (to share on WhatsApp), and with
// send: true an invitation email carrying my optional note. Never lists or
// searches other members.
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
    const [linked, saved] = await Promise.all([
      isPartner(me, member.id),
      prisma.contact.findUnique({ where: { ownerId_contactId: { ownerId: me, contactId: member.id } } }).catch(() => null),
    ])
    return NextResponse.json({
      success: true,
      contact: {
        id: member.id,
        name: member.name,
        username: member.username,
        accountNumber: member.accountNumber,
        avatarUrl: member.avatarUrl,
        isSpouse: linked,
        added: !!saved,
      },
    })
  }

  if (!isEmail(query)) {
    const digits = query.replace(/[\s#-]/g, '')
    const error = /^\d+$/.test(digits)
      ? digits.length === 8
        ? `No member has the account ID ${formatAccountNumber(digits)}. Check it and try again.`
        : 'Account IDs have 8 digits. Check it and try again.'
      : 'Enter an 8-digit account ID or an email address.'
    return NextResponse.json({ success: false, error }, { status: 404 })
  }

  const email = query.toLowerCase()
  if (email === session.user.email?.toLowerCase()) {
    return NextResponse.json({ success: false, error: "That's your own email." }, { status: 400 })
  }
  const appUrl = siteUrl()
  // ?invite= lets a WhatsApp invite count as mine too when they sign up
  const inviteUrl = `${appUrl}/register?email=${encodeURIComponent(email)}&invite=${await ensureAccountNumber(me)}`
  if (!body.send) return NextResponse.json({ success: true, invite: true, email, inviteUrl })

  // Keep invites personal, not bulk mail
  const sentToday = await prisma.invitation.count({ where: { inviterId: me, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
  if (sentToday >= 20) {
    return NextResponse.json({ success: false, error: 'You can send up to 20 email invites a day. Share your link on WhatsApp instead.', inviteUrl }, { status: 429 })
  }
  await recordInvitation(me, email)
  const inviter = session.user.name || 'A Union Verify member'
  const note = String(body.note ?? '').trim().slice(0, 500)
  const sent = await sendEmail({
    to: email,
    subject: `${inviter} invited you to Union Verify`,
    html: `${note ? `<p style="white-space:pre-line;padding:12px 16px;border-left:3px solid #C9A84C;background:#f8fafc">${escapeHtml(note)}</p><p style="color:#64748b;font-size:13px">from ${escapeHtml(inviter)}</p>` : ''}
<p>${escapeHtml(inviter)} would like you to join them on Union Verify, where you can invest, save together and chat.</p>
<p><a href="${inviteUrl}">Create your free account</a> with this email address, then open Chat to reply.</p>`,
  }).catch(() => false)

  return NextResponse.json({ success: true, invited: true, emailed: sent, email, inviteUrl })
}
