import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getPartnerLinks } from '@/lib/partners'
import { FEES, PaymentsNotConfiguredError, startPayment } from '@/lib/payments'

export const dynamic = 'force-dynamic'

// The couple's registration: made by me, naming my email, or by a partner I'm linked with as spouses
async function findRegistration(userId: string, email: string) {
  const spouseIds = (await getPartnerLinks(userId)).filter((l) => l.relation === 'spouse').map((l) => l.id)
  return prisma.marriageRegistration.findFirst({
    where: {
      OR: [{ userId }, { partner2Email: email.toLowerCase() }, ...(spouseIds.length ? [{ userId: { in: spouseIds } }] : [])],
    },
    orderBy: { createdAt: 'desc' },
  })
}

// GET /api/certificate → { registration | null, certificateFee }
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  const registration = await findRegistration(session.user.id, session.user.email || '')
  return NextResponse.json({
    success: true,
    certificateFee: FEES.certificate,
    registration: registration && {
      id: registration.id,
      docketNumber: registration.docketNumber,
      partner1Name: registration.partner1Name,
      partner2Name: registration.partner2Name,
      registeredAt: registration.createdAt,
      registrationPaid: registration.registrationPaid,
      certificatePaid: registration.certificatePaid,
      certificateNumber: registration.certificateNumber,
      unionType: (registration.details as Record<string, string> | null)?.unionType || '',
      weddingDate: (registration.details as Record<string, string> | null)?.weddingDate || '',
    },
  })
}

// POST /api/certificate → { checkoutUrl } to pay the certificate fee
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  const registration = await findRegistration(session.user.id, session.user.email || '')
  if (!registration) return NextResponse.json({ error: 'Register your union first.' }, { status: 400 })
  if (registration.certificatePaid) return NextResponse.json({ error: 'Your certificate is already paid.' }, { status: 400 })
  if (registration.userId !== session.user.id) {
    return NextResponse.json({ error: 'The partner who registered the union pays the certificate fee.' }, { status: 403 })
  }
  try {
    const checkoutUrl = await startPayment({
      purpose: 'CERTIFICATE',
      amount: FEES.certificate,
      userId: session.user.id,
      userName: session.user.name || 'Member',
      email: session.user.email,
      title: 'Union certificate',
      description: `Certificate for ${registration.docketNumber}`,
      payload: { registrationId: registration.id },
      origin: req.nextUrl.origin,
      cancelPath: '/certificate',
    })
    return NextResponse.json({ success: true, checkoutUrl })
  } catch (error) {
    if (error instanceof PaymentsNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('[POST /api/certificate]', error)
    return NextResponse.json({ error: 'Could not start the payment. Please try again.' }, { status: 500 })
  }
}
