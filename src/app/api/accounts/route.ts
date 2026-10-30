import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decode } from 'next-auth/jwt'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Several accounts on one device.
// Each other signed-in account keeps its own sign-in (the same encrypted,
// http-only session token Auth.js issues) in a "uv-account.<userId>" cookie.
// Switching swaps that token with the active one, so no password is needed.
//
// GET  /api/accounts                                 accounts on this device
// POST /api/accounts { action: 'add' }               keep this account, then sign in to another
// POST /api/accounts { action: 'switch', userId }    switch to a kept account
// POST /api/accounts { action: 'remove', userId }    forget a kept account
// POST /api/accounts { action: 'signout-all' }       forget every kept account
// ---------------------------------------------------------------------------

const KEPT = 'uv-account.'
/** Accounts on one device, including the active one */
const MAX_ACCOUNTS = 5

const sessionCookieName = (req: NextRequest) => `${req.nextUrl.protocol === 'https:' ? '__Secure-' : ''}authjs.session-token`
const secret = () => process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || ''

type Store = Awaited<ReturnType<typeof cookies>>

/** The active session token (Auth.js splits big ones into .0, .1, … chunks) */
function activeToken(store: Store, name: string): string {
  const whole = store.get(name)?.value
  if (whole) return whole
  const chunks: string[] = []
  for (let i = 0; store.get(`${name}.${i}`); i++) chunks.push(store.get(`${name}.${i}`)!.value)
  return chunks.join('')
}

/** Who a session token belongs to, if it is still valid */
async function tokenOwner(token: string, salt: string): Promise<{ id: string; exp: number } | null> {
  if (!token || !secret()) return null
  const payload = await decode({ token, secret: secret(), salt }).catch(() => null)
  const id = (payload?.id as string) || payload?.sub
  const exp = Number(payload?.exp || 0)
  if (!id || exp * 1000 <= Date.now()) return null
  return { id, exp }
}

function setCookie(res: NextResponse, req: NextRequest, name: string, value: string, exp: number) {
  res.cookies.set(name, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: Math.max(0, exp - Math.floor(Date.now() / 1000)),
  })
}

/** Cleared with the same settings it was set with (browsers ignore it otherwise for __Secure- cookies) */
const clearCookie = (res: NextResponse, req: NextRequest, name: string) => setCookie(res, req, name, '', 0)

/** Kept accounts that are still signed in (expired ones are dropped) */
async function keptAccounts(store: Store, salt: string) {
  const kept: { id: string; exp: number; token: string; cookie: string }[] = []
  const expired: string[] = []
  for (const c of store.getAll()) {
    if (!c.name.startsWith(KEPT)) continue
    const owner = await tokenOwner(c.value, salt)
    if (owner && owner.id === c.name.slice(KEPT.length)) kept.push({ ...owner, token: c.value, cookie: c.name })
    else expired.push(c.name)
  }
  return { kept, expired }
}

export async function GET(req: NextRequest) {
  const store = await cookies()
  const salt = sessionCookieName(req)
  const session = await auth()
  const me = session?.user?.id || ''
  const { kept, expired } = await keptAccounts(store, salt)

  const others = kept.filter((k) => k.id !== me)
  const users = await prisma.user.findMany({
    where: { id: { in: others.map((k) => k.id) } },
    select: { id: true, name: true, email: true, avatarUrl: true, accountNumber: true },
  })
  const res = NextResponse.json({
    success: true,
    current: me || null,
    accounts: others
      .map((k) => users.find((u) => u.id === k.id))
      .filter((u): u is (typeof users)[number] => !!u),
  })
  for (const name of expired) clearCookie(res, req, name)
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
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')
  const current = await tokenOwner(activeToken(store, salt), salt)

  if (action === 'add') {
    if (!current) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })
    const { kept } = await keptAccounts(store, salt)
    if (kept.filter((k) => k.id !== current.id).length >= MAX_ACCOUNTS - 1) {
      return NextResponse.json({ success: false, error: `You can keep up to ${MAX_ACCOUNTS} accounts on this device. Remove one first.` }, { status: 400 })
    }
    const res = NextResponse.json({ success: true, next: '/login?addAccount=1' })
    setCookie(res, req, `${KEPT}${current.id}`, activeToken(store, salt), current.exp)
    return res
  }

  if (action === 'switch') {
    const userId = String(body.userId || '')
    const keptToken = store.get(`${KEPT}${userId}`)?.value || ''
    const target = await tokenOwner(keptToken, salt)
    if (!target || target.id !== userId) {
      const res = NextResponse.json({ success: false, error: 'That account was signed out. Sign in to it again.' }, { status: 404 })
      clearCookie(res, req, `${KEPT}${userId}`)
      return res
    }
    const res = NextResponse.json({ success: true })
    // Keep the account I'm leaving, then make the chosen one active
    if (current && current.id !== userId) setCookie(res, req, `${KEPT}${current.id}`, activeToken(store, salt), current.exp)
    for (const c of store.getAll()) if (c.name.startsWith(`${salt}.`)) clearCookie(res, req, c.name)
    setCookie(res, req, salt, keptToken, target.exp)
    clearCookie(res, req, `${KEPT}${userId}`)
    return res
  }

  if (action === 'remove') {
    const res = NextResponse.json({ success: true })
    clearCookie(res, req, `${KEPT}${String(body.userId || '').replace(/[^a-zA-Z0-9_-]/g, '')}`)
    return res
  }

  if (action === 'signout-all') {
    const res = NextResponse.json({ success: true })
    for (const c of store.getAll()) if (c.name.startsWith(KEPT)) clearCookie(res, req, c.name)
    return res
  }

  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
}
