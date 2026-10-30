import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { buildThreadId, createChatMessage, getIncomingSpouseRequests } from '@/lib/chat'
import { RELATIONS, cleanRelation, getPartners, isPartner, linkPartners } from '@/lib/partners'
import { sendEmail } from '@/lib/email'
import { emailMember } from '@/lib/activity'
import { escapeHtml } from '@/lib/utils'
import { siteUrl } from '@/lib/site'

const appUrl = () => siteUrl()

export const dynamic = 'force-dynamic'

const timestamp = () => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date())

/** Close every waiting request card in a chat (a resend can leave more than one) */
async function closeRequests(threadId: string, status: 'accepted' | 'declined', senderId?: string) {
  const cards = await prisma.chatMessage.findMany({ where: { threadId, type: 'spouse_request', ...(senderId ? { senderId } : {}) } })
  for (const card of cards) {
    const data = (card.proposalData || {}) as Record<string, string>
    if (data.status === 'pending') {
      await prisma.chatMessage.update({ where: { id: card.id }, data: { proposalData: { ...data, status } } })
    }
  }
}

/** "spouse" -> "spouses", "business" -> "business partners" (for sentences) */
const asPlural = (relation: string) => (relation === 'business' ? 'business partners' : relation === 'family' ? 'family' : `${relation}s`)

/** Link two members as partners from a request sent to `me` (any number of partners each) */
async function acceptRequest(me: string, myName: string, messageId: string) {
  const request = await prisma.chatMessage.findUnique({ where: { id: messageId } })
  const data = (request?.proposalData || {}) as Record<string, string>
  if (!request || request.type !== 'spouse_request' || data.toUserId !== me || data.status !== 'pending') {
    return NextResponse.json({ success: false, error: 'Request not found.' }, { status: 404 })
  }
  const requesterId = data.fromUserId
  const relation = cleanRelation(data.relation)
  await linkPartners(me, requesterId, relation)
  await prisma.chatMessage.update({ where: { id: request.id }, data: { proposalData: { ...data, status: 'accepted' } } })
  await closeRequests(request.threadId, 'accepted')
  await createChatMessage({
    data: {
      threadId: request.threadId,
      senderId: me,
      senderName: myName,
      recipientId: requesterId,
      recipientName: request.senderName,
      text: `${myName} accepted. You are now linked as ${asPlural(relation)}, with your own joint vault.`,
      timestamp: timestamp(),
      type: 'text',
    },
  })
  // Close my "wants to link" prompt from them, and tell the requester
  await prisma.notification.updateMany({
    where: { userId: me, category: 'SPOUSE_REQUEST', attended: false, metadata: { path: ['fromUserId'], equals: requesterId } },
    data: { attended: true, read: true, attendedAt: new Date() },
  })
  const requester = await prisma.user.findUnique({ where: { id: requesterId }, select: { email: true, name: true } })
  await prisma.notification
    .create({
      data: {
        userId: requesterId,
        title: `${myName} accepted — you're linked as partners`,
        message: 'You now have a joint vault together, with reciprocation and withdrawal approvals.',
        type: 'SUCCESS',
        link: `/chat?recipientId=${encodeURIComponent(me)}&name=${encodeURIComponent(myName)}`,
      },
    })
    .catch(() => {})
  if (requester) {
    await sendEmail({
      to: requester.email,
      subject: `${myName} accepted your partner request`,
      html: `<p>Hi ${escapeHtml(requester.name)},</p>
<p>${escapeHtml(myName)} accepted. Your Union Verify accounts are now linked as partners.</p>
<p><a href="${appUrl()}/dashboard">Open your dashboard</a></p>`,
    }).catch(() => false)
  }
  return NextResponse.json({ success: true, linked: true })
}

// ---------------------------------------------------------------------------
// GET /api/spouse  my partners, requests waiting for my answer, and requests I sent
// ---------------------------------------------------------------------------
export async function GET() {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })
  const partners = await getPartners(me)
  const linked = new Set(partners.map((p) => p.id))
  const sent = await prisma.chatMessage.findMany({ where: { type: 'spouse_request', senderId: me }, orderBy: { createdAt: 'desc' } })
  const outgoing = new Map<string, { toUserId: string; toName: string }>()
  for (const m of sent) {
    const data = (m.proposalData || {}) as Record<string, string>
    if (data.status === 'pending' && data.toUserId && !linked.has(data.toUserId) && !outgoing.has(data.toUserId)) {
      outgoing.set(data.toUserId, { toUserId: data.toUserId, toName: m.recipientName || 'Member' })
    }
  }
  return NextResponse.json({
    success: true,
    partners: partners.map(({ email: _email, ...p }) => p),
    requests: await getIncomingSpouseRequests(me),
    outgoing: [...outgoing.values()],
    relations: RELATIONS,
  })
}

// ---------------------------------------------------------------------------
// POST /api/spouse
//   { action: 'request', userId, relation? }  ask a member to link as partners (spouse, friend…)
//   { action: 'accept', messageId }           accept a request you received
//   { action: 'decline', messageId }          decline a request you received
// Linking needs both people; nobody becomes a partner just by chatting.
// A member can link with any number of partners; each pair has its own joint vault.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })
  const myName = session.user.name || 'Member'
  const body = await req.json().catch(() => ({}))

  if (body.action === 'decline') {
    const request = await prisma.chatMessage.findUnique({ where: { id: String(body.messageId || '') } })
    const data = (request?.proposalData || {}) as Record<string, string>
    if (!request || request.type !== 'spouse_request' || data.toUserId !== me || data.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Request not found.' }, { status: 404 })
    }
    const requesterId = request.senderId
    await closeRequests(request.threadId, 'declined', requesterId)
    await createChatMessage({
      data: {
        threadId: request.threadId,
        senderId: me,
        senderName: myName,
        recipientId: requesterId,
        recipientName: request.senderName,
        text: `${myName} declined the request to link as partners.`,
        timestamp: timestamp(),
        type: 'text',
      },
    })
    await prisma.notification.updateMany({
      where: { userId: me, category: 'SPOUSE_REQUEST', attended: false, metadata: { path: ['fromUserId'], equals: requesterId } },
      data: { attended: true, read: true, attendedAt: new Date() },
    })
    const chatLink = `/chat?recipientId=${encodeURIComponent(me)}&name=${encodeURIComponent(myName)}`
    await prisma.notification
      .create({
        data: {
          userId: requesterId,
          title: `${myName} declined your partner request`,
          message: 'Your accounts were not linked.',
          type: 'WARNING',
          link: chatLink,
        },
      })
      .catch(() => {})
    await emailMember(requesterId, {
      subject: `${myName} declined your partner request`,
      heading: 'Partner request declined',
      paragraphs: [`${myName} declined your request to link your Union Verify accounts as partners. Your accounts were not linked.`],
      ctaLabel: 'Open the chat',
      ctaPath: chatLink,
    })
    return NextResponse.json({ success: true })
  }

  if (body.action === 'request') {
    const other = await prisma.user.findFirst({ where: { id: String(body.userId || ''), role: 'INVESTOR' }, select: { id: true, name: true, email: true } })
    if (!other || other.id === me) return NextResponse.json({ success: false, error: 'Member not found.' }, { status: 404 })
    if (await isPartner(me, other.id)) {
      return NextResponse.json({ success: false, error: `You are already linked with ${other.name}.` }, { status: 400 })
    }
    // They already asked me: asking back means yes
    const theirRequest = (await getIncomingSpouseRequests(me)).find((r) => r.fromUserId === other.id)
    if (theirRequest) return acceptRequest(me, myName, theirRequest.messageId)

    // Asking again re-sends the email/notification instead of adding a second request card
    const threadId = buildThreadId(me, other.id)
    const pendingRequests = await prisma.chatMessage.findMany({ where: { threadId, type: 'spouse_request', senderId: me } })
    const waiting = pendingRequests.find((m) => (m.proposalData as Record<string, string> | null)?.status === 'pending')
    // A resend without a relationship keeps the one chosen first
    const relation = cleanRelation(body.relation ?? (waiting?.proposalData as Record<string, string> | null)?.relation)
    const relationLabel = RELATIONS[relation].toLowerCase()
    // Asking again with a different relationship updates the waiting request
    if (waiting) {
      await prisma.chatMessage.update({
        where: { id: waiting.id },
        data: {
          text: `${myName} asked to link your accounts as ${asPlural(relation)}: a joint vault, reciprocation and withdrawal approvals between you two.`,
          proposalData: { ...((waiting.proposalData as Record<string, string>) || {}), relation },
        },
      })
    }
    if (!waiting) await createChatMessage({
      data: {
        threadId,
        senderId: me,
        senderName: myName,
        recipientId: other.id,
        recipientName: other.name,
        text: `${myName} asked to link your accounts as ${asPlural(relation)}: a joint vault, reciprocation and withdrawal approvals between you two.`,
        timestamp: timestamp(),
        type: 'spouse_request',
        proposalData: { status: 'pending', fromUserId: me, toUserId: other.id, relation },
      },
    })
    const chatLink = `/chat?recipientId=${encodeURIComponent(me)}&name=${encodeURIComponent(myName)}`
    // A resend replaces the earlier prompt rather than stacking a second one
    await prisma.notification.deleteMany({
      where: { userId: other.id, category: 'SPOUSE_REQUEST', attended: false, metadata: { path: ['fromUserId'], equals: me } },
    })
    await prisma.notification
      .create({
        data: {
          userId: other.id,
          title: `${myName} wants to link with you (${relationLabel})`,
          message: 'Accept or decline on your dashboard or in your chat with them.',
          type: 'INFO',
          link: chatLink,
          category: 'SPOUSE_REQUEST',
          requiresAction: true,
          actionLabel: 'Open request',
          metadata: { fromUserId: me },
        },
      })
      .catch(() => {})
    const emailed = await sendEmail({
      to: other.email,
      subject: `${myName} wants to link your Union Verify accounts (${relationLabel})`,
      html: `<p>Hi ${escapeHtml(other.name)},</p>
<p>${escapeHtml(myName)} asked to link your Union Verify accounts as ${escapeHtml(asPlural(relation))}. You would have a joint vault together, reciprocate each other's deposits and approve each other's withdrawals from what you share. It doesn't affect your other partners.</p>
<p><a href="${appUrl()}${chatLink}">Open the request</a> and tap <strong>Accept</strong> if you agree. If you don't know ${escapeHtml(myName)}, just ignore this email.</p>`,
    }).catch(() => false)
    return NextResponse.json({ success: true, emailed })
  }

  if (body.action === 'accept') return acceptRequest(me, myName, String(body.messageId || ''))

  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
}
