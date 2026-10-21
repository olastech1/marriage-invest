import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

// Signed-in member area: redirect to login when there is no session
export async function proxy(request: NextRequest) {
  const session = await auth()
  if (session?.user?.id) return NextResponse.next()

  const login = new URL('/login', request.url)
  login.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/chat/:path*',
    '/save/:path*',
    '/savings/:path*',
    '/deposits/:path*',
    '/portfolio/:path*',
    '/transactions/:path*',
    '/withdrawals/:path*',
    '/my-documents/:path*',
    '/settings/:path*',
    '/certificate/:path*',
    '/quests/:path*',
    '/solo/:path*',
    '/friends/:path*',
  ],
}
