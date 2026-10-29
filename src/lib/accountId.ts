/**
 * Account IDs: a permanent 8-digit number on every account (e.g. 48213907).
 * Names repeat, numbers don't: members find each other by it to chat, add them
 * or link as spouses. scripts/assign-account-ids.mjs gives one to any account
 * without it on every build.
 */

import { prisma } from '@/lib/db'

export const newAccountNumber = () => String(10000000 + Math.floor(Math.random() * 90000000))

/** The member's account ID, creating one if they don't have it yet */
export async function ensureAccountNumber(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { accountNumber: true } })
  if (!user) return ''
  if (user.accountNumber) return user.accountNumber
  for (let attempt = 0; attempt < 10; attempt++) {
    const accountNumber = newAccountNumber()
    try {
      const { count } = await prisma.user.updateMany({ where: { id: userId, accountNumber: null }, data: { accountNumber } })
      if (count) return accountNumber
      // Given one meanwhile
      return (await prisma.user.findUnique({ where: { id: userId }, select: { accountNumber: true } }))?.accountNumber || ''
    } catch {
      // Taken: try another number
    }
  }
  return ''
}

/** "4821 3907", "#48213907" or "48-21-39-07" -> "48213907"; '' if it isn't an account ID */
export function normalizeAccountNumber(input: string): string {
  const digits = input.trim().replace(/[\s#-]/g, '')
  return /^\d{8}$/.test(digits) ? digits : ''
}

/** "@chad", "chad" or a bio link ".../u/chad" -> "chad" */
export function normalizeUsername(input: string): string {
  const value = input.trim().toLowerCase()
  const fromLink = value.match(/\/u\/([a-z0-9_-]+)/)
  return (fromLink ? fromLink[1] : value.replace(/^@/, '')).replace(/[^a-z0-9_-]/g, '')
}

export const isEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim())

/** A member (not staff) by account ID, email, or bio-link username */
export async function findMember(query: string) {
  const accountNumber = normalizeAccountNumber(query)
  const where = isEmail(query)
    ? { email: query.trim().toLowerCase() }
    : accountNumber
      ? { accountNumber }
      : { username: normalizeUsername(query) }
  if (!Object.values(where)[0]) return null
  return prisma.user.findFirst({
    where: { ...where, role: 'INVESTOR' },
    select: { id: true, name: true, username: true, accountNumber: true },
  })
}
