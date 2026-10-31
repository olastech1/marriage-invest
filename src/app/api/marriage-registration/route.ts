import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { FEES, PaymentsNotConfiguredError, startPayment } from '@/lib/payments'

export const dynamic = 'force-dynamic'

// The union package (registration + certificate) is $1,000: one partner pays it all,
// or each pays half (the second half from the other partner's account)
const OPTIONS = {
  both: { amount: FEES.registration + FEES.certificate, title: 'Union package: registration and certificate' },
  split: { amount: (FEES.registration + FEES.certificate) / 2, title: 'Union package: my half (50-50)' },
  registration: { amount: FEES.registration, title: 'Union registration' },
  certificate: { amount: FEES.certificate, title: 'Union certificate' },
} as const

const clean = (v: unknown, max = 120) => String(v ?? '').trim().slice(0, max)

// ---------------------------------------------------------------------------
// POST /api/marriage-registration
// The signed-in member registers their union (they are partner 1). The fee is
// set here, paid through Stripe Checkout, and the registration is created only
// once the payment succeeds (see src/lib/payments.ts).
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in or create an account first.' }, { status: 401 })
    }

    const body = await req.json()
    const option = OPTIONS[body.paymentOption as keyof typeof OPTIONS] ? (body.paymentOption as keyof typeof OPTIONS) : 'both'
    const partner2Name = clean(body.partner2Name)
    const partner2Email = clean(body.partner2Email).toLowerCase()
    if (!partner2Name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(partner2Email)) {
      return NextResponse.json({ error: "Please enter your partner's name and a valid email." }, { status: 400 })
    }
    if (partner2Email === session.user.email?.toLowerCase()) {
      return NextResponse.json({ error: "Your partner's email must be different from yours." }, { status: 400 })
    }

    const { amount, title } = OPTIONS[option]
    const checkoutUrl = await startPayment({
      purpose: 'MARRIAGE_REGISTRATION',
      amount,
      userId: session.user.id,
      userName: session.user.name || 'Member',
      email: session.user.email,
      title,
      description: `${session.user.name} & ${partner2Name}`,
      payload: {
        option,
        partner1Name: session.user.name || clean(body.partner1Name),
        partner1Email: session.user.email,
        partner2Name,
        partner2Email,
        details: {
          unionType: clean(body.selectedTypeId, 60),
          partner1Dob: clean(body.partner1Dob, 20),
          partner1Citizenship: clean(body.partner1Citizenship, 60),
          partner2Dob: clean(body.partner2Dob, 20),
          partner2Citizenship: clean(body.partner2Citizenship, 60),
          weddingDate: clean(body.weddingDate, 20),
          vows: clean(body.customVows, 2000),
        },
      },
      origin: req.nextUrl.origin,
      cancelPath: '/get-married',
    })
    return NextResponse.json({ success: true, checkoutUrl })
  } catch (error) {
    if (error instanceof PaymentsNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('[POST /api/marriage-registration]', error)
    return NextResponse.json({ error: 'Could not start the payment. Please try again.' }, { status: 500 })
  }
}
