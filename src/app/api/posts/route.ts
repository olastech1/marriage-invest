import { NextRequest, NextResponse, after } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { MAX_POST_PRICE, MIN_POST_PRICE, postThread } from '@/lib/posts'
import { tellAboutPost } from '@/lib/postEmails'

export const dynamic = 'force-dynamic'
// Time to email partners and visitors after a post
export const maxDuration = 60

// ---------------------------------------------------------------------------
// GET /api/posts?userId=<id>  a member's posts, pinned first. Anyone can look;
// the photo/video address is only given for posts this viewer can see.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || ''
  if (!userId) return NextResponse.json({ success: false, error: 'Missing member.' }, { status: 400 })
  const session = await auth()
  const me = session?.user?.id || ''
  const mine = me === userId

  const posts = await prisma.profilePost.findMany({
    where: { authorId: userId },
    orderBy: [{ pinnedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    take: 100,
  })
  const ids = posts.map((p) => p.id)
  const [unlocked, counts] = await Promise.all([
    me && !mine ? prisma.postUnlock.findMany({ where: { buyerId: me, postId: { in: ids } }, select: { postId: true } }) : [],
    mine ? prisma.postUnlock.groupBy({ by: ['postId'], where: { postId: { in: ids } }, _count: true, _sum: { amount: true } }) : [],
  ])
  const paid = new Set(unlocked.map((u) => u.postId))
  const stats = new Map(counts.map((c) => [c.postId, { unlocks: c._count, earned: Number(c._sum.amount ?? 0) }]))

  return NextResponse.json({
    success: true,
    mine,
    signedIn: !!me,
    posts: posts.map((p) => {
      const price = p.price ? Number(p.price) : null
      const locked = !!price && !mine && !paid.has(p.id)
      return {
        id: p.id,
        caption: p.caption,
        mediaKind: p.mediaKind,
        width: p.width,
        height: p.height,
        mediaUrl: p.mediaId && !locked ? `/api/chat/media/${p.mediaId}` : null,
        preview: locked ? p.preview : null,
        price,
        locked,
        unlocked: paid.has(p.id),
        pinned: !!p.pinnedAt,
        createdAt: p.createdAt,
        ...(mine ? { stats: stats.get(p.id) || { unlocks: 0, earned: 0 } } : {}),
      }
    }),
  })
}

// ---------------------------------------------------------------------------
// POST /api/posts  { caption, mediaId?, price?, preview? }  post to my profile
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const caption = String(body.caption || '').trim().slice(0, 2000)
  const mediaId = typeof body.mediaId === 'string' && body.mediaId ? body.mediaId : null
  const rawPrice = body.price === null || body.price === undefined || body.price === '' ? null : Math.round(Number(body.price) * 100) / 100
  // A tiny blurred JPEG made on the phone, shown on locked posts
  const preview = typeof body.preview === 'string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(body.preview) && body.preview.length < 8000 ? body.preview : null

  if (!caption && !mediaId) return NextResponse.json({ success: false, error: 'Write something or add a photo or video.' }, { status: 400 })
  if (rawPrice !== null) {
    if (!Number.isFinite(rawPrice) || rawPrice < MIN_POST_PRICE || rawPrice > MAX_POST_PRICE) {
      return NextResponse.json({ success: false, error: `Set a price between $${MIN_POST_PRICE} and $${MAX_POST_PRICE}.` }, { status: 400 })
    }
    if (!mediaId) return NextResponse.json({ success: false, error: 'Add a photo or video to lock.' }, { status: 400 })
  }
  if ((await prisma.profilePost.count({ where: { authorId: me, createdAt: { gte: new Date(Date.now() - 86400000) } } })) >= 30) {
    return NextResponse.json({ success: false, error: "You've posted a lot today. Try again tomorrow." }, { status: 429 })
  }

  let media: { kind: string; width: number | null; height: number | null } | null = null
  if (mediaId) {
    const row = await prisma.chatMedia.findUnique({ where: { id: mediaId } })
    const parts = row ? await prisma.chatMediaPart.count({ where: { mediaId } }) : 0
    if (!row || row.ownerId !== me || row.threadId !== postThread(me) || !row.mimeType || parts !== row.partCount) {
      return NextResponse.json({ success: false, error: 'The upload did not finish. Try again.' }, { status: 400 })
    }
    const claimed = await prisma.chatMedia.updateMany({ where: { id: mediaId, complete: false }, data: { complete: true } })
    if (!claimed.count) return NextResponse.json({ success: false, error: 'That was already posted.' }, { status: 409 })
    media = { kind: row.kind, width: row.width, height: row.height }
  }

  const post = await prisma.profilePost.create({
    data: {
      authorId: me,
      caption,
      mediaId,
      mediaKind: media?.kind,
      width: media?.width,
      height: media?.height,
      preview: rawPrice !== null ? preview : null,
      price: rawPrice !== null ? new Prisma.Decimal(rawPrice) : null,
    },
  })
  // Partners and visitors who messaged me hear about it, after the answer is sent
  const author = { id: me, name: session.user.name || 'A member' }
  after(() =>
    tellAboutPost(author, { id: post.id, caption, mediaId, mediaKind: media?.kind || null, price: rawPrice }).catch((err) =>
      console.error('[posts] post emails failed', err),
    ),
  )
  return NextResponse.json({ success: true, id: post.id })
}
