import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await req.json()
    const { senderName, senderEmail, senderPhone, message, channel = 'CHAT' } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Message cannot be empty.' }, { status: 400 })
    }

    const cleanSenderName = senderName?.trim() || 'Social Profile Visitor'
    const cleanSenderContact = senderEmail?.trim() || senderPhone?.trim() || 'Via Social Bio Link'

    // Determine target recipient (Jane or Marcus based on slug)
    const isMarcus = slug.toLowerCase().includes('marcus')
    const targetUserId = isMarcus ? 'usr_marcus_vance' : 'usr_jane_doe'
    const targetName = isMarcus ? 'Marcus Vance' : 'Jane Doe'
    const targetEmail = isMarcus ? 'marcus.vance@unionverify.com' : 'jane.doe@unionverify.com'

    const now = new Date()
    const formattedTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(now)

    // 1. Record in chat thread
    const chatMsg = await (prisma as any).chatMessage.create({
      data: {
        id: `msg-ext-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        threadId: 'social_inquiries',
        senderId: 'guest_social',
        senderName: `${cleanSenderName} (${cleanSenderContact})`,
        text: message.trim(),
        timestamp: formattedTime,
        createdAt: now,
        read: false,
        type: 'social_inquiry',
        proposalData: {
          senderName: cleanSenderName,
          senderContact: cleanSenderContact,
          channel,
          slug,
        },
      },
    })

    // 2. Create in-app Notification for the couple
    try {
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: `💬 New Message via Social Profile from ${cleanSenderName}`,
          message: `${cleanSenderName} (${cleanSenderContact}) sent you a message: "${message.slice(0, 90)}${message.length > 90 ? '...' : ''}"`,
          type: 'INFO',
          link: '/chat',
        },
      })
    } catch (notifErr) {
      console.warn('Non-blocking notification warning:', notifErr)
    }

    // 3. Email alert to target user
    try {
      await sendEmail({
        to: targetEmail,
        subject: `[Union Verify] New Message from your Social Bio Link (${cleanSenderName})`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="font-size: 20px; font-weight: bold; color: #0F1C3F;">Union <span style="color: #C9A84C;">Verify</span></span>
              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-top: 4px;">Public Profile & Bio Chat Dispatch</p>
            </div>
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 13px;"><strong>Sender Name:</strong> ${cleanSenderName}</p>
              <p style="margin: 4px 0 0; font-size: 13px;"><strong>Contact:</strong> ${cleanSenderContact}</p>
              <p style="margin: 4px 0 0; font-size: 13px;"><strong>Profile Bio Slug:</strong> /u/${slug}</p>
            </div>
            <div style="background-color: #f1f5f9; border-left: 4px solid #C9A84C; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 0; font-style: italic; color: #0f172a; font-size: 14px;">"${message}"</p>
            </div>
            <div style="text-align: center;">
              <a href="https://unionverify.com/chat" style="display: inline-block; background-color: #0F1C3F; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; padding: 12px 24px; rounded-xl: 10px; border-radius: 10px;">
                Reply in Union Verify Chat →
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
      message: `Message sent directly to ${targetName}!`,
      chatMsg,
    })
  } catch (error: any) {
    console.error('[POST /api/user/profile/[slug]/message]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
