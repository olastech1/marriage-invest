import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { buildThreadId, createChatMessage, resolveSpouseId } from '@/lib/chat'

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
    const other = await prisma.user.findUnique({ where: { id: String(body.userId || '') }, select: { id: true, name: true } })
    if (!other || other.id === me) return NextResponse.json({ success: false, error: 'Member not found.' }, { status: 404 })
    if (await resolveSpouseId(other.id)) {
      return NextResponse.json({ success: false, error: `${other.name} is already linked to a spouse.` }, { status: 400 })
    }
    await createChatMessage({
      data: {
        threadId: buildThreadId(me, other.id),
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
    await prisma.notification
      .create({
        data: {
          userId: other.id,
          title: `${myName} wants to link as spouses`,
          message: 'Open the chat to accept or ignore the request.',
          type: 'INFO',
          link: `/chat?recipientId=${encodeURIComponent(me)}&name=${encodeURIComponent(myName)}`,
        },
      })
      .catch(() => {})
    return NextResponse.json({ success: true })
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
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
}
