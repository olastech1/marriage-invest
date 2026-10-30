import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 1024 * 1024

/** The image type from its first bytes (never trust the browser's label) */
function imageType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  return null
}

// ---------------------------------------------------------------------------
// POST /api/user/avatar  (form field "photo")  set my profile photo
// DELETE /api/user/avatar                       remove it
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })

  const form = await req.formData().catch(() => null)
  const file = form?.get('photo')
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ success: false, error: 'Choose a photo to upload.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ success: false, error: 'That photo is too large. Try a smaller one.' }, { status: 413 })
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  const mimeType = imageType(bytes)
  if (!mimeType) {
    return NextResponse.json({ success: false, error: 'Use a JPG, PNG or WebP photo.' }, { status: 415 })
  }

  await prisma.avatar.upsert({
    where: { userId: me },
    update: { data: bytes, mimeType },
    create: { userId: me, data: bytes, mimeType },
  })
  // A new address each time, so every screen shows the new photo straight away
  const avatarUrl = `/api/avatar/${encodeURIComponent(me)}?v=${Date.now()}`
  await prisma.user.update({ where: { id: me }, data: { avatarUrl } })
  return NextResponse.json({ success: true, avatarUrl })
}

export async function DELETE() {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })
  await prisma.avatar.deleteMany({ where: { userId: me } })
  await prisma.user.update({ where: { id: me }, data: { avatarUrl: null } })
  return NextResponse.json({ success: true, avatarUrl: null })
}
