import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id || 'usr_jane_doe'

    // Fetch all notifications for user
    const allNotifs: any[] = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Filter disturbing alerts: requiresAction === true and attended !== true
    const disturbingAlerts = allNotifs.filter((n) => n.requiresAction && !n.attended)
    const unreadCount = allNotifs.filter((n) => !n.read).length
    const unattendedCount = disturbingAlerts.length

    return NextResponse.json({
      success: true,
      notifications: allNotifs,
      disturbingAlerts,
      unreadCount,
      unattendedCount,
      bonusActive: true,
      bonusRate: 0.10, // 10% cash match bonus
      bonusExpiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    })
  } catch (error: any) {
    console.error('[GET /api/notifications]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const currentUserId = session?.user?.id || 'usr_jane_doe'
    const currentUserName = session?.user?.name || 'Investor'

    const body = await req.json()
    const {
      targetUserId,
      title,
      message,
      type = 'INFO',
      link = '/save',
      category = 'GENERAL',
      requiresAction = false,
      amount,
      partnerName,
      actionLabel,
      metadata = {},
    } = body

    if (!title || !message) {
      return NextResponse.json({ success: false, error: 'Title and message are required' }, { status: 400 })
    }

    const newNotif = await prisma.notification.create({
      data: {
        userId: targetUserId || currentUserId,
        title,
        message,
        type: type as any,
        link,
        read: false,
        category,
        requiresAction: Boolean(requiresAction),
        attended: false,
        amount: amount ? Number(amount) : undefined,
        partnerName: partnerName || currentUserName,
        actionLabel: actionLabel || 'Review & Attend',
        metadata,
      } as any,
    })

    return NextResponse.json({ success: true, notification: newNotif }, { status: 201 })
  } catch (error: any) {
    console.error('[POST /api/notifications]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
