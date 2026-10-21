import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveSpouseId } from '@/lib/chat'
import { getSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

    // Fetch all notifications for user
    const allNotifs: any[] = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Alerts that still need the member to act on them
    const disturbingAlerts = allNotifs.filter((n) => n.requiresAction && !n.attended)
    const unreadCount = allNotifs.filter((n) => !n.read).length
    const unattendedCount = disturbingAlerts.length

    // The deposit match promo is an admin setting (0 = no promo); it has no expiry date
    const { bonusMatchRate } = await getSettings()

    return NextResponse.json({
      success: true,
      notifications: allNotifs,
      disturbingAlerts,
      unreadCount,
      unattendedCount,
      bonusActive: bonusMatchRate > 0,
      bonusRate: bonusMatchRate / 100,
    })
  } catch (error: any) {
    console.error('[GET /api/notifications]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const currentUserId = session?.user?.id
    if (!currentUserId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
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

    // Members may only notify themselves or their own spouse
    if (targetUserId && targetUserId !== currentUserId && targetUserId !== (await resolveSpouseId(currentUserId))) {
      return NextResponse.json({ success: false, error: 'Not allowed' }, { status: 403 })
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
      },
    })

    return NextResponse.json({ success: true, notification: newNotif }, { status: 201 })
  } catch (error: any) {
    console.error('[POST /api/notifications]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
