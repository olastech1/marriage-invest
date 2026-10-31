import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { emailMember } from '@/lib/activity'

export const dynamic = 'force-dynamic'

// PATCH /api/admin/identity/[id] { action: 'approve' | 'reject', note? }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const approve = body.action === 'approve'
  if (!approve && body.action !== 'reject') return NextResponse.json({ error: 'Choose approve or reject.' }, { status: 400 })
  const note = String(body.note || '').trim().slice(0, 300)

  const { count } = await prisma.identityCheck.updateMany({
    where: { id, status: 'PENDING' },
    data: { status: approve ? 'APPROVED' : 'REJECTED', reviewNote: note || null, reviewedById: session.user.id, reviewedAt: new Date() },
  })
  if (!count) return NextResponse.json({ error: 'This check was already reviewed.' }, { status: 409 })
  const check = await prisma.identityCheck.findUnique({ where: { id }, select: { userId: true } })
  if (!check) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (approve) await prisma.user.update({ where: { id: check.userId }, data: { identityVerified: true, identityVerifiedAt: new Date() } })
  await prisma.auditLog
    .create({ data: { userId: session.user.id, action: approve ? 'IDENTITY_APPROVED' : 'IDENTITY_REJECTED', entity: 'User', entityId: check.userId, after: { note } } })
    .catch(() => {})
  await prisma.notification
    .create({
      data: {
        userId: check.userId,
        title: approve ? 'Your identity is verified' : 'We could not verify your ID',
        message: approve ? 'Your profile now shows the verified badge.' : `${note || 'The photo was not clear enough.'} You can send a new one from Settings.`,
        type: approve ? 'SUCCESS' : 'WARNING',
        link: '/settings#verification',
      },
    })
    .catch(() => {})
  await emailMember(check.userId, {
    subject: approve ? 'Your identity is verified' : 'We could not verify your ID',
    heading: approve ? 'Identity verified' : 'ID not verified',
    paragraphs: approve
      ? ['Thanks. Your identity is verified and your profile now shows the verified badge.']
      : [`${note || 'The photo was not clear enough.'}`, 'You can send a new photo of your ID from Settings.'],
    ctaLabel: approve ? 'Open your dashboard' : 'Send a new photo',
    ctaPath: approve ? '/dashboard' : '/settings#verification',
  })
  return NextResponse.json({ success: true })
}
