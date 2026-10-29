/**
 * Account IDs. A member's username is their account ID: other members find
 * them by it to chat, add them or link as spouses. New IDs are the first name
 * plus digits (e.g. chad4821) so nobody's full name can be guessed; members can
 * pick their own in Settings. scripts/assign-account-ids.mjs fills in any
 * account that has none on every build.
 */

import { prisma } from '@/lib/db'

/** A fresh candidate ID: first name + 4 digits (6 once 4 keep colliding) */
export function candidateAccountId(name: string, attempt: number): string {
  const base = (name.trim().split(/\s+/)[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'member'
  const size = attempt < 15 ? 1000 : 100000
  return `${base}${size + Math.floor(Math.random() * 9 * size)}`
}

/** The member's account ID, creating one if they don't have it yet */
export async function ensureAccountId(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, username: true } })
  if (!user) return ''
  if (user.username) return user.username
  for (let attempt = 0; attempt < 20; attempt++) {
    const username = candidateAccountId(user.name, attempt)
    try {
      await prisma.user.update({ where: { id: userId }, data: { username } })
      return username
    } catch {
      // Taken: try another number
    }
  }
  return ''
}

/** "@chad4821", "chad4821" or a bio link ".../u/chad4821" -> "chad4821" */
export function normalizeAccountId(input: string): string {
  const value = input.trim().toLowerCase()
  const fromLink = value.match(/\/u\/([a-z0-9_-]+)/)
  return (fromLink ? fromLink[1] : value.replace(/^@/, '')).replace(/[^a-z0-9_-]/g, '')
}

export const isEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim())

/** A member (not staff) by exact account ID or email */
export async function findMember(query: string) {
  const where = isEmail(query) ? { email: query.trim().toLowerCase() } : { username: normalizeAccountId(query) }
  if (!Object.values(where)[0]) return null
  const user = await prisma.user.findFirst({ where: { ...where, role: 'INVESTOR' }, select: { id: true, name: true, username: true } })
  return user
}
