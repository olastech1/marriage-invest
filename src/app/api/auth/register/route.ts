/**
 * POST /api/auth/register
 *
 * Creates a new user account:
 * 1. Validates request body with Zod
 * 2. Checks for existing email
 * 3. Hashes password with bcryptjs
 * 4. Creates User record in Prisma
 * 5. Generates verification token and sends verification email
 * 6. Returns 201
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { buildThreadId } from '@/lib/chat'
import { ensureAccountNumber } from '@/lib/accountId'
import { linkPartners } from '@/lib/partners'
import { createAuthToken } from '@/lib/authTokens'
import { sendVerificationEmail } from '@/lib/email'
import { recordInvitation, welcomeInvitedMember } from '@/lib/invitations'

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(80, 'Full name is too long'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  phone: z
    .string()
    .min(7, 'Please enter a valid phone number')
    .max(25, 'Phone number is too long')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Validation failed'
      return NextResponse.json({ error: firstError }, { status: 422 })
    }

    const { name, email, phone, password } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()

    // Duplicate email check
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in.' },
        { status: 409 },
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user record
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone ? phone.trim() : null,
        passwordHash: hashedPassword,
        role: 'INVESTOR',
        emailVerified: null,
        twoFactorEnabled: false,
      },
      select: { id: true, name: true, email: true },
    })
    // Their account ID, so other members can find them
    await ensureAccountNumber(user.id).catch(() => '')
    // Ask them to confirm their email
    await createAuthToken(user.id, 'verify_email', 24 * 60 * 60 * 1000)
      .then((token) => sendVerificationEmail(user.email, token))
      .catch((err) => console.error('[register] verification email failed', err))

    // Messages sent as a visitor with this email move into the new account
    const guestId = `guest_${normalizedEmail.replace(/[^a-z0-9]/g, '_')}`
    const guestMessages = await prisma.chatMessage.findMany({
      where: { OR: [{ senderId: guestId }, { recipientId: guestId }] },
    })
    for (const m of guestMessages) {
      const senderId = m.senderId === guestId ? user.id : m.senderId
      const recipientId = m.recipientId === guestId ? user.id : m.recipientId
      await prisma.chatMessage.update({
        where: { id: m.id },
        data: { senderId, recipientId, threadId: buildThreadId(senderId, recipientId || senderId) },
      })
    }

    // Came from a member's invite link: count it as their invite
    const inviteCode = String((body as { invite?: unknown })?.invite ?? '')
    if (/^\d{8}$/.test(inviteCode)) {
      const inviter = await prisma.user.findFirst({ where: { accountNumber: inviteCode }, select: { id: true } })
      if (inviter && inviter.id !== user.id) await recordInvitation(inviter.id, normalizedEmail)
    }

    // Invited by email: show up in the inviter's chats
    await welcomeInvitedMember(user).catch((err) => console.error('[register] invitations failed', err))

    // If a partner already registered your union with this email, link the two accounts
    const invitedBy = await prisma.marriageRegistration.findFirst({
      where: { partner2Email: normalizedEmail },
      orderBy: { createdAt: 'desc' },
      select: { userId: true },
    })
    if (invitedBy && invitedBy.userId !== user.id) {
      await linkPartners(invitedBy.userId, user.id, 'spouse').catch((err) => console.error('[register] partner link failed', err))
    }

    return NextResponse.json(
      {
        message: 'Account created. You can sign in now.',
        userId: user.id,
      },
      { status: 201 },
    )
  } catch (err: unknown) {
    console.error('[POST /api/auth/register]', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 },
    )
  }
}
