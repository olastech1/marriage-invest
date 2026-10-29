/**
 * Gives every account without one its account ID (a permanent 8-digit number),
 * run on every build. Only empty account IDs are filled in; nothing else is
 * changed. Same format as src/lib/accountId.ts.
 */

import { PrismaClient } from '@prisma/client'

const url = process.env.DATABASE_URL
if (!url) process.exit(0)

const newAccountNumber = () => String(10000000 + Math.floor(Math.random() * 90000000))

const prisma = new PrismaClient({ datasourceUrl: url })
try {
  const users = await prisma.user.findMany({ where: { accountNumber: null }, select: { id: true } })
  let assigned = 0
  for (const user of users) {
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        const { count } = await prisma.user.updateMany({ where: { id: user.id, accountNumber: null }, data: { accountNumber: newAccountNumber() } })
        assigned += count
        break
      } catch {
        // Taken: try another number
      }
    }
  }
  console.log(`[account-ids] ${assigned} of ${users.length} account(s) without an ID now have one`)
} catch (err) {
  console.warn('[account-ids] Skipped:', err?.message?.split('\n').pop())
}
await prisma.$disconnect()
