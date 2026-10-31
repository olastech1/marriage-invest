/**
 * NextAuth v5 configuration for Union Verify.
 *
 * Strategy : JWT
 * Provider : Credentials (email + password)
 * Extras   : role, emailVerified, twoFactorEnabled surfaced on session
 */

import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ensureSystemAccount, isAdminEmail } from '@/lib/accounts'
import type { UserRole } from '@prisma/client'

// ---------------------------------------------------------------------------
// Module augmentation – extend the built-in session / jwt types
// ---------------------------------------------------------------------------
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      emailVerified: Date | null
      twoFactorEnabled: boolean
    } & DefaultSession['user']
  }

  interface User {
    id?: string
    role: UserRole
    emailVerified: Date | null
    twoFactorEnabled: boolean
  }
}

// ---------------------------------------------------------------------------
// Credentials validation schema
// ---------------------------------------------------------------------------
const PUBLISHED_SEED_PASSWORDS = ['Admin@123!', 'Finance@123!', 'Investor@123!']

const credentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Sign-in follows the address the member is on. A Vercel deploy address left in
// AUTH_URL / NEXTAUTH_URL would send everyone to *.vercel.app after signing in.
for (const key of ['AUTH_URL', 'NEXTAUTH_URL'] as const) {
  if (/\.vercel\.app/i.test(process.env[key] || '')) delete process.env[key]
}

// ---------------------------------------------------------------------------
// The account behind a session, re-read at most every 30 seconds per server
// copy (every page load checks it; this keeps that off the database)
// ---------------------------------------------------------------------------
const ACCOUNT_CACHE_MS = 30_000
type SessionAccount = { name: string; email: string; role: UserRole; emailVerified: Date | null; twoFactorEnabled: boolean; passwordChangedAt: Date | null }
const accountCache = new Map<string, { at: number; value: SessionAccount | null }>()

async function sessionAccount(id: string): Promise<SessionAccount | null | undefined> {
  const hit = accountCache.get(id)
  if (hit && Date.now() - hit.at < ACCOUNT_CACHE_MS) return hit.value
  const value = await prisma.user
    .findUnique({
      where: { id },
      select: { name: true, email: true, role: true, emailVerified: true, twoFactorEnabled: true, passwordChangedAt: true },
    })
    .catch(() => undefined)
  // A failed read isn't kept (undefined: keep the session as it is this time)
  if (value !== undefined) {
    if (accountCache.size > 5000) accountCache.delete(accountCache.keys().next().value as string)
    accountCache.set(id, { at: Date.now(), value })
  }
  return value
}

/** The account changed (name, password…): read it again on the next page */
export function forgetSessionAccount(id: string) {
  accountCache.delete(id)
}

// ---------------------------------------------------------------------------
// NextAuth configuration
// ---------------------------------------------------------------------------
const config: NextAuthConfig = {
  session: { strategy: 'jwt' },
  trustHost: true,

  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const email = parsed.data.email.toLowerCase().trim()
        await ensureSystemAccount(email)

        // These passwords are published in the repo's old seed file; never accept them
        if (PUBLISHED_SEED_PASSWORDS.includes(parsed.data.password)) return null

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user?.passwordHash) return null
        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        // Admin access only for the configured ADMIN_EMAIL, whatever the stored role says
        const role: UserRole = user.role === 'ADMIN' && isAdminEmail(email) ? 'ADMIN' : 'INVESTOR'

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role as UserRole
        token.emailVerified = user.emailVerified
        token.twoFactorEnabled = user.twoFactorEnabled
        token.authAt = Date.now()
        return token
      }
      if (!token.id) return token
      // Keep the session up to date with the account (a new name shows at once), and
      // end it if the account is gone or its password changed after this sign-in
      const fresh = await sessionAccount(token.id as string)
      if (fresh === null) return null
      if (fresh) {
        const signedInAt = Number(token.authAt) || Number(token.iat || 0) * 1000
        if (fresh.passwordChangedAt && fresh.passwordChangedAt.getTime() > signedInAt) return null
        token.name = fresh.name
        token.role = fresh.role === 'ADMIN' && isAdminEmail(fresh.email) ? 'ADMIN' : 'INVESTOR'
        token.emailVerified = fresh.emailVerified
        token.twoFactorEnabled = fresh.twoFactorEnabled
      }
      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) || session.user.id
        session.user.role = (token.role as UserRole) || 'INVESTOR'
        session.user.emailVerified = (token.emailVerified as Date | null) || null
        session.user.twoFactorEnabled = (token.twoFactorEnabled as boolean) || false
      }
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)
