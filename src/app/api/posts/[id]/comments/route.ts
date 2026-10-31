import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { postUrl } from '@/lib/posts'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

// GET /api/posts/[id]/comments  comments, oldest first, each with its replies (anyone can read)
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await auth()
  const me = session?.user?.id || ''
  const post = await prisma.profilePost.findUnique({ where: { id }, select: { authorId: true } })
  if (!post) return NextResponse.json({ success: false, error: 'Post not found.' }, { status: 404 })

  const rows = await prisma.postComment.findMany({ where: { postId: id }, orderBy: { createdAt: 'asc' }, take: 500 })
  const people = new Map(
    (
      await prisma.user.findMany({
        where: { id: { in: [...new Set(rows.map((r) => r.authorId))] } },
        select: { id: true, name: true, username: true, accountNumber: true, avatarUrl: true, identityVerified: true },
      })
    ).map((u) => [u.id, u]),
  )
  const shape = (r: (typeof rows)[number]) => {
    const u = people.get(r.authorId)
    return {
      id: r.id,
      text: r.text,
      createdAt: r.createdAt,
      author: {
        id: r.authorId,
        name: u?.name || 'Member',
        avatarUrl: u?.avatarUrl || null,
        verified: !!u?.identityVerified,
        profile: u?.username || u?.accountNumber || null,
      },
      // The commenter, and the post's author, can delete it
      canDelete: !!me && (me === r.authorId || me === post.authorId),
    }
  }
  const top = rows.filter((r) => !r.parentId)
  return NextResponse.json({
    success: true,
    comments: top.map((c) => ({ ...shape(c), replies: rows.filter((r) => r.parentId === c.id).map(shape) })),
  })
}

// POST /api/posts/[id]/comments  { text, parentId? }
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return NextResponse.json({ success: false, error: 'Sign in to comment.' }, { status: 401 })
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const text = String(body.text || '').trim().slice(0, 1000)
  if (!text) return NextResponse.json({ success: false, error: 'Write a comment.' }, { status: 400 })

  const post = await prisma.profilePost.findUnique({ where: { id }, select: { authorId: true } })
  if (!post) return NextResponse.json({ success: false, error: 'Post not found.' }, { status: 404 })
  // A reply answers a top-level comment on this post (replies to replies join the same thread)
  let parent: { id: string; authorId: string } | null = null
  if (body.parentId) {
    const found = await prisma.postComment.findUnique({ where: { id: String(body.parentId) } })
    if (!found || found.postId !== id) return NextResponse.json({ success: false, error: 'That comment is gone.' }, { status: 404 })
    parent = found.parentId ? await prisma.postComment.findUnique({ where: { id: found.parentId } }) : found
  }
  if ((await prisma.postComment.count({ where: { authorId: me, createdAt: { gte: new Date(Date.now() - 3600_000) } } })) >= 60) {
    return NextResponse.json({ success: false, error: "You're commenting a lot. Try again in a while." }, { status: 429 })
  }

  const comment = await prisma.postComment.create({ data: { postId: id, authorId: me, parentId: parent?.id || null, text } })

  // Tell the post's author, and whoever was replied to
  const name = session.user.name || 'Someone'
  const link = await postUrl(post.authorId, id)
  const tell = new Map<string, string>()
  if (post.authorId !== me) tell.set(post.authorId, `${name} commented on your post`)
  if (parent && parent.authorId !== me) tell.set(parent.authorId, `${name} replied to your comment`)
  await Promise.all(
    [...tell].map(([userId, title]) =>
      prisma.notification.create({ data: { userId, title, message: text.slice(0, 100), type: 'INFO', link } }).catch(() => {}),
    ),
  )
  return NextResponse.json({ success: true, id: comment.id })
}

// DELETE /api/posts/[id]/comments?commentId=  (its replies go with it)
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })
  const { id } = await params
  const commentId = req.nextUrl.searchParams.get('commentId') || ''
  const [comment, post] = await Promise.all([
    prisma.postComment.findUnique({ where: { id: commentId } }),
    prisma.profilePost.findUnique({ where: { id }, select: { authorId: true } }),
  ])
  if (!comment || comment.postId !== id || !post || (comment.authorId !== me && post.authorId !== me)) {
    return NextResponse.json({ success: false, error: 'Comment not found.' }, { status: 404 })
  }
  await prisma.postComment.deleteMany({ where: { OR: [{ id: commentId }, { parentId: commentId }] } })
  return NextResponse.json({ success: true })
}
