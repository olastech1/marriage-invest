/**
 * Wallet: two separate balances, kept in the wallet_entries ledger.
 *   CASH   real money from card top-ups. Can be invested or withdrawn.
 *   CREDIT added by an admin. Can only be invested, never withdrawn, and is
 *          left out of deposit totals, raised amounts and the account rating.
 * A balance is the sum of its entries; debits run under a per-member lock so
 * a balance can never go below zero.
 */

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

export type WalletKind = 'CASH' | 'CREDIT'
type Tx = Prisma.TransactionClient

export class WalletBalanceError extends Error {}

const round = (n: number) => Math.round(n * 100) / 100

async function balanceIn(db: Tx | typeof prisma, userId: string, kind: WalletKind) {
  const agg = await db.walletEntry.aggregate({ where: { userId, kind }, _sum: { amount: true } })
  return round(Number(agg._sum.amount ?? 0))
}

export async function walletBalances(userId: string) {
  const [cash, credit] = await Promise.all([balanceIn(prisma, userId, 'CASH'), balanceIn(prisma, userId, 'CREDIT')])
  return { cash, credit }
}

/** Serialise wallet changes for one member inside a transaction */
async function lockWallet(tx: Tx, userId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'wallet:' + userId}))`
}

export const walletRef = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

/** Add (+) or take (-) from a balance inside `tx`; taking more than the balance throws */
export async function moveWallet(
  tx: Tx,
  input: { userId: string; kind: WalletKind; amount: number; reason: string; reference?: string; investmentId?: string; createdById?: string },
) {
  const amount = round(input.amount)
  if (!amount) throw new WalletBalanceError('Enter an amount.')
  await lockWallet(tx, input.userId)
  if (amount < 0) {
    const balance = await balanceIn(tx, input.userId, input.kind)
    if (balance + amount < 0) {
      throw new WalletBalanceError(
        input.kind === 'CREDIT'
          ? `Not enough credit. Your credit balance is $${balance.toLocaleString()}.`
          : `Not enough cash in your wallet. Your cash balance is $${balance.toLocaleString()}.`,
      )
    }
  }
  return tx.walletEntry.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      amount: new Prisma.Decimal(amount),
      reason: input.reason.slice(0, 200),
      reference: input.reference || walletRef(input.kind === 'CASH' ? 'WAL' : 'CRD'),
      investmentId: input.investmentId,
      createdById: input.createdById,
    },
  })
}
