import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { moveWallet } from '@/lib/wallet'
import { emailMember } from '@/lib/activity'

export const dynamic = 'force-dynamic'

// PATCH /api/admin/wallets/withdrawals/[id] { action: 'paid' | 'reject', note? }
// paid: the money was sent to their bank. reject: the held cash goes back to their wallet.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const paid = body.action === 'paid'
  if (!paid && body.action !== 'reject') return NextResponse.json({ error: 'Choose paid or reject.' }, { status: 400 })
  const note = String(body.note || '').trim().slice(0, 300)

  const request = await prisma.$transaction(async (tx) => {
    const { count } = await tx.walletWithdrawal.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: paid ? 'PAID' : 'REJECTED', adminNote: note || null, reviewedById: session.user.id, reviewedAt: new Date() },
    })
    if (!count) return null
    const row = await tx.walletWithdrawal.findUniqueOrThrow({ where: { id } })
    if (paid) {
      await tx.transaction.create({
        data: {
          userId: row.userId,
          type: 'WITHDRAWAL',
          amount: row.amount,
          netAmount: row.amount,
          status: 'COMPLETED',
          reference: `WDR-${row.id}`,
          description: 'Wallet withdrawal',
          processedAt: new Date(),
        },
      })
    } else {
      await moveWallet(tx, { userId: row.userId, kind: 'CASH', amount: Number(row.amount), reason: 'Withdrawal returned', reference: `WDR-BACK-${row.id}` })
    }
    return row
  })
  if (!request) return NextResponse.json({ error: 'This withdrawal was already handled.' }, { status: 409 })

  const usd = `$${Number(request.amount).toLocaleString()}`
  await prisma.auditLog
    .create({ data: { userId: session.user.id, action: paid ? 'WALLET_WITHDRAWAL_PAID' : 'WALLET_WITHDRAWAL_REJECTED', entity: 'WalletWithdrawal', entityId: id, after: { note } } })
    .catch(() => {})
  await prisma.notification
    .create({
      data: {
        userId: request.userId,
        title: paid ? `${usd} withdrawal paid` : `${usd} withdrawal returned to your wallet`,
        message: paid ? `We sent ${usd} to your ${request.bankName} account.` : `${note || 'We could not pay it out.'} The money is back in your wallet.`,
        type: paid ? 'SUCCESS' : 'WARNING',
        link: '/wallet',
      },
    })
    .catch(() => {})
  await emailMember(request.userId, {
    subject: paid ? `Your ${usd} withdrawal was paid` : `Your ${usd} withdrawal was returned to your wallet`,
    heading: paid ? 'Withdrawal paid' : 'Withdrawal returned',
    paragraphs: [paid ? `We sent ${usd} to your ${request.bankName} account.` : `${note || 'We could not pay it out.'} The money is back in your wallet.`],
    ctaLabel: 'Open wallet',
    ctaPath: '/wallet',
  })
  return NextResponse.json({ success: true })
}
