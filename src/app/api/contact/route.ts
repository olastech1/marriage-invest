import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// GET /api/contact
// Returns live advisor conversation history for the contact desk
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const messages = await (prisma as any).chatMessage.findMany({
      where: { threadId: 'advisor' },
      orderBy: { createdAt: 'asc' },
    })

    if (!messages || messages.length === 0) {
      // Seed default welcoming conversation starter message
      const defaultWelcome = {
        id: 'adv-seed-1',
        threadId: 'advisor',
        senderId: 'advisor_support',
        senderName: 'Union Verify Support',
        text: 'Welcome to Union Verify! How can we help you today? Choose one of our quick conversation starters below, or send us a message directly.',
        timestamp: 'Active Now',
        createdAt: new Date(),
        read: true,
        type: 'text',
        proposalData: {
          suggestions: [
            { id: 'start_marriage', label: '💍 Get Married Online ($500)', prompt: 'We want to legally marry online and set up our joint savings vault.' },
            { id: 'spousal_vault', label: '💰 How Joint Savings Work (6.8% APY)', prompt: 'How does the 50/50 spousal deposit matching rule and 6.8% APY work?' },
            { id: 'wedding_registry', label: '🎁 Send Wedding Cash Gift', prompt: 'I want to contribute a wedding gift to a couple\'s cash registry fund.' },
            { id: 'verify_certificate', label: '📜 Verify Marriage Certificate', prompt: 'I have a certificate docket number and want to verify its authenticity.' },
            { id: 'member_bio', label: '👤 Connect with Member', prompt: 'I want to connect with a verified member through their public bio profile.' },
          ],
        },
      }
      return NextResponse.json({ success: true, messages: [defaultWelcome] })
    }

    return NextResponse.json({ success: true, messages })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
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

    const userText = (message || subject || '').trim()
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
    const userMsg = await (prisma as any).chatMessage.create({
      data: {
        id: `msg-contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        threadId: 'advisor',
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

    // 2. Generate an intelligent, high-value advisor response tailored to the inquiry
    const lowerText = userText.toLowerCase()
    let responseText = ''
    let recommendedAction: { label: string; href: string; icon: string } | null = null

    if (starterId === 'start_marriage' || lowerText.includes('marry') || lowerText.includes('marriage registration')) {
      responseText = `Great choice! Getting married through Union Verify is fully digital and straightforward. Both partners complete an online application together, co-sign digitally, and for a one-time $500 registration fee you receive an official certified certificate and immediate access to a 6.8% APY joint savings vault.`
      recommendedAction = {
        label: 'Start Online Marriage Registration ($500)',
        href: '/get-married',
        icon: '💍',
      }
    } else if (starterId === 'spousal_vault' || lowerText.includes('vault') || lowerText.includes('compounding') || lowerText.includes('apy') || lowerText.includes('reciproc')) {
      responseText = `Our Joint Spousal Vault grows daily at 6.8% APY. Under our Spousal Covenant (Rule 4.2), whenever one spouse deposits into the vault, it encourages the partner to reciprocate with an equal match within 7 days. This builds marital trust and doubles your shared wealth compounding!`
      recommendedAction = {
        label: 'Explore Joint Savings & Compounding Vault',
        href: '/savings',
        icon: '💰',
      }
    } else if (starterId === 'wedding_registry' || lowerText.includes('gift') || lowerText.includes('registry')) {
      responseText = `Union Verify features a 100% cash wedding registry with 0% platform fees. Loved ones and wedding guests can gift money directly into a couple's designated milestone fund (e.g., Honeymoon, First Home Down Payment, or Adoption Nest Egg).`
      recommendedAction = {
        label: 'Find a Wedding Registry & Send Gift',
        href: '/registry',
        icon: '🎁',
      }
    } else if (starterId === 'verify_certificate' || lowerText.includes('certificate') || lowerText.includes('verify')) {
      responseText = `Every marriage on Union Verify receives an encrypted covenant reference number (e.g. UV-2026-XXXXX). Certificates are officially recorded and can be viewed, shared, and verified globally anytime.`
      recommendedAction = {
        label: 'Open Certificate Portal',
        href: '/certificate',
        icon: '📜',
      }
    } else if (starterId === 'member_bio' || lowerText.includes('profile') || lowerText.includes('member')) {
      responseText = `You can connect directly with verified members through their public bio profile, featuring verified covenant seals, interactive direct chat, and social contact links.`
      recommendedAction = {
        label: 'Browse Member Community',
        href: '/community',
        icon: '👤',
      }
    } else {
      responseText = `Thank you for reaching out to Union Verify Support, ${senderName}! We have logged your inquiry into our active queue. Our support team reviews all messages continuously.`
      recommendedAction = {
        label: 'Explore Investment Opportunities',
        href: '/investments',
        icon: '📈',
      }
    }

    const advisorMsg = await (prisma as any).chatMessage.create({
      data: {
        id: `msg-advisor-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        threadId: 'advisor',
        senderId: 'advisor_support',
        senderName: 'Union Verify Support',
        text: responseText,
        timestamp: formattedTime,
        createdAt: new Date(now.getTime() + 400),
        read: true,
        type: 'advisor_response',
        proposalData: {
          action: recommendedAction,
        },
      },
    })

    // 3. Create notification for admin desk
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

    // 4. Send email alert to admin if contact email provided
    if (senderEmail) {
      const adminEmail = process.env.ADMIN_EMAIL || 'compliance@unionverify.com'
      await sendEmail({
        to: adminEmail,
        subject: `[Union Verify Desk] Inquiry from ${senderName}: ${userText.slice(0, 50)}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px;">
            <h2 style="color: #0F1C3F; border-bottom: 2px solid #C9A84C; padding-bottom: 8px;">New Contact Desk Conversation</h2>
            <p><strong>Sender:</strong> ${senderName}</p>
            <p><strong>Email:</strong> ${senderEmail}</p>
            <p><strong>Phone:</strong> ${senderPhone || 'Not provided'}</p>
            <p><strong>Department:</strong> ${department}</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #C9A84C; padding: 12px 16px; margin: 16px 0;">
              <p style="margin: 0; font-size: 14px; color: #334155;">${userText}</p>
            </div>
            <p style="font-size: 12px; color: #94a3b8;">This conversation is connected to the Union Verify Live Chat System.</p>
          </div>
        `,
      }).catch((err) => {
        console.warn('[Contact Desk] Email warning:', err)
      })
    }

    return NextResponse.json({
      success: true,
      userMessage: userMsg,
      advisorMessage: advisorMsg,
      action: recommendedAction,
    })
  } catch (error: any) {
    console.error('[POST /api/contact]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
