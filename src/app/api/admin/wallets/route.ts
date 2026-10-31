import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { findMember } from '@/lib/accountId'
import { WalletBalanceError, moveWallet, walletBalances } from '@/lib/wallet'

export const dynamic = 'force-dynamic'

const isAdmin = async () => {
  const session = await auth()
  return session?.user?.role === 'ADMIN' ? session : null
}

// ---------------------------------------------------------------------------
// GET /api/admin/wallets?q=<account ID or email>
// One member's balances and history (with q), and every cash withdrawal still to pay.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
  const q = req.nextUrl.searchParams.get('q')?.trim() || ''

  const pending = await prisma.walletWithdrawal.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' }, take: 100 })
  const owners = await prisma.user.findMany({
    where: { id: { in: [...new Set(pending.map((p) => p.userId))] } },
    select: { id: true, name: true, email: true, accountNumber: true },
  })
  const owner = new Map(owners.map((o) => [o.id, o]))

  let member = null
  if (q) {
    const found = await findMember(q)
    if (!found) return NextResponse.json({ success: false, error: 'No member with that account ID or email.' }, { status: 404 })
    const [balances, entries, user] = await Promise.all([
      walletBalances(found.id),
      prisma.walletEntry.findMany({ where: { userId: found.id }, orderBy: { createdAt: 'desc' }, take: 30 }),
      prisma.user.findUnique({ where: { id: found.id }, select: { email: true } }),
    ])
    member = {
      id: found.id,
      name: found.name,
      email: user?.email || '',
      accountNumber: found.accountNumber,
      ...balances,
      entries: entries.map((e) => ({ id: e.id, kind: e.kind, amount: Number(e.amount), reason: e.reason, createdAt: e.createdAt })),
    }
  }

  return NextResponse.json({
    success: true,
    member,
    pending: pending.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      bankName: p.bankName,
      accountName: p.accountName,
      accountNumber: p.accountNumber,
      routingNumber: p.routingNumber,
      createdAt: p.createdAt,
      member: owner.get(p.userId) || null,
    })),
  })
}

// ---------------------------------------------------------------------------
// POST /api/admin/wallets { userId, amount, note }
// Add (+) or remove (-) credit. Credit can be invested, never withdrawn, and
// isn't counted as a deposit.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await isAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const amount = Math.round(Number(body.amount) * 100) / 100
  const note = String(body.note || '').trim().slice(0, 150)
  const user = await prisma.user.findFirst({ where: { id: String(body.userId || ''), role: 'INVESTOR' }, select: { id: true } })
  if (!user) return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
  if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 1_000_000) {
    return NextResponse.json({ error: 'Enter an amount (use a minus sign to remove credit).' }, { status: 400 })
  }

  try {
    await prisma.$transaction((tx) =>
      moveWallet(tx, {
        userId: user.id,
        kind: 'CREDIT',
        amount,
        reason: note || (amount > 0 ? 'Credit added' : 'Credit removed'),
        createdById: session.user.id,
      }),
    )
  } catch (error) {
    if (error instanceof WalletBalanceError) return NextResponse.json({ error: error.message.replace('Your credit', 'Their credit') }, { status: 400 })
    throw error
  }
  await prisma.auditLog
    .create({ data: { userId: session.user.id, action: amount > 0 ? 'WALLET_CREDIT_ADDED' : 'WALLET_CREDIT_REMOVED', entity: 'User', entityId: user.id, after: { amount, note } } })
    .catch(() => {})
  if (amount > 0) {
    await prisma.notification
      .create({
        data: {
          userId: user.id,
          title: `$${amount.toLocaleString()} credit added to your wallet`,
          message: 'You can use it to invest. Credit can’t be withdrawn.',
          type: 'SUCCESS',
          link: '/wallet',
        },
      })
      .catch(() => {})
  }
  return NextResponse.json({ success: true, message: amount > 0 ? `Added $${amount.toLocaleString()} credit.` : `Removed $${Math.abs(amount).toLocaleString()} credit.` })
}
