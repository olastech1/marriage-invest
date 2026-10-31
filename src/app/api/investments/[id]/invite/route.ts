import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { buildThreadId, createChatMessage, resolveSpouseId } from '@/lib/chat'
import { isPartner } from '@/lib/partners'
import { sendEmail } from '@/lib/email'
import { escapeHtml } from '@/lib/utils'
import { siteUrl } from '@/lib/site'
import { recordInvitation } from '@/lib/invitations'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

// ---------------------------------------------------------------------------
// POST /api/investments/[id]/invite { to: 'spouse' | <email>, amount?, note? }
// Invite your spouse or anyone (by email) to invest in an open opportunity.
// Members get a card in chat with a one-tap "Invest $X"; everyone gets an email
// when email is configured; non-members are invited to create an account.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })
  const myName = session.user.name || 'A Union Verify member'

  const { id } = await params
  const opportunity = await prisma.investmentOpportunity.findFirst({ where: { OR: [{ id }, { slug: id }] } })
  if (!opportunity || opportunity.status !== 'ACTIVE') {
    return NextResponse.json({ success: false, error: 'This opportunity is not open for investment.' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const note = String(body.note || '').trim().slice(0, 300)
  const amount = body.amount ? Math.round(Number(body.amount) * 100) / 100 : null
  const min = Number(opportunity.minAmount)
  if (amount !== null && !(amount >= min)) {
    return NextResponse.json({ success: false, error: `The minimum for this fund is $${min.toLocaleString()}.` }, { status: 400 })
  }

  // Who is invited
  let recipient: { id: string; name: string; email: string } | null = null
  let email = ''
  if (body.partnerId || body.to === 'spouse') {
    // One of my partners (older clients send 'spouse': the partner chatted with most recently)
    const spouseId = body.partnerId ? ((await isPartner(me, String(body.partnerId))) ? String(body.partnerId) : '') : await resolveSpouseId(me)
    recipient = spouseId ? await prisma.user.findUnique({ where: { id: spouseId }, select: { id: true, name: true, email: true } }) : null
    if (!recipient) return NextResponse.json({ success: false, error: 'You have no linked partner yet.' }, { status: 400 })
    email = recipient.email
  } else {
    email = String(body.to || '').trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Enter a valid email address.' }, { status: 400 })
    }
    if (email === session.user.email?.toLowerCase()) {
      return NextResponse.json({ success: false, error: "That's your own email." }, { status: 400 })
    }
    recipient = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true } })
  }

  const appUrl = siteUrl()
  const fundUrl = `${appUrl}/investments/${opportunity.slug}`
  const amountText = amount ? `$${amount.toLocaleString()} ` : ''

  // Member: card in your chat with them, plus a notification
  if (recipient) {
    await createChatMessage({
      data: {
        threadId: buildThreadId(me, recipient.id),
        senderId: me,
        senderName: myName,
        recipientId: recipient.id,
        recipientName: recipient.name,
        text: `${myName} invited you to invest ${amountText}in ${opportunity.title}.${note ? ` "${note}"` : ''}`,
        timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
        type: 'invest_invite',
        proposalData: {
          opportunityId: opportunity.id,
          slug: opportunity.slug,
          goalName: opportunity.title,
          amount: amount ?? undefined,
          fromUserId: me,
          toUserId: recipient.id,
        },
      },
    })
    await prisma.notification
      .create({
        data: {
          userId: recipient.id,
          title: `${myName} invited you to invest`,
          message: `${amountText}in ${opportunity.title}${note ? ` — "${note}"` : ''}`,
          type: 'INFO',
          link: `/investments/${opportunity.slug}`,
        },
      })
      .catch(() => {})
  }

  // Not a member yet: they show up in my chats when they join
  if (!recipient) await recordInvitation(me, email)
  const emailed = await sendEmail({
    to: email,
    subject: `${myName} invited you to invest in ${opportunity.title}`,
    html: `<p>${escapeHtml(myName)} invited you to invest ${escapeHtml(amountText)}in <strong>${escapeHtml(opportunity.title)}</strong> on Union Verify.</p>
${note ? `<blockquote style="border-left:3px solid #C9A84C;margin:0;padding:8px 12px">${escapeHtml(note)}</blockquote>` : ''}
<p><a href="${fundUrl}">View the opportunity</a>${recipient ? '' : ` — <a href="${appUrl}/register?email=${encodeURIComponent(email)}">create a free account</a> with this email to invest`}.</p>
<p style="color:#64748b;font-size:12px">Returns are projections, not guarantees. Your capital is at risk.</p>`,
  }).catch(() => false)

  return NextResponse.json({
    success: true,
    member: !!recipient,
    emailed,
    message: recipient
      ? `Invitation sent to ${recipient.name} in your chat${emailed ? ' and by email' : ''}.`
      : emailed
        ? `${email} isn't a member yet — we emailed them the opportunity and an invitation to join.`
        : `${email} isn't a member yet. Send them this link: ${fundUrl}`,
  })
}
