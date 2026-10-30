import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { SITE_URL } from '@/lib/site'

const MEMBER_AREA = [
  '/dashboard',
  '/chat',
  '/save',
  '/savings',
  '/deposits',
  '/portfolio',
  '/transactions',
  '/withdrawals',
  '/my-documents',
  '/settings',
  '/certificate',
  '/solo',
  '/payment',
]

export async function proxy(request: NextRequest) {
  // One address for the site: pages on the Vercel production address move to the real domain
  // (API routes stay reachable there, e.g. payment webhooks)
  const host = (request.headers.get('host') || request.nextUrl.hostname).split(':')[0].toLowerCase()
  if (process.env.VERCEL_ENV === 'production' && host.endsWith('.vercel.app')) {
    return NextResponse.redirect(new URL(request.nextUrl.pathname + request.nextUrl.search, SITE_URL), 308)
  }

  // Signed-in member area: redirect to login when there is no session
  const path = request.nextUrl.pathname
  if (!MEMBER_AREA.some((p) => path === p || path.startsWith(`${p}/`))) return NextResponse.next()
  const session = await auth()
  if (session?.user?.id) return NextResponse.next()

  const login = new URL('/login', request.url)
  login.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.redirect(login)
}

export const config = {
  // Every page (not API routes, Next.js assets or files)
  matcher: ['/((?!api/|_next/|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)'],
}
