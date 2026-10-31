import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { consumeAuthToken } from '@/lib/authTokens'

export const dynamic = 'force-dynamic'

// Same rules as sign-up
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

// POST /api/auth/reset-password { token, password }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const parsed = password.safeParse(body.password)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 })
  }
  const userId = await consumeAuthToken(String(body.token || ''), 'reset_password')
  if (!userId) {
    return NextResponse.json({ success: false, error: 'This reset link has expired or was already used. Ask for a new one.' }, { status: 400 })
  }
  await prisma.user.update({
    where: { id: userId },
    // Opening the link proves they own the email
    data: { passwordHash: await bcrypt.hash(parsed.data, 12), emailVerified: new Date() },
  })
  await prisma.authToken.deleteMany({ where: { userId, kind: 'reset_password', usedAt: null } })
  await prisma.auditLog.create({ data: { userId, action: 'PASSWORD_RESET', entity: 'User', entityId: userId } }).catch(() => {})
  return NextResponse.json({ success: true, message: 'Password changed. You can sign in now.' })
}
