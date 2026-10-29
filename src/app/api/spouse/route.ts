import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { buildThreadId, createChatMessage, resolveSpouseId } from '@/lib/chat'
import { sendEmail } from '@/lib/email'
import { escapeHtml } from '@/lib/utils'

const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL || 'https://unionverify.com').replace(/\/$/, '')

export const dynamic = 'force-dynamic'

const timestamp = () => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date())

// ---------------------------------------------------------------------------
// POST /api/spouse
//   { action: 'request', userId }    ask a member (in your chat) to link as spouses
//   { action: 'accept', messageId }  accept a request you received
// Linking needs both people; nobody becomes a spouse just by chatting.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })
  const myName = session.user.name || 'Member'
  const body = await req.json().catch(() => ({}))

  if (await resolveSpouseId(me)) {
    return NextResponse.json({ success: false, error: 'Your account is already linked to a spouse.' }, { status: 400 })
  }

  if (body.action === 'request') {
    const other = await prisma.user.findUnique({ where: { id: String(body.userId || '') }, select: { id: true, name: true, email: true } })
    if (!other || other.id === me) return NextResponse.json({ success: false, error: 'Member not found.' }, { status: 404 })
    if (await resolveSpouseId(other.id)) {
      return NextResponse.json({ success: false, error: `${other.name} is already linked to a spouse.` }, { status: 400 })
    }
    // Asking again re-sends the email/notification instead of adding a second request card
    const threadId = buildThreadId(me, other.id)
    const pendingRequests = await prisma.chatMessage.findMany({ where: { threadId, type: 'spouse_request', senderId: me } })
    const alreadyAsked = pendingRequests.some((m) => (m.proposalData as Record<string, string> | null)?.status === 'pending')
    if (!alreadyAsked) await createChatMessage({
      data: {
        threadId,
        senderId: me,
        senderName: myName,
        recipientId: other.id,
        recipientName: other.name,
        text: `${myName} asked to link your accounts as spouses (joint vault, reciprocation and withdrawal approvals).`,
        timestamp: timestamp(),
        type: 'spouse_request',
        proposalData: { status: 'pending', fromUserId: me, toUserId: other.id },
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
          title: `${myName} wants to link as spouses`,
          message: 'Open the chat with them to accept.',
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
      subject: `${myName} wants to link your Union Verify accounts as spouses`,
      html: `<p>Hi ${escapeHtml(other.name)},</p>
<p>${escapeHtml(myName)} asked to link your Union Verify accounts as spouses. Linked spouses share a joint vault, reciprocate each other's deposits and approve each other's joint withdrawals.</p>
<p><a href="${appUrl()}${chatLink}">Open the request</a> and tap <strong>Accept</strong> if you agree. If you don't know ${escapeHtml(myName)}, just ignore this email.</p>`,
    }).catch(() => false)
    return NextResponse.json({ success: true, emailed })
  }

  if (body.action === 'accept') {
    const request = await prisma.chatMessage.findUnique({ where: { id: String(body.messageId || '') } })
    const data = (request?.proposalData || {}) as Record<string, string>
    if (!request || request.type !== 'spouse_request' || data.toUserId !== me || data.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Request not found.' }, { status: 404 })
    }
    const requesterId = data.fromUserId
    if (await resolveSpouseId(requesterId)) {
      return NextResponse.json({ success: false, error: 'They are already linked to a spouse.' }, { status: 400 })
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: me }, data: { spouseId: requesterId } }),
      prisma.user.update({ where: { id: requesterId }, data: { spouseId: me } }),
      prisma.chatMessage.update({ where: { id: request.id }, data: { proposalData: { ...data, status: 'accepted' } } }),
    ])
    await createChatMessage({
      data: {
        threadId: request.threadId,
        senderId: me,
        senderName: myName,
        recipientId: requesterId,
        recipientName: request.senderName,
        text: `${myName} accepted. You are now linked as spouses.`,
        timestamp: timestamp(),
        type: 'text',
      },
    })
    // Close my "wants to link" prompt, and tell the requester
    await prisma.notification.updateMany({
      where: { userId: me, category: 'SPOUSE_REQUEST', attended: false },
      data: { attended: true, read: true, attendedAt: new Date() },
    })
    const requester = await prisma.user.findUnique({ where: { id: requesterId }, select: { email: true, name: true } })
    await prisma.notification
      .create({
        data: {
          userId: requesterId,
          title: `${myName} accepted — you're linked as spouses`,
          message: 'Your joint vault, reciprocation and withdrawal approvals are now shared.',
          type: 'SUCCESS',
          link: `/chat?recipientId=${encodeURIComponent(me)}&name=${encodeURIComponent(myName)}`,
        },
      })
      .catch(() => {})
    if (requester) {
      await sendEmail({
        to: requester.email,
        subject: `${myName} accepted your spouse request`,
        html: `<p>Hi ${escapeHtml(requester.name)},</p>
<p>${escapeHtml(myName)} accepted. Your Union Verify accounts are now linked as spouses.</p>
<p><a href="${appUrl()}/dashboard">Open your dashboard</a></p>`,
      }).catch(() => false)
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
}
