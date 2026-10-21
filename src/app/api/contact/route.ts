import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { escapeHtml } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// GET /api/contact
// Contact inquiries are private, so there is no shared history to return
// ---------------------------------------------------------------------------
export async function GET() {
  // Inquiries are private: visitors never see other visitors' messages
  return NextResponse.json({ success: true, messages: [] })
}

// ---------------------------------------------------------------------------
// POST /api/contact
// Submits an inquiry or chat message, connecting directly to the chat system
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name,
      email,
      phone,
      department = 'GENERAL',
      subject,
      message,
      starterId,
      actionGoal,
    } = body

    const userText = (message || subject || '').trim().slice(0, 5000)
    if (!userText) {
      return NextResponse.json({ error: 'Message content is required.' }, { status: 400 })
    }

    const senderName = name?.trim() || 'Visitor'
    const senderEmail = email?.trim() || ''
    const senderPhone = phone?.trim() || ''
    const senderContact = senderEmail || senderPhone ? `${senderEmail} ${senderPhone}`.trim() : 'Live Web Visitor'

    const now = new Date()
    const formattedTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(now)

    // 1. Create the visitor message in the chat system under thread 'advisor'
    const userMsg = await prisma.chatMessage.create({
      data: {
        id: `msg-contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        // Each inquiry gets its own private thread
        threadId: `contact_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        senderId: 'guest_contact',
        senderName: `${senderName}${senderEmail ? ` (${senderEmail})` : ''}`,
        text: userText,
        timestamp: formattedTime,
        createdAt: now,
        read: false,
        type: 'contact_inquiry',
        proposalData: {
          department,
          subject: subject || 'Live Contact Desk Conversation',
          phone: senderPhone,
          email: senderEmail,
          starterId,
          actionGoal,
        },
      },
    })

    // 2. Create notification for admin desk
    try {
      await prisma.notification.create({
        data: {
          userId: 'usr_admin',
          title: `New Contact Inquiry from ${senderName}`,
          message: userText.slice(0, 120),
          type: 'INFO',
          link: '/chat',
        },
      })
    } catch {
      // Non-blocking
    }

    // 3. Send email alert to admin if contact email provided
    if (senderEmail) {
      const adminEmail = process.env.ADMIN_EMAIL || 'compliance@unionverify.com'
      await sendEmail({
        to: adminEmail,
        subject: `[Union Verify Desk] Inquiry from ${senderName}: ${userText.slice(0, 50)}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px;">
            <h2 style="color: #0F1C3F; border-bottom: 2px solid #C9A84C; padding-bottom: 8px;">New Contact Desk Conversation</h2>
            <p><strong>Sender:</strong> ${escapeHtml(senderName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(senderEmail)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(senderPhone || 'Not provided')}</p>
            <p><strong>Department:</strong> ${escapeHtml(String(department))}</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #C9A84C; padding: 12px 16px; margin: 16px 0;">
              <p style="margin: 0; font-size: 14px; color: #334155;">${escapeHtml(userText)}</p>
            </div>
          </div>
        `,
      }).catch((err) => {
        console.warn('[Contact Desk] Email warning:', err)
      })
    }

    return NextResponse.json({
      success: true,
      userMessage: userMsg,
    })
  } catch (error: any) {
    console.error('[POST /api/contact]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
