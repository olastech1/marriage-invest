import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, message, link, type } = body

    // Persist real in-app database notification
    const notif = await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: title || 'New Message from Marcus Vance',
        message: message || 'You have received a new mutual matrimonial chat message.',
        type: type || 'INFO',
        link: link || '/chat',
      },
    })

    return NextResponse.json({ success: true, notification: notif })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
