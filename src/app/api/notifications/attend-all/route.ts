import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id || 'usr_jane_doe'
    const userName = session?.user?.name || 'Investor'

    const allNotifs: any[] = await prisma.notification.findMany({
      where: { userId },
    })

    let count = 0
    for (const notif of allNotifs) {
      if (!notif.attended || !notif.read) {
        await prisma.notification.update({
          where: { id: notif.id },
          data: {
            attended: true,
            read: true,
            attendedAt: new Date(),
          } as any,
        })
        count++
      }
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ALL_NOTIFICATIONS_ATTENDED',
        entity: 'Notification',
        after: {
          attendedBy: userName,
          count,
          attendedAt: new Date().toISOString(),
        },
      },
    }).catch(console.error)

    return NextResponse.json({
      success: true,
      message: `Successfully attended to ${count} notifications.`,
      count,
    })
  } catch (error: any) {
    console.error('[POST /api/notifications/attend-all]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
