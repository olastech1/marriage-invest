import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { imageType } from '@/lib/imageType'

export const dynamic = 'force-dynamic'

const DOCUMENT_TYPES = ['passport', 'national_id', 'drivers_license'] as const
const MAX_BYTES = 4 * 1024 * 1024

// GET /api/user/identity  my verification: email and identity
export async function GET() {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })
  const [user, latest] = await Promise.all([
    prisma.user.findUnique({ where: { id: me }, select: { email: true, emailVerified: true, identityVerified: true } }),
    prisma.identityCheck.findFirst({
      where: { userId: me },
      orderBy: { createdAt: 'desc' },
      select: { status: true, reviewNote: true, documentType: true, createdAt: true },
    }),
  ])
  return NextResponse.json({
    success: true,
    email: user?.email,
    emailVerified: !!user?.emailVerified,
    identityVerified: !!user?.identityVerified,
    latestCheck: latest,
  })
}

// POST /api/user/identity (form: documentType, fullName, document)  send an ID photo for review
export async function POST(req: NextRequest) {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: me }, select: { identityVerified: true } })
  if (user?.identityVerified) return NextResponse.json({ success: false, error: 'Your identity is already verified.' }, { status: 400 })
  if (await prisma.identityCheck.findFirst({ where: { userId: me, status: 'PENDING' } })) {
    return NextResponse.json({ success: false, error: "We're already reviewing your ID. You'll hear from us soon." }, { status: 400 })
  }

  const form = await req.formData().catch(() => null)
  const documentType = String(form?.get('documentType') || '')
  const fullName = String(form?.get('fullName') || '').trim().slice(0, 120)
  const file = form?.get('document')
  if (!DOCUMENT_TYPES.includes(documentType as (typeof DOCUMENT_TYPES)[number])) {
    return NextResponse.json({ success: false, error: 'Choose the type of ID.' }, { status: 400 })
  }
  if (fullName.length < 2) return NextResponse.json({ success: false, error: 'Enter your full name as it appears on the ID.' }, { status: 400 })
  if (!(file instanceof Blob) || file.size === 0) return NextResponse.json({ success: false, error: 'Add a photo of your ID.' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ success: false, error: 'That photo is too large.' }, { status: 413 })
  const bytes = new Uint8Array(await file.arrayBuffer())
  const mimeType = imageType(bytes)
  if (!mimeType) return NextResponse.json({ success: false, error: 'Use a JPG, PNG or WebP photo of your ID.' }, { status: 415 })

  await prisma.identityCheck.create({ data: { userId: me, documentType, fullName, document: bytes, mimeType } })
  await prisma.auditLog.create({ data: { userId: me, action: 'IDENTITY_CHECK_SUBMITTED', entity: 'User', entityId: me } }).catch(() => {})
  return NextResponse.json({ success: true, message: "Thanks. We'll review your ID and let you know, usually within a day." })
}
