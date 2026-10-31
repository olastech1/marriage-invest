/**
 * Sessions outside the sign-in form: a fresh session for one account (switching
 * accounts on a device, or staying signed in after changing the password), and
 * what changing a password does to every other sign-in.
 */

import crypto from 'crypto'
import type { NextRequest, NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'
import type { User } from '@prisma/client'
import { prisma } from '@/lib/db'
import { isAdminEmail } from '@/lib/accounts'
import { forgetSessionAccount } from '@/lib/auth'

const SESSION_DAYS = 30

/** The device's secret cookie, and the hash device_accounts stores for it */
export const DEVICE_COOKIE = 'uv-device'
export const deviceHash = (value: string) => crypto.createHash('sha256').update(`uv-device:${value}`).digest('hex')

export const sessionCookieName = (req: NextRequest) => `${req.nextUrl.protocol === 'https:' ? '__Secure-' : ''}authjs.session-token`
const secret = () => process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || ''

/** The claims the jwt callback in lib/auth puts in a session */
export function sessionClaims(user: Pick<User, 'id' | 'name' | 'email' | 'role' | 'emailVerified' | 'twoFactorEnabled'>) {
  return {
    sub: user.id,
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === 'ADMIN' && isAdminEmail(user.email) ? 'ADMIN' : 'INVESTOR',
    emailVerified: user.emailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    // When this sign-in happened (a password change after it ends the session)
    authAt: Date.now(),
  }
}

/** Make `user` the signed-in account in this browser (replaces any session cookie) */
export async function startSession(req: NextRequest, res: NextResponse, user: Parameters<typeof sessionClaims>[0]) {
  const salt = sessionCookieName(req)
  const maxAge = SESSION_DAYS * 24 * 3600
  const token = await encode({ secret: secret(), salt, maxAge, token: sessionClaims(user) })
  const secure = req.nextUrl.protocol === 'https:'
  // Auth.js splits big sessions into .0, .1… cookies: clear those so only this one counts
  for (const c of req.cookies.getAll()) {
    if (c.name.startsWith(`${salt}.`)) res.cookies.set(c.name, '', { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 0 })
  }
  res.cookies.set(salt, token, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge })
}

/**
 * The password changed: every session from before now stops working (see the jwt
 * callback), and the account comes off every device's account list, so it needs
 * the new password everywhere.
 */
export async function passwordChanged(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { passwordChangedAt: new Date() } })
  forgetSessionAccount(userId)
  await prisma.deviceAccount.deleteMany({ where: { userId } })
}
