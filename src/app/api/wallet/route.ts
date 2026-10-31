import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PaymentsNotConfiguredError, startPayment } from '@/lib/payments'
import { WalletBalanceError, moveWallet, walletBalances } from '@/lib/wallet'

export const dynamic = 'force-dynamic'

const MIN_TOPUP = 10
const MAX_TOPUP = 100000

// ---------------------------------------------------------------------------
// GET /api/wallet  my cash and credit balances, history and cash withdrawals
// ---------------------------------------------------------------------------
export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })

  const [balances, entries, withdrawals] = await Promise.all([
    walletBalances(userId),
    prisma.walletEntry.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.walletWithdrawal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 }),
  ])
  return NextResponse.json({
    success: true,
    ...balances,
    entries: entries.map((e) => ({ id: e.id, kind: e.kind, amount: Number(e.amount), reason: e.reason, createdAt: e.createdAt })),
    withdrawals: withdrawals.map((w) => ({
      id: w.id,
      amount: Number(w.amount),
      status: w.status,
      bankName: w.bankName,
      accountEnding: w.accountNumber.slice(-4),
      adminNote: w.adminNote,
      createdAt: w.createdAt,
    })),
  })
}

// ---------------------------------------------------------------------------
// POST /api/wallet
//   { action: 'topup', amount }   add cash by card (Stripe Checkout)
//   { action: 'withdraw', amount, bankName, accountName, accountNumber, routingNumber? }
//      ask to withdraw wallet cash; the cash is held until our team pays it out.
//      Credit can never be withdrawn.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const amount = Math.round(Number(body.amount) * 100) / 100
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ success: false, error: 'Enter an amount.' }, { status: 400 })
  }

  if (body.action === 'topup') {
    if (amount < MIN_TOPUP || amount > MAX_TOPUP) {
      return NextResponse.json({ success: false, error: `Add between $${MIN_TOPUP} and $${MAX_TOPUP.toLocaleString()}.` }, { status: 400 })
    }
    try {
      const checkoutUrl = await startPayment({
        purpose: 'WALLET_TOPUP',
        amount,
        userId,
        userName: session.user.name || 'Member',
        email: session.user.email,
        title: 'Add money to your wallet',
        payload: {},
        origin: req.nextUrl.origin,
        cancelPath: '/wallet?checkout_canceled=true',
      })
      return NextResponse.json({ success: true, checkoutUrl })
    } catch (error) {
      if (error instanceof PaymentsNotConfiguredError) {
        return NextResponse.json({ success: false, error: error.message }, { status: 503 })
      }
      console.error('[POST /api/wallet topup]', error)
      return NextResponse.json({ success: false, error: 'Could not start the payment. Please try again.' }, { status: 500 })
    }
  }

  if (body.action === 'withdraw') {
    const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)
    const bankName = clean(body.bankName, 100)
    const accountName = clean(body.accountName, 100)
    const accountNumber = clean(body.accountNumber, 34).replace(/\s/g, '')
    const routingNumber = clean(body.routingNumber, 34) || null
    if (!bankName || !accountName || !/^[A-Za-z0-9]{4,34}$/.test(accountNumber)) {
      return NextResponse.json({ success: false, error: 'Enter your bank, the account name and the account number.' }, { status: 400 })
    }
    try {
      await prisma.$transaction(async (tx) => {
        const request = await tx.walletWithdrawal.create({
          data: { userId, amount: new Prisma.Decimal(amount), bankName, accountName, accountNumber, routingNumber },
        })
        // Hold the cash now so it can't be invested or withdrawn twice
        await moveWallet(tx, { userId, kind: 'CASH', amount: -amount, reason: 'Withdrawal requested', reference: `WDR-${request.id}` })
      })
    } catch (error) {
      if (error instanceof WalletBalanceError) return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      throw error
    }
    await prisma.notification
      .create({
        data: {
          userId,
          title: 'Withdrawal requested',
          message: `We received your request to withdraw $${amount.toLocaleString()} from your wallet. We'll tell you when it's paid.`,
          type: 'INFO',
          link: '/wallet',
        },
      })
      .catch(() => {})
    return NextResponse.json({ success: true, message: `Your $${amount.toLocaleString()} withdrawal is requested. We'll tell you when it's paid.` })
  }

  return NextResponse.json({ success: false, error: 'Unknown action.' }, { status: 400 })
}
