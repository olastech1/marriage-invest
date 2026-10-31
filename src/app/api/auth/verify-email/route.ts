import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createAuthToken, sentRecently, consumeAuthToken } from '@/lib/authTokens'
import { sendVerificationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// POST /api/auth/verify-email { token }    confirm the email from the link
// POST /api/auth/verify-email { resend }   send me a new link (signed in)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  if (body.resend) {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } })
    if (!user) return NextResponse.json({ success: false, error: 'Account not found.' }, { status: 404 })
    if (user.emailVerified) return NextResponse.json({ success: true, message: 'Your email is already verified.' })
    if (await sentRecently(userId, 'verify_email', 60_000)) {
      return NextResponse.json({ success: false, error: 'We just sent a link. Check your inbox (and spam), or try again in a minute.' }, { status: 429 })
    }
    const token = await createAuthToken(userId, 'verify_email', 24 * 60 * 60 * 1000)
    const sent = await sendVerificationEmail(user.email, token).catch(() => false)
    return NextResponse.json({ success: true, message: sent ? `We sent a link to ${user.email}.` : 'The email could not be sent. Try again later.' })
  }

  const userId = await consumeAuthToken(String(body.token || ''), 'verify_email')
  if (!userId) {
    return NextResponse.json({ success: false, error: 'This link has expired or was already used. Send a new one from your dashboard.' }, { status: 400 })
  }
  await prisma.user.update({ where: { id: userId }, data: { emailVerified: new Date() } })
  return NextResponse.json({ success: true, message: 'Your email is verified.' })
}
