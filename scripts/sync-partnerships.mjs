/**
 * Copies spouse links from before partnerships (User.spouseId) into the
 * partnerships table, run on every build. Only adds missing rows; nothing is
 * changed or removed. Once (marked in app_settings), investments those couples
 * made before partnerships are kept shared with that spouse, so withdrawals
 * still need their approval; investments made later stay as they were made.
 */

import { PrismaClient } from '@prisma/client'

const url = process.env.DATABASE_URL
if (!url) process.exit(0)

const BACKFILL_DONE = 'partnerships.investments_backfilled'

const prisma = new PrismaClient({ datasourceUrl: url })
try {
  const users = await prisma.user.findMany({ where: { spouseId: { not: null } }, select: { id: true, spouseId: true } })
  const ids = new Set((await prisma.user.findMany({ select: { id: true } })).map((u) => u.id))
  const backfilled = await prisma.appSetting.findUnique({ where: { key: BACKFILL_DONE } })
  let linked = 0
  let shared = 0
  for (const u of users) {
    if (!u.spouseId || u.spouseId === u.id || !ids.has(u.spouseId)) continue
    const [userAId, userBId] = u.id < u.spouseId ? [u.id, u.spouseId] : [u.spouseId, u.id]
    const existing = await prisma.partnership.findUnique({ where: { userAId_userBId: { userAId, userBId } } })
    if (!existing) {
      await prisma.partnership.create({ data: { userAId, userBId, relation: 'spouse' } }).catch(() => null)
      linked++
    }
    if (!backfilled) {
      const { count } = await prisma.investment.updateMany({ where: { userId: u.id, partnerId: null }, data: { partnerId: u.spouseId } })
      shared += count
    }
  }
  if (!backfilled) {
    await prisma.appSetting.create({ data: { key: BACKFILL_DONE, value: { at: new Date().toISOString(), investments: shared } } })
  }
  console.log(`[partnerships] ${linked} spouse link(s) copied, ${shared} older investment(s) kept shared with that spouse`)
} catch (err) {
  console.warn('[partnerships] Skipped:', err?.message?.split('\n').pop())
}
await prisma.$disconnect()
