import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  buildThreadId,
  createChatMessage,
  getChatDb,
  isParticipant,
  otherParticipant,
  resolveSpouseId,
} from '@/lib/chat'
import { getReciprocationStatus } from '@/lib/reciprocation'

const DEMO_NAMES: Record<string, string> = {
  usr_jane_doe: 'Jane Doe',
  usr_marcus_vance: 'Marcus Vance',
  usr_admin: 'Support & Advisor',
}

// Chat always acts as the signed-in user (never an id supplied by the browser)
async function resolveCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  return { id: session.user.id, name: session.user.name || 'Member' }
}

const UNAUTHORIZED = () => NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })

async function lookupUser(id: string) {
  if (!id) return null
  const user =
    (await prisma.user.findUnique({ where: { id } })) ||
    (await prisma.user.findFirst({ where: { username: id.toLowerCase() } }))
  return user as any
}

function initials(name?: string | null) {
  return (name || 'UV').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

// ---------------------------------------------------------------------------
// GET /api/chat
// Supports:
//   - ?users=true                 -> directory of members you can message
//   - ?list=true                  -> conversation threads for current user
//   - ?recipientId=<id>           -> messages between current user and recipient
//   - ?thread=<id>|spouse         -> messages for a thread the user belongs to
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const threadParam = searchParams.get('thread')
    const recipientIdParam = searchParams.get('recipientId')
    const listConversations = searchParams.get('list') === 'true'
    const listUsers = searchParams.get('users') === 'true'

    const currentUser = await resolveCurrentUser()
    if (!currentUser) return UNAUTHORIZED()
    const currentUserId = currentUser.id
    const chatDb = await getChatDb()

    // ── 1. USER DIRECTORY ──
    if (listUsers) {
      const allUsers = await prisma.user.findMany()
      const contacts = allUsers
        .filter((u: any) => u.id !== currentUserId)
        .map((u: any) => ({
          id: u.id,
          name: u.name,
          username: u.username || u.name?.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          email: u.email,
          role: u.role,
          bio: u.bio || `${u.role === 'ADMIN' ? 'Platform Administrator' : 'Verified Member'}`,
          avatar: initials(u.name),
          online: true,
        }))

      return NextResponse.json({ success: true, users: contacts, currentUserId })
    }

    const spouseId = await resolveSpouseId(currentUserId)

    // ── 2. CONVERSATION LIST ──
    if (listConversations) {
      const myMessages = await chatDb.chatMessage.findMany({
        where: { OR: [{ senderId: currentUserId }, { recipientId: currentUserId }] },
        orderBy: { createdAt: 'desc' },
        take: 500,
      })

      const threadMap = new Map<string, any>()
      for (const msg of myMessages) {
        const tid = msg.threadId
        const otherId = otherParticipant(tid, currentUserId)
        if (!otherId || otherId === currentUserId.toLowerCase()) continue

        if (!threadMap.has(tid)) {
          const otherName =
            (msg.senderId === otherId ? msg.senderName : msg.recipientName) ||
            (await lookupUser(otherId))?.name ||
            DEMO_NAMES[otherId] ||
            otherId
          threadMap.set(tid, {
            threadId: tid,
            lastMessage: msg,
            otherUserId: otherId,
            otherUserName: otherName,
            isSpouse: otherId === spouseId,
            unreadCount: 0,
            updatedAt: msg.createdAt,
          })
        }
        if (!msg.read && msg.recipientId === currentUserId) {
          threadMap.get(tid).unreadCount++
        }
      }

      // Always surface the spouse thread, even before the first message
      if (spouseId) {
        const spouseThreadId = buildThreadId(currentUserId, spouseId)
        if (!threadMap.has(spouseThreadId)) {
          threadMap.set(spouseThreadId, {
            threadId: spouseThreadId,
            lastMessage: { text: 'Mutual matrimonial vault and joint messaging active.', createdAt: new Date() },
            otherUserId: spouseId,
            otherUserName: (await lookupUser(spouseId))?.name || DEMO_NAMES[spouseId] || spouseId,
            isSpouse: true,
            unreadCount: 0,
            updatedAt: new Date(),
          })
        }
      }

      return NextResponse.json({
        success: true,
        conversations: Array.from(threadMap.values()),
        currentUserId,
        spouseId,
      })
    }

    // ── 3. THREAD MESSAGES ──
    let recipientId = recipientIdParam || ''
    if (!recipientId && threadParam && threadParam !== 'spouse') {
      recipientId = otherParticipant(threadParam, currentUserId)
      if (!recipientId) {
        return NextResponse.json({ success: false, error: 'You are not a participant in this thread' }, { status: 403 })
      }
    }
    if (!recipientId) recipientId = spouseId

    if (!recipientId) {
      return NextResponse.json({
        success: true,
        threadId: null,
        messages: [],
        currentUser,
        recipient: null,
        spouseId,
      })
    }

    const threadId = buildThreadId(currentUserId, recipientId)

    const messages = await chatDb.chatMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
    })

    // Mark messages addressed to me as read
    for (const msg of messages) {
      if (!msg.read && msg.recipientId === currentUserId) {
        await chatDb.chatMessage.update({ where: { id: msg.id }, data: { read: true } })
        msg.read = true
      }
    }

    const recipientUser = await lookupUser(recipientId)
    const lastFromRecipient = [...messages].reverse().find((m) => m.senderId === recipientId)
    const recipientName = recipientUser?.name || lastFromRecipient?.senderName || DEMO_NAMES[recipientId] || recipientId

    return NextResponse.json({
      success: true,
      threadId,
      messages,
      currentUser,
      spouseId,
      reciprocation:
        recipientId === spouseId
          ? await getReciprocationStatus(currentUserId).then((r) => ({
              owedByMe: r.owedByMe,
              pendingMessageId: r.pending?.messageId || null,
            }))
          : null,
      recipient: {
        id: recipientId,
        name: recipientName,
        email: recipientUser?.email || `${recipientId}@unionverify.com`,
        avatar: initials(recipientName),
      },
    })
  } catch (err: any) {
    console.error('[GET /api/chat]', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/chat
// Send a message to another member (defaults to your spouse)
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      text,
      type = 'text',
      senderId,
      senderName,
      recipientId,
      recipientName,
      threadId: threadIdParam,
      proposalData,
      loveNoteTitle,
      voiceDuration,
    } = body

    if (!text && !proposalData && !loveNoteTitle && type !== 'system_reminder') {
      return NextResponse.json({ success: false, error: 'Message content cannot be empty' }, { status: 400 })
    }

    const sender = await resolveCurrentUser()
    if (!sender) return UNAUTHORIZED()

    let effectiveRecipientId: string = recipientId || ''
    if (!effectiveRecipientId && threadIdParam && threadIdParam !== 'spouse') {
      effectiveRecipientId = otherParticipant(threadIdParam, sender.id)
    }
    if (!effectiveRecipientId) {
      effectiveRecipientId = await resolveSpouseId(sender.id)
    }
    if (!effectiveRecipientId || effectiveRecipientId === sender.id) {
      return NextResponse.json(
        { success: false, error: 'No recipient. Share your chat invite link with your spouse to connect.' },
        { status: 400 },
      )
    }

    const effectiveRecipientName =
      recipientName || (await lookupUser(effectiveRecipientId))?.name || DEMO_NAMES[effectiveRecipientId] || 'Member'

    const now = new Date()
    const formattedTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(now)

    const newMsg = await createChatMessage({
      data: {
        threadId: buildThreadId(sender.id, effectiveRecipientId),
        senderId: sender.id,
        senderName: sender.name,
        recipientId: effectiveRecipientId,
        recipientName: effectiveRecipientName,
        text: text ? text.trim() : (proposalData ? `Proposed deposit for ${proposalData.goalName}` : (loveNoteTitle || 'Matrimonial Love Note')),
        timestamp: formattedTime,
        createdAt: now,
        read: false,
        type,
        proposalData,
        loveNoteTitle,
        voiceDuration,
        reactions: {},
      },
    })

    // In-app notification for the recipient
    try {
      await prisma.notification.create({
        data: {
          userId: effectiveRecipientId,
          title: `New Message from ${sender.name}`,
          message: text ? text.slice(0, 100) : 'You received a new message.',
          type: 'INFO',
          link: `/chat?recipientId=${encodeURIComponent(sender.id)}`,
        },
      })
    } catch {
      // Non-blocking notification
    }

    return NextResponse.json({ success: true, message: newMsg })
  } catch (err: any) {
    console.error('[POST /api/chat]', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/chat
// Actions: react (emoji), approve_proposal
// ---------------------------------------------------------------------------
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { messageId, action, reaction, approvedBy, partnerName, senderId } = body

    if (!messageId) {
      return NextResponse.json({ success: false, error: 'messageId is required' }, { status: 400 })
    }

    const currentUser = await resolveCurrentUser()
    if (!currentUser) return UNAUTHORIZED()
    const chatDb = await getChatDb()
    const existing = await chatDb.chatMessage.findUnique({ where: { id: messageId } })

    if (!existing || !isParticipant(existing.threadId, currentUser.id)) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 })
    }

    if (action === 'approve_proposal') {
      const updated = await chatDb.chatMessage.update({
        where: { id: messageId },
        data: {
          proposalData: {
            ...((existing.proposalData as any) || {}),
            status: 'approved',
            approvedBy: currentUser.name,
          },
        },
      })
      return NextResponse.json({ success: true, message: updated })
    }

    if (action === 'react' && reaction) {
      const currentReactions: Record<string, number> = { ...((existing.reactions as any) || {}) }
      currentReactions[reaction] = (currentReactions[reaction] || 0) + 1

      const updated = await chatDb.chatMessage.update({
        where: { id: messageId },
        data: { reactions: currentReactions },
      })
      return NextResponse.json({ success: true, message: updated })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
