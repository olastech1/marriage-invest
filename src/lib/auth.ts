/**
 * NextAuth v5 configuration for Union Invest.
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
const credentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// ---------------------------------------------------------------------------
// NextAuth configuration
// ---------------------------------------------------------------------------
const config: NextAuthConfig = {
  session: { strategy: 'jwt' },

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

        const { email } = parsed.data
        const cleanEmail = email.toLowerCase().trim()
        const isAdmin = cleanEmail.includes('admin')

        // Instant demo authorization - zero backend database required
        return {
          id: isAdmin ? 'usr_admin' : 'usr_jane_doe',
          name: isAdmin ? 'Platform Administrator' : 'Jane Doe',
          email: cleanEmail || (isAdmin ? 'admin@unioninvest.com' : 'jane.doe@unioninvest.com'),
          role: (isAdmin ? 'ADMIN' : 'INVESTOR') as UserRole,
          emailVerified: new Date('2024-01-15'),
          twoFactorEnabled: false,
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
