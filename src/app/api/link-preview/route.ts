import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getLinkPreview } from '@/lib/linkPreview'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// GET /api/link-preview?url=...  preview card for a link in a chat message
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })

  const url = req.nextUrl.searchParams.get('url') || ''
  const preview = await getLinkPreview(url, req.headers.get('host')).catch((err) => {
    console.error('[link-preview]', err)
    return null
  })
  return NextResponse.json({ success: true, preview })
}
