import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { buildThreadId } from '@/lib/chat'
import { postThread } from '@/lib/posts'
import { DAILY_MEDIA_BYTES, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, MEDIA_PART_SIZE } from '@/lib/chatMedia'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// POST /api/chat/media  { recipientId | forPost: true, kind: image|video, size, width?, height? }
// Start an upload. The browser then sends each piece to PUT /api/chat/media/[id]?part=n
// and finally posts the chat message (or the profile post) with the returned mediaId.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const forPost = body.forPost === true
  const recipientId = String(body.recipientId || '')
  const kind = body.kind === 'video' ? 'video' : body.kind === 'image' ? 'image' : null
  const size = Math.floor(Number(body.size))
  const dim = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.min(Math.round(Number(v)), 20000) : null)

  if (!forPost && (!recipientId || recipientId === me)) return NextResponse.json({ success: false, error: 'Open a chat first.' }, { status: 400 })
  if (!forPost && recipientId.startsWith('guest_')) {
    return NextResponse.json({ success: false, error: "Visitors without an account can't see photos or videos." }, { status: 400 })
  }
  if (!kind) return NextResponse.json({ success: false, error: 'Send a photo or a video.' }, { status: 400 })
  const max = kind === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (!(size > 0)) return NextResponse.json({ success: false, error: 'That file is empty.' }, { status: 400 })
  if (size > max) {
    return NextResponse.json(
      { success: false, error: kind === 'video' ? 'That video is too large. Send one up to 25 MB (about a minute).' : 'That photo is too large.' },
      { status: 413 },
    )
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  // Uploads that were started but never finished: clear them out
  const stale = await prisma.chatMedia.findMany({ where: { ownerId: me, complete: false, createdAt: { lt: dayAgo } }, select: { id: true } })
  if (stale.length) {
    const ids = stale.map((s) => s.id)
    await prisma.chatMediaPart.deleteMany({ where: { mediaId: { in: ids } } })
    await prisma.chatMedia.deleteMany({ where: { id: { in: ids } } })
  }
  const used = await prisma.chatMedia.aggregate({ where: { ownerId: me, createdAt: { gte: dayAgo } }, _sum: { size: true } })
  if ((used._sum.size || 0) + size > DAILY_MEDIA_BYTES) {
    return NextResponse.json({ success: false, error: "You've sent a lot of photos and videos today. Try again tomorrow." }, { status: 429 })
  }

  const media = await prisma.chatMedia.create({
    data: {
      ownerId: me,
      threadId: forPost ? postThread(me) : buildThreadId(me, recipientId),
      kind,
      mimeType: '',
      size,
      partSize: MEDIA_PART_SIZE,
      partCount: Math.ceil(size / MEDIA_PART_SIZE),
      width: dim(body.width),
      height: dim(body.height),
    },
  })
  return NextResponse.json({ success: true, mediaId: media.id, partSize: media.partSize, partCount: media.partCount })
}
