/**
 * Gives every account without one an account ID (username), run on every build.
 * Only empty usernames are filled in; nothing else is changed. Same format as
 * src/lib/accountId.ts: first name + 4 digits, e.g. chad4821.
 */

import { PrismaClient } from '@prisma/client'

const url = process.env.DATABASE_URL
if (!url) process.exit(0)

const candidate = (name, attempt) => {
  const base = (name.trim().split(/\s+/)[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'member'
  const size = attempt < 15 ? 1000 : 100000
  return `${base}${size + Math.floor(Math.random() * 9 * size)}`
}

const prisma = new PrismaClient({ datasourceUrl: url })
try {
  const users = await prisma.user.findMany({ where: { username: null }, select: { id: true, name: true } })
  let assigned = 0
  for (const user of users) {
    for (let attempt = 0; attempt < 20; attempt++) {
      try {
        const { count } = await prisma.user.updateMany({ where: { id: user.id, username: null }, data: { username: candidate(user.name, attempt) } })
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
