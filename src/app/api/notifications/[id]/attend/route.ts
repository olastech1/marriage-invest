import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    const userId = session?.user?.id || 'usr_jane_doe'
    const userName = session?.user?.name || 'Investor'

    const { id } = await params

    if (!id) {
      return NextResponse.json({ success: false, error: 'Notification ID is required' }, { status: 400 })
    }

    // Update notification in database
    const updated = await prisma.notification.update({
      where: { id },
      data: {
        attended: true,
        read: true,
        attendedAt: new Date(),
      } as any,
    })

    // Log the attendance in AuditLog
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'NOTIFICATION_ATTENDED',
        entity: 'Notification',
        entityId: id,
        after: {
          notificationId: id,
          title: updated.title,
          attendedBy: userName,
          attendedAt: new Date().toISOString(),
        },
      },
    }).catch(console.error)

    return NextResponse.json({
      success: true,
      message: 'Notification attended successfully.',
      notification: updated,
    })
  } catch (error: any) {
    console.error('[POST /api/notifications/[id]/attend]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
