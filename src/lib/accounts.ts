/**
 * System accounts that exist only when their passwords are configured:
 *   - the platform admin: ADMIN_EMAIL + ADMIN_PASSWORD
 *   - the Jane/Marcus test couple: TEST_ACCOUNT_PASSWORD
 * Nothing here is created with a default or hardcoded password.
 */

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

interface SystemAccount {
  id: string
  email: string
  name: string
  username: string
  role: 'ADMIN' | 'INVESTOR'
  spouseId?: string
  password: string | undefined
}

function systemAccounts(): SystemAccount[] {
  const accounts: SystemAccount[] = []
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim()
  if (adminEmail && process.env.ADMIN_PASSWORD) {
    accounts.push({
      id: 'usr_admin',
      email: adminEmail,
      name: 'Platform Administrator',
      username: 'admin',
      role: 'ADMIN',
      password: process.env.ADMIN_PASSWORD,
    })
  }
  if (process.env.TEST_ACCOUNT_PASSWORD) {
    accounts.push(
      {
        id: 'usr_jane_doe',
        email: 'jane.doe@unionverify.com',
        name: 'Jane Doe',
        username: 'jane-doe',
        role: 'INVESTOR',
        spouseId: 'usr_marcus_vance',
        password: process.env.TEST_ACCOUNT_PASSWORD,
      },
      {
        id: 'usr_marcus_vance',
        email: 'marcus.vance@unionverify.com',
        name: 'Marcus Vance',
        username: 'marcus-vance',
        role: 'INVESTOR',
        spouseId: 'usr_jane_doe',
        password: process.env.TEST_ACCOUNT_PASSWORD,
      },
    )
  }
  return accounts
}

/**
 * Creates (or re-syncs the password/role of) the configured system account for
 * this email, if there is one. Called on sign-in so env changes take effect.
 */
export async function ensureSystemAccount(email: string): Promise<void> {
  const account = systemAccounts().find((a) => a.email === email)
  if (!account?.password) return

  const existing = await prisma.user.findUnique({ where: { email } })
  const passwordMatches = existing ? await bcrypt.compare(account.password, existing.passwordHash) : false
  if (existing && passwordMatches && existing.role === account.role) return

  const passwordHash = await bcrypt.hash(account.password, 12)
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: account.role },
    create: {
      id: account.id,
      email,
      name: account.name,
      username: account.username,
      role: account.role,
      passwordHash,
      spouseId: account.spouseId,
      emailVerified: new Date(),
    },
  })
}

/** Only the configured ADMIN_EMAIL may hold the admin role. */
export function isAdminEmail(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim()
  return !!adminEmail && email.toLowerCase().trim() === adminEmail
}
