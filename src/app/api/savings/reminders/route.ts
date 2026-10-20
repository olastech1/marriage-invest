import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendDepositReminderEmail } from '@/lib/email'
import { createChatMessage } from '@/lib/chat'

export const dynamic = 'force-dynamic'

const DEFAULT_SPOUSE_EMAIL = ''
const DEFAULT_SPOUSE_NAME = 'Your Partner'

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id || 'usr_jane_doe'

    const reminders = await (prisma as any).depositReminder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      reminders: reminders || [],
      partner: {
        name: DEFAULT_SPOUSE_NAME,
        email: DEFAULT_SPOUSE_EMAIL,
        phone: '',
      },
    })
  } catch (error: any) {
    console.error('[GET /api/savings/reminders]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id || 'usr_jane_doe'
    const userName = session?.user?.name || 'Investor'
    const body = await req.json()

    const {
      action = 'send_now',
      amount = 500,
      targetPartnerName = DEFAULT_SPOUSE_NAME,
      targetEmail = DEFAULT_SPOUSE_EMAIL,
      vaultName = 'Mutual Spousal Contribution Vault',
      note = 'Remember our monthly deposit to accelerate our joint compounding vault! ❤️',
      frequency = 'MONTHLY',
      dayOfWeek,
      dayOfMonth = 1,
      time = '09:00 AM',
      channels = ['EMAIL', 'IN_APP', 'CHAT_SYSTEM'],
    } = body

    // 1. INSTANT DEPOSIT NUDGE (TRIGGER NOW)
    if (action === 'send_now') {
      const numAmount = Number(amount) || 500
      const customNote = note || `Hi ${targetPartnerName}, please make your deposit of $${numAmount.toLocaleString()} to our joint vault.`

      // A. Send Branded Email
      let emailSent = false
      try {
        emailSent = await sendDepositReminderEmail({
          to: targetEmail,
          recipientName: targetPartnerName,
          senderName: userName,
          amount: numAmount,
          vaultName,
          note: customNote,
          frequency,
        })
      } catch (e) {
        console.warn('Failed to send email:', e)
      }

      // B. Create In-App Notification (persistent until attended)
      try {
        await prisma.notification.create({
          data: {
            userId: userId || 'usr_jane_doe',
            title: `⏰ Deposit Reminder from ${userName}`,
            message: `${userName} scheduled a reminder to deposit $${numAmount.toLocaleString()} into your joint ${vaultName}. Keep your covenant strong!`,
            type: 'ALERT',
            link: `/chat?thread=spouse&action=match&amount=${numAmount}`,
            category: 'PARTNER_CHANGE',
            requiresAction: true,
            attended: false,
            amount: numAmount,
            partnerName: userName,
            actionLabel: `View in Chat & Deposit ($${numAmount.toLocaleString()})`,
          } as any,
        })
      } catch (e) {
        console.warn('Failed to create in-app notification:', e)
      }

      // C. Inject System Reminder into Couple Chat
      const now = new Date()
      const formattedTime = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(now)

      try {
        await createChatMessage({
          data: {
            id: `sys-remind-${Date.now()}`,
            threadId: 'spouse',
            senderId: 'system_concierge',
            senderName: 'Union Verify Concierge',
            text: `🔔 SYSTEM DEPOSIT REMINDER: ${userName} has sent an official deposit reminder to ${targetPartnerName} for $${numAmount.toLocaleString()} into the ${vaultName}.`,
            timestamp: formattedTime,
            createdAt: now,
            read: false,
            type: 'system_reminder',
            proposalData: {
              goalName: vaultName,
              amount: numAmount,
              split: '50/50',
              status: 'pending',
              proposedBy: userName,
            },
          },
          spouseOf: userId,
        })
      } catch (e) {
        console.warn('Failed to create chat system reminder:', e)
      }

      // D. Audit Log
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'DEPOSIT_REMINDER_SENT',
          entity: 'DepositReminder',
          after: {
            senderName: userName,
            targetPartnerName,
            targetEmail,
            amount: numAmount,
            vaultName,
            channels,
            emailSent,
            sentAt: now.toISOString(),
          },
        },
      })

      return NextResponse.json({
        success: true,
        message: `✓ Deposit reminder dispatched to ${targetPartnerName} via Email, In-App Notification, and Couple Chat!`,
        details: {
          recipient: targetPartnerName,
          email: targetEmail,
          amount: numAmount,
          sentAt: now.toISOString(),
        },
      })
    }

    // 2. CREATE SCHEDULED DEPOSIT REMINDER
    if (action === 'create_reminder') {
      const numAmount = Number(amount) || 500
      const nextDate = new Date()
      if (frequency === 'DAILY') {
        nextDate.setDate(nextDate.getDate() + 1)
      } else if (frequency === 'WEEKLY') {
        nextDate.setDate(nextDate.getDate() + 7)
      } else {
        nextDate.setMonth(nextDate.getMonth() + 1)
      }

      const newReminder = await (prisma as any).depositReminder.create({
        data: {
          id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          userId,
          targetPartnerId: 'usr_marcus_vance',
          targetPartnerName,
          targetEmail,
          amount: numAmount,
          frequency,
          dayOfWeek: dayOfWeek || 'FRIDAY',
          dayOfMonth: Number(dayOfMonth) || 1,
          time,
          note,
          channels: channels || ['EMAIL', 'IN_APP', 'CHAT_SYSTEM'],
          active: true,
          nextReminderDate: nextDate.toISOString(),
          lastSentAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: `Scheduled ${frequency.toLowerCase()} deposit reminder created successfully!`,
        reminder: newReminder,
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('[POST /api/savings/reminders]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, active } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Reminder ID is required' }, { status: 400 })
    }

    const updated = await (prisma as any).depositReminder.update({
      where: { id },
      data: { active: Boolean(active) },
    })

    return NextResponse.json({
      success: true,
      message: `Reminder ${active ? 'activated' : 'paused'}.`,
      reminder: updated,
    })
  } catch (error: any) {
    console.error('[PATCH /api/savings/reminders]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Reminder ID is required' }, { status: 400 })
    }

    await (prisma as any).depositReminder.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Reminder deleted successfully.',
    })
  } catch (error: any) {
    console.error('[DELETE /api/savings/reminders]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
