import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isParticipant } from '@/lib/chat'
import { imageType } from '@/lib/imageType'
import { partLength, videoType } from '@/lib/chatMedia'
import { canSeePostMedia } from '@/lib/posts'
import { canSeeChatMedia } from '@/lib/chatUnlock'

export const dynamic = 'force-dynamic'

const json = (status: number, error: string) => NextResponse.json({ success: false, error }, { status })

// ---------------------------------------------------------------------------
// PUT /api/chat/media/[id]?part=n  (raw bytes)  one piece of my upload
// ---------------------------------------------------------------------------
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return json(401, 'Please sign in.')
  const { id } = await params

  const media = await prisma.chatMedia.findUnique({ where: { id } })
  if (!media || media.ownerId !== me) return json(404, 'Upload not found.')
  if (media.complete) return json(409, 'This file was already sent.')

  const index = Number(new URL(req.url).searchParams.get('part'))
  if (!Number.isInteger(index) || index < 0 || index >= media.partCount) return json(400, 'Wrong piece number.')
  const bytes = new Uint8Array(await req.arrayBuffer())
  if (bytes.length !== partLength(media.size, index, media.partSize)) return json(400, 'That piece is the wrong size. Try again.')

  // The first piece shows what the file really is
  if (index === 0) {
    const mimeType = media.kind === 'video' ? videoType(bytes) : imageType(bytes)
    if (!mimeType) {
      await prisma.chatMediaPart.deleteMany({ where: { mediaId: id } })
      await prisma.chatMedia.delete({ where: { id } })
      return json(415, media.kind === 'video' ? 'Send an MP4, MOV or WebM video.' : 'Send a JPG, PNG or WebP photo.')
    }
    await prisma.chatMedia.update({ where: { id }, data: { mimeType } })
  }

  await prisma.chatMediaPart.upsert({
    where: { mediaId_index: { mediaId: id, index } },
    update: { data: bytes },
    create: { mediaId: id, index, data: bytes },
  })
  return NextResponse.json({ success: true })
}

// ---------------------------------------------------------------------------
// GET /api/chat/media/[id]  the photo or video: for the two people in the chat,
// (a locked one once paid for), or, on a profile post, for anyone who can see the
// post (free, mine, or paid for).
// Videos are served in byte ranges (one stored piece per response), which is
// how browsers play and seek them anyway.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const me = session?.user?.id || ''
  const { id } = await params

  const media = await prisma.chatMedia.findUnique({ where: { id } })
  const allowed =
    !!media?.complete &&
    (media.threadId.startsWith('post:')
      ? await canSeePostMedia(id, me)
      : !!me && isParticipant(media.threadId, me) && (await canSeeChatMedia(id, media.threadId, me)))
  if (!media || !allowed) return new Response('Not found', { status: 404 })

  const headers: Record<string, string> = {
    'Content-Type': media.mimeType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    // Shown on the page, not downloaded; not for search engines or AI training
    'Content-Disposition': 'inline',
    'X-Robots-Tag': 'noindex, noai, noimageai',
    'Content-Security-Policy': "default-src 'none'",
  }
  const part = (index: number) =>
    prisma.chatMediaPart.findUnique({ where: { mediaId_index: { mediaId: id, index } } }).then((p) => (p ? Buffer.from(p.data) : null))

  const range = req.headers.get('range')?.match(/^bytes=(\d*)-(\d*)$/)
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, media.size - Number(range[2]))
    let end = range[1] && range[2] ? Number(range[2]) : media.size - 1
    if (start >= media.size || start > end) {
      return new Response(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${media.size}` } })
    }
    // Answer with no more than the stored piece the range starts in
    const index = Math.floor(start / media.partSize)
    end = Math.min(end, media.size - 1, (index + 1) * media.partSize - 1)
    const data = await part(index)
    if (!data) return new Response('Not found', { status: 404 })
    const offset = index * media.partSize
    const slice = data.subarray(start - offset, end - offset + 1)
    return new Response(new Uint8Array(slice), {
      status: 206,
      headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${media.size}`, 'Content-Length': String(slice.length) },
    })
  }

  // The whole file, a piece at a time
  let next = 0
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const data = next < media.partCount ? await part(next++) : null
      if (data) controller.enqueue(new Uint8Array(data))
      else controller.close()
    },
  })
  return new Response(stream, { headers: { ...headers, 'Content-Length': String(media.size) } })
}
