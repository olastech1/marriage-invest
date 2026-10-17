import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// ---------------------------------------------------------------------------
// GET /api/chat?thread=spouse|advisor
// Returns all synchronized chat messages and partner status
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(req.url)
    const thread = searchParams.get('thread') || 'spouse'

    const messages = await (prisma as any).chatMessage.findMany({
      where: { threadId: thread },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      success: true,
      thread,
      messages: messages || [],
      currentUser: {
        id: session?.user?.id || 'usr_jane_doe',
        name: session?.user?.name || 'Jane Doe',
      },
      partners: {
        partner1: { id: 'usr_jane_doe', name: 'Jane Doe', status: 'Online' },
        partner2: { id: 'usr_marcus_vance', name: 'Marcus Vance', status: 'Online' },
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/chat
// Send message from one partner to the other or to the advisor
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const session = await auth()
    const body = await req.json()
    const {
      threadId = 'spouse',
      text,
      type = 'text',
      senderId,
      senderName,
      proposalData,
      loveNoteTitle,
      voiceDuration,
    } = body

    if (!text && !proposalData && !loveNoteTitle) {
      return NextResponse.json({ success: false, error: 'Message content cannot be empty' }, { status: 400 })
    }

    const effectiveSenderId = senderId || session?.user?.id || 'usr_jane_doe'
    const effectiveSenderName = senderName || session?.user?.name || 'Jane Doe'
    const recipientId = effectiveSenderId === 'usr_marcus_vance' ? 'usr_jane_doe' : 'usr_marcus_vance'

    const now = new Date()
    const formattedTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(now)

    const newMsg = await (prisma as any).chatMessage.create({
      data: {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        threadId,
        senderId: effectiveSenderId,
        senderName: effectiveSenderName,
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

    // Create notification for the spousal recipient in the notification database
    try {
      await prisma.notification.create({
        data: {
          userId: recipientId,
          title: `New Message from ${effectiveSenderName}`,
          message: text ? text.slice(0, 100) : 'You received a new mutual matrimonial chat item.',
          type: type === 'proposal' ? 'ALERT' : 'INFO',
          link: '/chat',
        },
      })
    } catch {
      // Non-blocking notification
    }

    return NextResponse.json({ success: true, message: newMsg })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/chat
// Interactive partner actions: approve proposal, add spousal emoji reaction
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

    // ACTION: APPROVE PROPOSAL
    if (action === 'approve_proposal') {
      const approver = approvedBy || session?.user?.name || partnerName || 'Marcus Vance'

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

      // Add spousal confirmation message to thread
      const halfAmount = existing.proposalData?.amount ? (Number(existing.proposalData.amount) / 2).toFixed(2) : '125.00'
      const goalName = existing.proposalData?.goalName || 'Joint Savings Vault'

      const confirmMsg = await (prisma as any).chatMessage.create({
        data: {
          id: `msg-${Date.now()}-confirmed`,
          threadId: existing.threadId || 'spouse',
          senderId: 'usr_marcus_vance',
          senderName: approver,
          text: `Awesome! Both $${halfAmount} shares have been deposited into our ${goalName} vault! 🎉 High-five!`,
          timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
          createdAt: new Date(),
          read: true,
          type: 'text',
          reactions: { '🎉': 2, '❤️': 1 },
        },
      })

      // Log transaction in the ledger
      try {
        await prisma.transaction.create({
          data: {
            userId: session?.user?.id || 'usr_jane_doe',
            type: 'DEPOSIT',
            amount: existing.proposalData?.amount || 250,
            fee: 0,
            netAmount: existing.proposalData?.amount || 250,
            status: 'COMPLETED',
            reference: `PROP-DEP-${Date.now().toString(36).toUpperCase()}`,
            description: `Mutual Approved Deposit: ${goalName} ($${halfAmount} x 2)`,
          },
        })
      } catch {
        // Non-blocking
      }

      return NextResponse.json({
        success: true,
        message: updated,
        confirmationMessage: confirmMsg,
      })
    }

    // ACTION: TOGGLE / INCREMENT EMOJI REACTION
    if (action === 'react' && reaction) {
      const currentReactions = { ...(existing.reactions || {}) }
      currentReactions[reaction] = (currentReactions[reaction] || 0) + 1

      const updated = await (prisma as any).chatMessage.update({
        where: { id: messageId },
        data: {
          reactions: currentReactions,
        },
      })

      return NextResponse.json({ success: true, message: updated })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
