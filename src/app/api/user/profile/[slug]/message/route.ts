import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { escapeHtml } from '@/lib/utils'
import { sendEmail } from '@/lib/email'
import { buildThreadId, createChatMessage } from '@/lib/chat'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    const { slug } = await params
    const body = await req.json()
    const { senderName, senderEmail, senderPhone, message, channel = 'CHAT' } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Message cannot be empty.' }, { status: 400 })
    }

    const cleanSlug = slug.toLowerCase().trim()

    // Find the member by username; never fall back to someone else
    const targetUser = await prisma.user.findUnique({ where: { username: cleanSlug } })
    if (!targetUser || !targetUser.publicChatEnabled) {
      return NextResponse.json({ success: false, error: 'Member not found.' }, { status: 404 })
    }
    const targetUserId = targetUser.id
    const targetName = targetUser.name
    const targetEmail = targetUser.email

    // Determine sender identity
    const effectiveSenderId = session?.user?.id || (senderEmail ? `guest_${senderEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : `guest_${Date.now().toString(36)}`)
    const cleanSenderName = session?.user?.name || senderName?.trim() || 'Visitor'
    const cleanSenderContact = senderEmail?.trim() || senderPhone?.trim() || 'Direct Profile Reach'

    const threadId = buildThreadId(effectiveSenderId, targetUserId)

    const now = new Date()
    const formattedTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(now)

    // 1. Record directly into real 1-on-1 chat thread
    const chatMsg = await createChatMessage({
      data: {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        threadId,
        senderId: effectiveSenderId,
        senderName: cleanSenderName,
        recipientId: targetUserId,
        recipientName: targetName,
        text: message.trim(),
        timestamp: formattedTime,
        createdAt: now,
        read: false,
        type: 'text',
      },
    })

    // 2. Create in-app Notification for the recipient
    try {
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: `New message from ${cleanSenderName}`,
          message: `${cleanSenderName} (${cleanSenderContact}): "${message.slice(0, 90)}${message.length > 90 ? '...' : ''}"`,
          type: 'INFO',
          link: `/chat?recipientId=${effectiveSenderId}`,
        },
      })
    } catch (notifErr) {
      console.warn('Non-blocking notification warning:', notifErr)
    }

    // 3. Email alert to target user
    try {
      await sendEmail({
        to: targetEmail,
        subject: `[Union Verify] New Message from ${cleanSenderName}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="font-size: 20px; font-weight: bold; color: #0F1C3F;">Union <span style="color: #C9A84C;">Verify</span></span>
              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-top: 4px;">Direct Member Chat</p>
            </div>
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 13px;"><strong>From:</strong> ${escapeHtml(cleanSenderName)}</p>
              <p style="margin: 4px 0 0; font-size: 13px;"><strong>Contact:</strong> ${escapeHtml(cleanSenderContact)}</p>
            </div>
            <div style="background-color: #f1f5f9; border-left: 4px solid #C9A84C; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 0; font-style: italic; color: #0f172a; font-size: 14px;">"${escapeHtml(message)}"</p>
            </div>
            <div style="text-align: center;">
              <a href="https://unionverify.com/chat?recipientId=${effectiveSenderId}" style="display: inline-block; background-color: #0F1C3F; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; padding: 12px 24px; border-radius: 10px;">
                Open in Chat →
              </a>
            </div>
          </div>
        `,
      })
    } catch (mailErr) {
      console.warn('Non-blocking email alert warning:', mailErr)
    }

    return NextResponse.json({
      success: true,
      message: `Message sent to ${targetName}.`,
      chatUrl: `/chat?recipientId=${targetUserId}`,
      chatMsg,
    })
  } catch (error: any) {
    console.error('[POST /api/user/profile/[slug]/message]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
