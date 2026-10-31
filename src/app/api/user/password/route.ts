import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DEVICE_COOKIE, deviceHash, passwordChanged, startSession } from '@/lib/sessions'

export const dynamic = 'force-dynamic'

// Same rules as sign-up
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

// ---------------------------------------------------------------------------
// POST /api/user/password { current, next }  change my password.
// Every other sign-in ends and the account comes off every device's list (it
// needs the new password there); this browser stays signed in.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })
  const body = await req.json().catch(() => ({}))

  const user = await prisma.user.findUnique({ where: { id: me } })
  if (!user) return NextResponse.json({ success: false, error: 'Account not found.' }, { status: 404 })
  // A few wrong tries per quarter hour
  const recentFails = await prisma.auditLog.count({
    where: { userId: me, action: 'PASSWORD_CHANGE_FAILED', createdAt: { gte: new Date(Date.now() - 15 * 60_000) } },
  })
  if (recentFails >= 5) return NextResponse.json({ success: false, error: 'Too many tries. Wait 15 minutes, or use "Forgot password".' }, { status: 429 })
  if (!(await bcrypt.compare(String(body.current || ''), user.passwordHash))) {
    await prisma.auditLog.create({ data: { userId: me, action: 'PASSWORD_CHANGE_FAILED', entity: 'User', entityId: me } }).catch(() => {})
    return NextResponse.json({ success: false, error: 'Your current password is not right.' }, { status: 400 })
  }
  const parsed = password.safeParse(body.next)
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 })
  if (await bcrypt.compare(parsed.data, user.passwordHash)) {
    return NextResponse.json({ success: false, error: 'Pick a password different from the current one.' }, { status: 400 })
  }

  await prisma.user.update({ where: { id: me }, data: { passwordHash: await bcrypt.hash(parsed.data, 12) } })
  await passwordChanged(me)
  await prisma.auditLog.create({ data: { userId: me, action: 'PASSWORD_CHANGED', entity: 'User', entityId: me } }).catch(() => {})

  // Stay signed in here (a fresh session, made after the change), and keep this account on this device
  const res = NextResponse.json({ success: true, message: 'Password changed. You were signed out on your other devices.' })
  await startSession(req, res, user)
  const device = (await cookies()).get(DEVICE_COOKIE)?.value
  if (device) await prisma.deviceAccount.create({ data: { deviceHash: deviceHash(device), userId: me } }).catch(() => {})
  return res
}
