import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendDepositReminderEmail } from '@/lib/email'
import { buildThreadId, createChatMessage } from '@/lib/chat'
import { getPartnerIds } from '@/lib/partners'

export const dynamic = 'force-dynamic'


export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

    const reminders = await prisma.depositReminder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      reminders: reminders || [],
    })
  } catch (error: any) {
    console.error('[GET /api/savings/reminders]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
    const userName = session?.user?.name || 'Your partner'
    const body = await req.json()

    const { action = 'send_now', amount = 0, vaultName = 'your joint vault', note = '' } = body

    // 1. ASK ONE PARTNER FOR MONEY NOW (in-app, our chat, and email)
    if (action === 'send_now') {
      const partnerIds = await getPartnerIds(userId)
      const chosen = String(body.partnerId || '')
      const spouseId = chosen ? (partnerIds.includes(chosen) ? chosen : '') : partnerIds.length === 1 ? partnerIds[0] : ''
      const spouse = spouseId ? await prisma.user.findUnique({ where: { id: spouseId } }) : null
      if (!spouse) {
        return NextResponse.json(
          { success: false, error: partnerIds.length ? 'Choose which partner to ask.' : 'Connect with your partner first.' },
          { status: 400 },
        )
      }
      const numAmount = Math.round(Number(amount) * 100) / 100
      if (!(numAmount > 0)) {
        return NextResponse.json({ success: false, error: 'Enter an amount.' }, { status: 400 })
      }
      const cleanNote = String(note || '').slice(0, 300)
      const sent: string[] = []

      const emailSent = await sendDepositReminderEmail({
        to: spouse.email,
        recipientName: spouse.name,
        senderName: userName,
        senderId: userId,
        amount: numAmount,
        vaultName,
        note: cleanNote || `Please add $${numAmount.toLocaleString()} to our joint vault.`,
        frequency: 'ONCE',
      }).catch(() => false)
      if (emailSent) sent.push('email')

      const notified = await prisma.notification
        .create({
          data: {
            userId: spouse.id,
            title: `${userName} requested $${numAmount.toLocaleString()}`,
            message: `${userName} asked you to add $${numAmount.toLocaleString()} to your joint vault${cleanNote ? ` for "${cleanNote}"` : ''}. Pay from your chat.`,
            type: 'ALERT',
            link: `/save?amount=${numAmount}&partner=${encodeURIComponent(userId)}`,
            category: 'PARTNER_CHANGE',
            requiresAction: true,
            amount: numAmount,
            partnerName: userName,
            actionLabel: `Deposit $${numAmount.toLocaleString()}`,
          },
        })
        .then(() => true)
        .catch(() => false)
      if (notified) sent.push('notification')

      const now = new Date()
      const posted = await createChatMessage({
        data: {
          id: `sys-remind-${Date.now()}`,
          threadId: buildThreadId(userId, spouse.id),
          senderId: 'system_reminder',
          senderName: 'Money request',
          text: `${userName} requested $${numAmount.toLocaleString()} from ${spouse.name}${cleanNote ? ` for "${cleanNote}"` : ''}.`,
          timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(now),
          createdAt: now,
          read: false,
          type: 'system_reminder',
          proposalData: { amount: numAmount, fromUserId: userId, toUserId: spouse.id },
        },
      })
        .then(() => true)
        .catch(() => false)
      if (posted) sent.push('couple chat')

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'DEPOSIT_REMINDER_SENT',
          entity: 'DepositReminder',
          after: { senderName: userName, spouseId: spouse.id, amount: numAmount, channels: sent, sentAt: now.toISOString() },
        },
      })

      if (sent.length === 0) {
        return NextResponse.json({ success: false, error: 'The reminder could not be sent. Please try again.' }, { status: 500 })
      }
      return NextResponse.json({
        success: true,
        message: `Request sent to ${spouse.name} by ${sent.join(', ')}.`,
        details: { recipient: spouse.name, amount: numAmount, channels: sent, sentAt: now.toISOString() },
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
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
    const body = await req.json()
    const { id, active } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Reminder ID is required' }, { status: 400 })
    }

    const owned = await prisma.depositReminder.updateMany({
      where: { id, userId },
      data: { active: Boolean(active) },
    })
    if (owned.count === 0) {
      return NextResponse.json({ success: false, error: 'Reminder not found' }, { status: 404 })
    }
    const updated = await prisma.depositReminder.findUnique({ where: { id } })

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
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Reminder ID is required' }, { status: 400 })
    }

    const deleted = await prisma.depositReminder.deleteMany({ where: { id, userId } })
    if (deleted.count === 0) {
      return NextResponse.json({ success: false, error: 'Reminder not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder deleted successfully.',
    })
  } catch (error: any) {
    console.error('[DELETE /api/savings/reminders]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
