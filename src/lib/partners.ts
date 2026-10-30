/**
 * Partners: members linked in pairs. A member can have any number of partners
 * (a spouse, friends, family…); each pair has its own joint vault, chat,
 * reciprocation and withdrawal approvals.
 *
 * Links live in the partnerships table. Accounts linked before partnerships
 * existed (User.spouseId) and the seeded test couple still count; the build
 * copies spouseId links into partnerships (scripts/sync-partnerships.mjs).
 */

import { prisma } from '@/lib/db'

import { RELATIONS, cleanRelation, type Relation } from '@/lib/relations'

export { RELATIONS, cleanRelation, type Relation }

// Seeded test couple
const DEMO_PAIRS: Record<string, string> = {
  usr_jane_doe: 'usr_marcus_vance',
  usr_marcus_vance: 'usr_jane_doe',
}

/** A pair is stored once, smaller id first */
export const pairKey = (a: string, b: string) => (a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a })

export type PartnerLink = { id: string; relation: Relation; since: Date }

/** The one spouse an account could have before partnerships (and the test couple) */
export async function legacySpouseId(userId: string): Promise<string> {
  if (!userId) return ''
  if (DEMO_PAIRS[userId]) return DEMO_PAIRS[userId]
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { spouseId: true } }).catch(() => null)
  return me?.spouseId || ''
}

/** Everyone this member is linked with, oldest link first */
export async function getPartnerLinks(userId: string): Promise<PartnerLink[]> {
  if (!userId) return []
  const [rows, legacy] = await Promise.all([
    prisma.partnership
      .findMany({ where: { OR: [{ userAId: userId }, { userBId: userId }] }, orderBy: { createdAt: 'asc' } })
      .catch(() => []),
    legacySpouseId(userId),
  ])
  const links = new Map<string, PartnerLink>()
  if (legacy && legacy !== userId) links.set(legacy, { id: legacy, relation: 'spouse', since: new Date(0) })
  for (const row of rows) {
    const other = row.userAId === userId ? row.userBId : row.userAId
    links.set(other, { id: other, relation: cleanRelation(row.relation), since: links.get(other)?.since || row.createdAt })
  }
  return [...links.values()]
}

export async function getPartnerIds(userId: string): Promise<string[]> {
  return (await getPartnerLinks(userId)).map((l) => l.id)
}

export async function isPartner(a: string, b: string): Promise<boolean> {
  if (!a || !b || a === b) return false
  return (await getPartnerIds(a)).includes(b)
}

export type Partner = {
  id: string
  name: string
  email: string
  accountNumber: string | null
  avatarUrl: string | null
  relation: Relation
  relationLabel: string
}

/** Partners with their details, for lists and pickers */
export async function getPartners(userId: string): Promise<Partner[]> {
  const links = await getPartnerLinks(userId)
  if (!links.length) return []
  const users = await prisma.user.findMany({
    where: { id: { in: links.map((l) => l.id) } },
    select: { id: true, name: true, email: true, accountNumber: true, avatarUrl: true },
  })
  return links
    .map((l) => {
      const u = users.find((x) => x.id === l.id)
      return u ? { ...u, relation: l.relation, relationLabel: RELATIONS[l.relation] as string } : null
    })
    .filter((p): p is Partner => !!p)
}

/** Link two members (or change what they are to each other) */
export async function linkPartners(a: string, b: string, relation: Relation) {
  const key = pairKey(a, b)
  await prisma.partnership.upsert({
    where: { userAId_userBId: key },
    update: { relation },
    create: { ...key, relation },
  })
}

/** Who has to approve withdrawals from this investment: the partner it is shared with, while still linked */
export async function investmentPartnerId(investment: { userId: string; partnerId: string | null }): Promise<string> {
  if (!investment.partnerId) return ''
  return (await isPartner(investment.userId, investment.partnerId)) ? investment.partnerId : ''
}

/** Who has to approve this withdrawal (requests from before partnerships name no partner: the old spouse) */
export async function withdrawalApproverId(withdrawal: { userId: string; adminNote: string | null }): Promise<string> {
  let meta: Record<string, unknown> = {}
  try {
    if (withdrawal.adminNote?.startsWith('{')) meta = JSON.parse(withdrawal.adminNote)
  } catch {
    meta = {}
  }
  if (!meta.requiresPartnerApproval) return ''
  if (typeof meta.partnerId === 'string' && meta.partnerId) return meta.partnerId
  return legacySpouseId(withdrawal.userId)
}
