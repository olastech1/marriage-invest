import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// ---------------------------------------------------------------------------
// Helper: Build a deterministic thread ID for two users (alphabetical sort)
// ---------------------------------------------------------------------------
export function buildThreadId(userA: string, userB: string): string {
  const cleanA = String(userA || 'user1').trim().toLowerCase()
  const cleanB = String(userB || 'user2').trim().toLowerCase()
  return `dm_${[cleanA, cleanB].sort().join('_')}`
}

// ---------------------------------------------------------------------------
// GET /api/chat
// Supports:
//   - ?users=true            -> returns directory of all platform members to chat with
//   - ?list=true             -> returns all active conversation threads for current user
//   - ?thread=<id>&senderId= -> returns messages for a specific thread
//   - ?recipientId=<id>      -> returns or initializes thread between current user and recipient
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(req.url)
    const threadParam = searchParams.get('thread')
    const recipientIdParam = searchParams.get('recipientId')
    const listConversations = searchParams.get('list') === 'true'
    const listUsers = searchParams.get('users') === 'true'

    const currentUserId = searchParams.get('senderId') || session?.user?.id || 'usr_jane_doe'

    // ── 1. RETURN USER DIRECTORY (all contacts you can message) ──
    if (listUsers) {
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
        },
      })

      const contacts = allUsers.map((u: any) => ({
        id: u.id,
        name: u.name,
        username: u.username || u.name?.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        email: u.email,
        role: u.role,
        bio: u.bio || `${u.role === 'ADMIN' ? 'Platform Administrator' : 'Verified Member'}`,
        avatar: (u.name || 'UV').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
        online: true,
      }))

      return NextResponse.json({
        success: true,
        users: contacts,
        currentUserId,
      })
    }

    // ── 2. LIST ALL CONVERSATIONS for current user ──
    if (listConversations) {
      const allMessages = await (prisma as any).chatMessage.findMany({
        orderBy: { createdAt: 'desc' },
      })

      // Always include key contacts (Marcus, Jane, Admin) even if 0 messages yet
      const allUsers = await prisma.user.findMany()
      const threadMap = new Map<string, any>()

      for (const msg of allMessages) {
        let tid = msg.threadId || ''
        if (tid === 'spouse') {
          tid = buildThreadId('usr_jane_doe', 'usr_marcus_vance')
        }
        // Check if thread belongs to current user
        if (tid.startsWith('dm_')) {
          if (!tid.includes(currentUserId.toLowerCase())) continue
        }

        if (!threadMap.has(tid)) {
          // Identify the other participant
          let otherId = ''
          if (tid.startsWith('dm_')) {
            const rawParts = tid.replace('dm_', '').split('_')
            otherId = rawParts.find((p: string) => p.toLowerCase() !== currentUserId.toLowerCase()) || ''
          } else if (tid === 'advisor') {
            otherId = 'usr_admin'
          }

          const matchedUser = allUsers.find((u: any) => u.id === otherId || u.username === otherId)
          const fallbackName = otherId === 'usr_marcus_vance' ? 'Marcus Vance' : (otherId === 'usr_jane_doe' ? 'Jane Doe' : (otherId === 'usr_admin' ? 'Support & Advisor' : otherId))

          threadMap.set(tid, {
            threadId: tid,
            lastMessage: msg,
            otherUserId: otherId,
            otherUserName: matchedUser?.name || msg.recipientName || (msg.senderId !== currentUserId ? msg.senderName : fallbackName),
            unreadCount: 0,
            updatedAt: msg.createdAt,
          })
        }

        // Count unread messages
        if (!msg.read && msg.senderId !== currentUserId) {
          const entry = threadMap.get(tid)!
          if (entry) entry.unreadCount++
        }
      }

      // If spouse thread doesn't exist yet, seed default entry
      const spouseOtherId = currentUserId === 'usr_marcus_vance' ? 'usr_jane_doe' : 'usr_marcus_vance'
      const spouseThreadId = buildThreadId(currentUserId, spouseOtherId)
      if (!threadMap.has(spouseThreadId) && !threadMap.has('spouse')) {
        const spouseUser = allUsers.find((u: any) => u.id === spouseOtherId)
        threadMap.set(spouseThreadId, {
          threadId: spouseThreadId,
          lastMessage: {
            text: 'Mutual matrimonial vault and joint messaging active.',
            createdAt: new Date(),
          },
          otherUserId: spouseOtherId,
          otherUserName: spouseUser?.name || (spouseOtherId === 'usr_marcus_vance' ? 'Marcus Vance' : 'Jane Doe'),
          unreadCount: 0,
          updatedAt: new Date(),
        })
      }

      return NextResponse.json({
        success: true,
        conversations: Array.from(threadMap.values()),
        currentUserId,
      })
    }

    // ── 3. RESOLVE ACTIVE THREAD ID & MESSAGES ──
    let threadId = threadParam || ''
    let recipientId = recipientIdParam || ''

    if (!threadId && recipientId) {
      threadId = buildThreadId(currentUserId, recipientId)
    } else if (!threadId) {
      recipientId = currentUserId === 'usr_marcus_vance' ? 'usr_jane_doe' : 'usr_marcus_vance'
      threadId = buildThreadId(currentUserId, recipientId)
    }

    // Legacy "spouse" alias
    if (threadId === 'spouse') {
      threadId = buildThreadId('usr_jane_doe', 'usr_marcus_vance')
    }

    // If recipientId not explicitly passed, deduce it from threadId
    if (!recipientId && threadId.startsWith('dm_')) {
      const parts = threadId.replace('dm_', '').split('_')
      recipientId = parts.find((p: string) => p.toLowerCase() !== currentUserId.toLowerCase()) || ''
    }

    const isSpousalThread = threadId === buildThreadId('usr_jane_doe', 'usr_marcus_vance') || threadParam === 'spouse'

    let messages = await (prisma as any).chatMessage.findMany({
      where: {
        OR: [
          { threadId },
          // Backwards compatibility for legacy 'spouse' thread
          ...(isSpousalThread ? [{ threadId: 'spouse' }, { threadId: buildThreadId('usr_jane_doe', 'usr_marcus_vance') }] : []),
        ],
      },
      orderBy: { createdAt: 'asc' },
    })

    // Seed default messages if spousal thread is completely empty
    if (messages.length === 0 && isSpousalThread) {
      const seed1 = await (prisma as any).chatMessage.create({
        data: {
          id: 'msg-seed-1',
          threadId: buildThreadId('usr_jane_doe', 'usr_marcus_vance'),
          senderId: 'usr_marcus_vance',
          senderName: 'Marcus Vance',
          recipientId: 'usr_jane_doe',
          recipientName: 'Jane Doe',
          text: 'Hey love! I reviewed our joint matrimonial vault. Looking great with the 6.8% compounding interest! ❤️',
          timestamp: '10:15 AM',
          createdAt: new Date(Date.now() - 3600000 * 2),
          read: true,
          type: 'text',
          reactions: { '❤️': 1 },
        },
      })
      const seed2 = await (prisma as any).chatMessage.create({
        data: {
          id: 'msg-seed-2',
          threadId: buildThreadId('usr_jane_doe', 'usr_marcus_vance'),
          senderId: 'usr_jane_doe',
          senderName: 'Jane Doe',
          recipientId: 'usr_marcus_vance',
          recipientName: 'Marcus Vance',
          text: "So proud of our progress together! Let's keep building our generational wealth.",
          timestamp: '10:18 AM',
          createdAt: new Date(Date.now() - 3600000),
          read: true,
          type: 'text',
          reactions: { '🚀': 1 },
        },
      })
      messages = [seed1, seed2]
    }

    // Look up recipient user info
    let recipientUser = null
    if (recipientId) {
      recipientUser = await prisma.user.findUnique({
        where: { id: recipientId },
      })
      if (!recipientUser) {
        recipientUser = await (prisma.user as any).findFirst({
          where: { username: recipientId.toLowerCase() },
        })
      }
    }

    // Default recipient fallback if missing
    if (!recipientUser && recipientId) {
      recipientUser = {
        id: recipientId,
        name: recipientId === 'usr_marcus_vance' ? 'Marcus Vance' : (recipientId === 'usr_jane_doe' ? 'Jane Doe' : recipientId),
        email: `${recipientId}@unionverify.com`,
      } as any
    }

    return NextResponse.json({
      success: true,
      threadId,
      messages: messages || [],
      currentUser: {
        id: currentUserId,
        name: session?.user?.name || (currentUserId === 'usr_marcus_vance' ? 'Marcus Vance' : 'Jane Doe'),
      },
      recipient: recipientUser ? {
        id: recipientUser.id,
        name: recipientUser.name,
        email: recipientUser.email,
        avatar: (recipientUser.name || 'UV').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
      } : null,
    })
  } catch (err: any) {
    console.error('[GET /api/chat]', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/chat
// Send a message to ANY user or thread
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const session = await auth()
    const body = await req.json()
    const {
      text,
      type = 'text',
      senderId,
      senderName,
      recipientId,
      recipientName,
      threadId: threadIdOverride,
      proposalData,
      loveNoteTitle,
      voiceDuration,
    } = body

    if (!text && !proposalData && !loveNoteTitle && type !== 'system_reminder') {
      return NextResponse.json({ success: false, error: 'Message content cannot be empty' }, { status: 400 })
    }

    const effectiveSenderId = senderId || session?.user?.id || 'usr_jane_doe'
    const effectiveSenderName = senderName || session?.user?.name || (effectiveSenderId === 'usr_marcus_vance' ? 'Marcus Vance' : 'Jane Doe')

    // Determine target recipient
    let effectiveRecipientId = recipientId || ''
    let threadId = threadIdOverride || ''

    if (threadId === 'spouse') {
      threadId = buildThreadId('usr_jane_doe', 'usr_marcus_vance')
      if (!effectiveRecipientId) {
        effectiveRecipientId = effectiveSenderId === 'usr_marcus_vance' ? 'usr_jane_doe' : 'usr_marcus_vance'
      }
    }

    if (!effectiveRecipientId && threadId.startsWith('dm_')) {
      const parts = threadId.replace('dm_', '').split('_')
      effectiveRecipientId = parts.find((p: string) => p.toLowerCase() !== effectiveSenderId.toLowerCase()) || ''
    }

    if (!effectiveRecipientId) {
      effectiveRecipientId = effectiveSenderId === 'usr_marcus_vance' ? 'usr_jane_doe' : 'usr_marcus_vance'
    }

    if (!threadId || threadId === 'spouse') {
      threadId = buildThreadId(effectiveSenderId, effectiveRecipientId)
    }

    // Determine recipient name
    let effectiveRecipientName = recipientName || ''
    if (!effectiveRecipientName) {
      const recUser = await prisma.user.findUnique({ where: { id: effectiveRecipientId } })
      effectiveRecipientName = recUser?.name || (effectiveRecipientId === 'usr_marcus_vance' ? 'Marcus Vance' : (effectiveRecipientId === 'usr_jane_doe' ? 'Jane Doe' : 'Member'))
    }

    const now = new Date()
    const formattedTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(now)

    // Save message into persistent ledger (zero AI bots or canned responses)
    const newMsg = await (prisma as any).chatMessage.create({
      data: {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        threadId,
        senderId: effectiveSenderId,
        senderName: effectiveSenderName,
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

    // Create an in-app notification for the recipient
    if (effectiveRecipientId && effectiveRecipientId !== effectiveSenderId) {
      try {
        await prisma.notification.create({
          data: {
            userId: effectiveRecipientId,
            title: `New Message from ${effectiveSenderName}`,
            message: text ? text.slice(0, 100) : 'You received a new message.',
            type: 'INFO',
            link: `/chat?recipientId=${effectiveSenderId}`,
          },
        })
      } catch {
        // Non-blocking notification
      }
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
    const session = await auth()
    const body = await req.json()
    const { messageId, action, reaction, approvedBy, partnerName } = body

    if (!messageId) {
      return NextResponse.json({ success: false, error: 'messageId is required' }, { status: 400 })
    }

    const existing = await (prisma as any).chatMessage.findUnique({
      where: { id: messageId },
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 })
    }

    // Approve proposal
    if (action === 'approve_proposal') {
      const approver = approvedBy || session?.user?.name || partnerName || 'User'

      const updated = await (prisma as any).chatMessage.update({
        where: { id: messageId },
        data: {
          proposalData: {
            ...existing.proposalData,
            status: 'approved',
            approvedBy: approver,
          },
        },
      })

      return NextResponse.json({ success: true, message: updated })
    }

    // Toggle emoji reaction
    if (action === 'react' && reaction) {
      const currentReactions = { ...(existing.reactions || {}) }
      currentReactions[reaction] = (currentReactions[reaction] || 0) + 1

      const updated = await (prisma as any).chatMessage.update({
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
