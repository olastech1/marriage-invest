import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createAuthToken, sentRecently } from '@/lib/authTokens'
import { sendPasswordResetEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// POST /api/auth/forgot-password { email }  email a reset link (valid 1 hour)
// The answer is the same whether or not the email has an account.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = String(body.email || '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ success: false, error: 'Enter a valid email address.' }, { status: 400 })
  }
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (user && !(await sentRecently(user.id, 'reset_password', 60_000))) {
    const token = await createAuthToken(user.id, 'reset_password', 60 * 60 * 1000)
    await sendPasswordResetEmail(email, token).catch((err) => console.error('[forgot-password] email failed', err))
  }
  return NextResponse.json({
    success: true,
    message: 'If an account uses that email, we sent a link to reset the password. It works for 1 hour.',
  })
}
