import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { emailMember } from '@/lib/activity'
import {
  buildThreadId,
  createChatMessage,
  getChatDb,
  isParticipant,
  otherParticipant,
  resolveSpouseId,
} from '@/lib/chat'
import { getReciprocationStatus } from '@/lib/reciprocation'
import { sendEmail } from '@/lib/email'
import { escapeHtml } from '@/lib/utils'

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

/** The email a visitor left with their message in this thread, if any */
async function findGuestEmail(threadId: string): Promise<string | null> {
  const chatDb = await getChatDb()
  const messages = await chatDb.chatMessage.findMany({ where: { threadId }, orderBy: { createdAt: 'desc' }, take: 50 })
  for (const m of messages) {
    const email = (m.proposalData as Record<string, unknown> | null)?.guestEmail
    if (typeof email === 'string' && email.includes('@')) return email
  }
  return null
}

async function emailVisitorReply(to: string, fromName: string, text: string): Promise<boolean> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://unionverify.com').replace(/\/$/, '')
  return sendEmail({
    to,
    subject: `${fromName} replied to your message on Union Verify`,
    html: `<p>${escapeHtml(fromName)} replied:</p>
<blockquote style="border-left:3px solid #C9A84C;margin:0;padding:8px 12px;color:#0f172a">${escapeHtml(text)}</blockquote>
<p>To keep track of the whole conversation and reply in the app,
<a href="${appUrl}/register?email=${encodeURIComponent(to)}">create a free Union Verify account</a> with this email address.
Your earlier messages will appear in your account.</p>`,
  }).catch(() => false)
}

function initials(name?: string | null) {
  return (name || 'UV').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}


type Conversation = {
  threadId: string
  lastMessage: { text: string; createdAt: Date | string }
  otherUserId: string
  otherUserName: string
  otherUsername: string | null
  kind: 'spouse' | 'member' | 'visitor'
  isSpouse: boolean
  guestEmail: string | null
  unreadCount: number
  updatedAt: Date | string
}

/** Everyone I have a conversation with (no member directory). Spouse first, then most recent. */
async function buildConversations(currentUserId: string, spouseId: string): Promise<Conversation[]> {
  const chatDb = await getChatDb()
  const myMessages = await chatDb.chatMessage.findMany({
    where: { OR: [{ senderId: currentUserId }, { recipientId: currentUserId }] },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  })

  const threads = new Map<string, Conversation>()
  for (const msg of myMessages) {
    const otherId = otherParticipant(msg.threadId, currentUserId)
    if (!otherId || otherId === currentUserId.toLowerCase()) continue
    let convo = threads.get(msg.threadId)
    if (!convo) {
      const isVisitor = otherId.startsWith('guest_')
      const member = isVisitor ? null : await lookupUser(otherId)
      convo = {
        threadId: msg.threadId,
        lastMessage: { text: msg.text, createdAt: msg.createdAt },
        otherUserId: otherId,
        otherUserName:
          member?.name ||
          (msg.senderId === otherId ? msg.senderName : msg.recipientName) ||
          DEMO_NAMES[otherId] ||
          'Member',
        otherUsername: member?.username || null,
        kind: otherId === spouseId ? 'spouse' : isVisitor ? 'visitor' : 'member',
        isSpouse: otherId === spouseId,
        guestEmail: null,
        unreadCount: 0,
        updatedAt: msg.createdAt,
      }
      threads.set(msg.threadId, convo)
    }
    if (convo.kind === 'visitor' && !convo.guestEmail) {
      const email = (msg.proposalData as Record<string, unknown> | null)?.guestEmail
      if (typeof email === 'string') convo.guestEmail = email
    }
    if (!msg.read && msg.recipientId === currentUserId) convo.unreadCount++
  }

  // Always show the spouse, even before the first message
  if (spouseId) {
    const spouseThreadId = buildThreadId(currentUserId, spouseId)
    if (!threads.has(spouseThreadId)) {
      const spouse = await lookupUser(spouseId)
      threads.set(spouseThreadId, {
        threadId: spouseThreadId,
        lastMessage: { text: 'Say hello to your spouse.', createdAt: new Date() },
        otherUserId: spouseId,
        otherUserName: spouse?.name || DEMO_NAMES[spouseId] || 'Your spouse',
        otherUsername: spouse?.username || null,
        kind: 'spouse',
        isSpouse: true,
        guestEmail: null,
        unreadCount: 0,
        updatedAt: new Date(),
      })
    }
  }

  return [...threads.values()].sort((a, b) =>
    a.isSpouse !== b.isSpouse ? (a.isSpouse ? -1 : 1) : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

// ---------------------------------------------------------------------------
// GET /api/chat
// Supports:
//   - ?users=true                 -> my contacts (people I have conversations with)
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

    const spouseId = await resolveSpouseId(currentUserId)

    // ── 1. MY CONTACTS (people I already talk to; not a member directory) ──
    if (listUsers) {
      const conversations = await buildConversations(currentUserId, spouseId)
      const contacts = conversations.map((c) => ({
        id: c.otherUserId,
        name: c.otherUserName,
        username: c.otherUsername || undefined,
        role: c.kind === 'spouse' ? 'Spouse' : c.kind === 'visitor' ? 'Visitor' : 'Member',
        bio: c.lastMessage.text.slice(0, 80),
        avatar: initials(c.otherUserName),
        unreadCount: c.unreadCount,
        guestEmail: c.guestEmail,
      }))
      return NextResponse.json({ success: true, users: contacts, currentUserId })
    }


    // ── 2. CONVERSATION LIST ──
    if (listConversations) {
      const conversations = await buildConversations(currentUserId, spouseId)
      return NextResponse.json({
        success: true,
        conversations,
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
              owedBySpouse: r.owedBySpouse,
              pendingMessageId: r.pending?.messageId || null,
              // Each deposit is reciprocated on its own
              pendingDeposits: r.pendingDeposits,
              spousePendingDeposits: r.spousePendingDeposits,
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
    const { recipientId, recipientName, threadId: threadIdParam, loveNoteTitle, voiceDuration } = body

    // Members can only post these; system cards (deposits, requests, spouse links…)
    // are created by the server, never by the browser
    const type: 'text' | 'love_note' | 'proposal' = ['text', 'love_note', 'proposal'].includes(body.type) ? body.type : 'text'
    const text = String(body.text || '').slice(0, 4000)
    const proposalAmount = Math.round(Number(body.proposalData?.amount) * 100) / 100
    const proposalData =
      type === 'proposal'
        ? {
            goalName: String(body.proposalData?.goalName || 'Our plan').slice(0, 120),
            amount: proposalAmount,
            split: `50/50 ($${(proposalAmount / 2).toFixed(2)} each)`,
            status: 'pending',
          }
        : undefined
    if (type === 'proposal' && !(proposalAmount >= 2)) {
      return NextResponse.json({ success: false, error: 'Enter an amount for the proposal.' }, { status: 400 })
    }

    if (!text.trim() && !proposalData && !loveNoteTitle) {
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
        text: text.trim() ? text.trim() : (proposalData ? `Proposed deposit for ${proposalData.goalName}` : (loveNoteTitle || 'Love note')),
        timestamp: formattedTime,
        createdAt: now,
        read: false,
        type,
        proposalData: proposalData ? { ...proposalData, proposedBy: sender.name } : undefined,
        loveNoteTitle: loveNoteTitle ? String(loveNoteTitle).slice(0, 80) : undefined,
        voiceDuration,
        reactions: {},
      },
    })

    // Visitors have no account: email them the reply (they gave their address with their message)
    if (effectiveRecipientId.startsWith('guest_')) {
      const guestEmail = await findGuestEmail(buildThreadId(sender.id, effectiveRecipientId))
      const emailed = guestEmail ? await emailVisitorReply(guestEmail, sender.name, text || '') : false
      return NextResponse.json({ success: true, message: newMsg, emailed })
    }

    // Email the recipient: always for a proposal; for messages only the first unread one
    // from this sender (so a conversation doesn't flood their inbox)
    const earlierUnread = await prisma.chatMessage.count({
      where: { threadId: newMsg.threadId, senderId: sender.id, recipientId: effectiveRecipientId, read: false, NOT: { id: newMsg.id } },
    })
    if (type === 'proposal' || earlierUnread === 0) {
      const plan = proposalData?.goalName ? String(proposalData.goalName) : ''
      await emailMember(effectiveRecipientId, {
        subject:
          type === 'proposal'
            ? `${sender.name} proposed a $${Number(proposalData?.amount || 0).toLocaleString()} plan${plan ? ` for "${plan}"` : ''}`
            : `New message from ${sender.name}`,
        heading: type === 'proposal' ? 'New savings proposal' : `${sender.name} sent you a message`,
        paragraphs: [newMsg.text.slice(0, 500)],
        ctaLabel: type === 'proposal' ? 'Review proposal' : 'Reply in chat',
        ctaPath: `/chat?recipientId=${encodeURIComponent(sender.id)}&name=${encodeURIComponent(sender.name)}`,
      })
    }

    // In-app notification for the recipient
    try {
      await prisma.notification.create({
        data: {
          userId: effectiveRecipientId,
          title: `New message from ${sender.name}`,
          message: text ? text.slice(0, 100) : 'You received a new message.',
          type: 'INFO',
          link: `/chat?recipientId=${encodeURIComponent(sender.id)}&name=${encodeURIComponent(sender.name)}`,
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
    const { messageId, action, reaction } = body

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

    if (action === 'approve_proposal' || action === 'decline_proposal') {
      const data = ((existing.proposalData as Record<string, unknown>) || {}) as Record<string, unknown>
      // Only the person it was sent to can answer, and only once
      if (existing.type !== 'proposal' || existing.senderId === currentUser.id) {
        return NextResponse.json({ success: false, error: 'Only the other person can answer this proposal.' }, { status: 403 })
      }
      if (data.status !== 'pending') {
        return NextResponse.json({ success: false, error: 'This proposal was already answered.' }, { status: 409 })
      }
      const approved = action === 'approve_proposal'
      const updated = await chatDb.chatMessage.update({
        where: { id: messageId },
        data: {
          proposalData: {
            ...data,
            status: approved ? 'approved' : 'rejected',
            ...(approved ? { approvedBy: currentUser.name } : { declinedBy: currentUser.name }),
          } as Prisma.InputJsonValue,
        },
      })
      const plan = String(data.goalName || 'the plan')
      const amount = Number(data.amount) || 0
      const share = Math.round((amount / 2) * 100) / 100
      await createChatMessage({
        data: {
          threadId: existing.threadId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          recipientId: existing.senderId,
          recipientName: existing.senderName,
          text: approved
            ? `${currentUser.name} approved the $${amount.toLocaleString()} plan for "${plan}". Each of you pays $${share.toLocaleString()}.`
            : `${currentUser.name} declined the $${amount.toLocaleString()} plan for "${plan}".`,
          timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
          type: 'text',
        },
      })
      await emailMember(existing.senderId, {
        subject: `${currentUser.name} ${approved ? 'approved' : 'declined'} your "${plan}" proposal`,
        heading: approved ? 'Proposal approved' : 'Proposal declined',
        paragraphs: approved
          ? [`${currentUser.name} approved your $${amount.toLocaleString()} plan for "${plan}".`, `Pay your $${share.toLocaleString()} share from your chat.`]
          : [`${currentUser.name} declined your $${amount.toLocaleString()} plan for "${plan}".`],
        ctaLabel: 'Open chat',
        ctaPath: '/chat',
      })
      return NextResponse.json({ success: true, message: updated })
    }

    if (action === 'react' && reaction) {
      // One reaction per person per emoji; tapping again removes it
      const raw = ((existing.reactions as Record<string, unknown>) || {}) as Record<string, unknown>
      const reactions: Record<string, string[]> = {}
      for (const [emoji, value] of Object.entries(raw)) {
        if (Array.isArray(value)) reactions[emoji] = value.map(String)
      }
      const users = new Set(reactions[reaction] || [])
      if (users.has(currentUser.id)) users.delete(currentUser.id)
      else users.add(currentUser.id)
      if (users.size) reactions[reaction] = [...users]
      else delete reactions[reaction]

      const updated = await chatDb.chatMessage.update({
        where: { id: messageId },
        data: { reactions },
      })
      return NextResponse.json({ success: true, message: updated })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
