import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decode } from 'next-auth/jwt'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DEVICE_COOKIE as DEVICE, deviceHash as hash, sessionCookieName, startSession } from '@/lib/sessions'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Several accounts on one device, as many as you like.
// The device has a secret, http-only "uv-device" cookie; the accounts signed in
// on it are listed in device_accounts (by a hash of that secret). Every account
// that signs in on the device is added. Switching starts a fresh session for the
// chosen account, so no password is needed and nothing expires while in use;
// an account unused for 6 months drops off.
//
// GET  /api/accounts                                 accounts on this device (+ unread chats)
// POST /api/accounts { action: 'add' }               go sign in to another account
// POST /api/accounts { action: 'switch', userId }    switch to an account on this device
// POST /api/accounts { action: 'remove', userId }    take an account off this device
// POST /api/accounts { action: 'signout' }           take the current account off, then sign out
// POST /api/accounts { action: 'signout-all' }       take every account off this device
// ---------------------------------------------------------------------------

/** Kept-session cookies from the earlier version (moved into device_accounts) */
const OLD_KEPT = 'uv-account.'
const FORGET_AFTER_DAYS = 180

const secret = () => process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || ''

type Store = Awaited<ReturnType<typeof cookies>>

function setCookie(res: NextResponse, req: NextRequest, name: string, value: string, maxAge: number) {
  res.cookies.set(name, value, { httpOnly: true, sameSite: 'lax', secure: req.nextUrl.protocol === 'https:', path: '/', maxAge: Math.max(0, maxAge) })
}
/** Cleared with the same settings it was set with (browsers ignore it otherwise for __Secure- cookies) */
const clearCookie = (res: NextResponse, req: NextRequest, name: string) => setCookie(res, req, name, '', 0)

/** This device's id (hashed), making one if it has none yet */
function device(store: Store): { hash: string; fresh: string | null } {
  const existing = store.get(DEVICE)?.value
  if (existing && existing.length >= 32) return { hash: hash(existing), fresh: null }
  const fresh = crypto.randomBytes(32).toString('base64url')
  return { hash: hash(fresh), fresh }
}
const keepDevice = (res: NextResponse, req: NextRequest, d: { fresh: string | null }) => {
  if (d.fresh) setCookie(res, req, DEVICE, d.fresh, 400 * 24 * 3600)
}

async function link(deviceHash: string, userId: string) {
  await prisma.deviceAccount.upsert({
    where: { deviceHash_userId: { deviceHash, userId } },
    update: { lastUsedAt: new Date() },
    create: { deviceHash, userId },
  })
}

/** Accounts kept by the earlier version (one cookie each): add them to this device */
async function moveOldKept(store: Store, salt: string, deviceHash: string) {
  const names: string[] = []
  for (const c of store.getAll()) {
    if (!c.name.startsWith(OLD_KEPT)) continue
    names.push(c.name)
    const payload = await decode({ token: c.value, secret: secret(), salt }).catch(() => null)
    const id = (payload?.id as string) || payload?.sub
    if (id && id === c.name.slice(OLD_KEPT.length) && Number(payload?.exp || 0) * 1000 > Date.now()) await link(deviceHash, id).catch(() => {})
  }
  return names
}

export async function GET(req: NextRequest) {
  const store = await cookies()
  const salt = sessionCookieName(req)
  const d = device(store)
  const session = await auth()
  const me = session?.user?.id || ''

  const oldCookies = await moveOldKept(store, salt, d.hash)
  if (me) await link(d.hash, me)
  await prisma.deviceAccount.deleteMany({ where: { deviceHash: d.hash, lastUsedAt: { lt: new Date(Date.now() - FORGET_AFTER_DAYS * 86400_000) } } })

  const rows = await prisma.deviceAccount.findMany({ where: { deviceHash: d.hash }, orderBy: { lastUsedAt: 'desc' } })
  const ids = rows.map((r) => r.userId)
  const [users, unread] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true, avatarUrl: true, accountNumber: true } }),
    prisma.chatMessage.groupBy({ by: ['recipientId'], where: { recipientId: { in: ids }, read: false }, _count: true }),
  ])
  const unreadOf = new Map(unread.map((u) => [u.recipientId, u._count]))

  const res = NextResponse.json({
    success: true,
    current: me || null,
    currentUnread: me ? unreadOf.get(me) || 0 : 0,
    accounts: ids
      .filter((id) => id !== me)
      .map((id) => users.find((u) => u.id === id))
      .filter((u): u is (typeof users)[number] => !!u)
      .map((u) => ({ ...u, unread: unreadOf.get(u.id) || 0 })),
  })
  keepDevice(res, req, d)
  for (const name of oldCookies) clearCookie(res, req, name)
  return res
}

export async function POST(req: NextRequest) {
  // Only from our own pages
  const origin = req.headers.get('origin')
  if (origin && new URL(origin).host !== req.nextUrl.host) {
    return NextResponse.json({ success: false, error: 'Not allowed.' }, { status: 403 })
  }

  const store = await cookies()
  const salt = sessionCookieName(req)
  const d = device(store)
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')
  const session = await auth()
  const me = session?.user?.id || ''

  if (action === 'add') {
    if (!me) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })
    await link(d.hash, me)
    const res = NextResponse.json({ success: true, next: '/login?addAccount=1' })
    keepDevice(res, req, d)
    return res
  }

  if (action === 'switch') {
    const userId = String(body.userId || '')
    const row = d.fresh ? null : await prisma.deviceAccount.findUnique({ where: { deviceHash_userId: { deviceHash: d.hash, userId } } })
    const user = row ? await prisma.user.findUnique({ where: { id: userId } }) : null
    if (!row || !user) {
      if (row) await prisma.deviceAccount.delete({ where: { deviceHash_userId: { deviceHash: d.hash, userId } } }).catch(() => {})
      return NextResponse.json({ success: false, error: 'That account is no longer on this device. Sign in to it again.' }, { status: 404 })
    }
    if (me) await link(d.hash, me)
    await link(d.hash, userId)

    // A fresh session for the chosen account, the same as signing in
    const res = NextResponse.json({ success: true })
    await startSession(req, res, user)
    return res
  }

  if (action === 'remove' || action === 'signout') {
    const userId = action === 'signout' ? me : String(body.userId || '')
    if (userId) await prisma.deviceAccount.deleteMany({ where: { deviceHash: d.hash, userId } })
    const res = NextResponse.json({ success: true })
    // Signing out ends the session here too, so nothing can add it back before the sign-out finishes
    if (action === 'signout') for (const c of store.getAll()) if (c.name === salt || c.name.startsWith(`${salt}.`)) clearCookie(res, req, c.name)
    return res
  }

  if (action === 'signout-all') {
    await prisma.deviceAccount.deleteMany({ where: { deviceHash: d.hash } })
    const res = NextResponse.json({ success: true })
    clearCookie(res, req, DEVICE)
    for (const c of store.getAll()) if (c.name.startsWith(OLD_KEPT)) clearCookie(res, req, c.name)
    return res
  }

  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
}
