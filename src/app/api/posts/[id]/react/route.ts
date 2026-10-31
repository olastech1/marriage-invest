import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { POST_REACTIONS } from '@/lib/posts'

export const dynamic = 'force-dynamic'

// POST /api/posts/[id]/react  { emoji }  my reaction; the same one again removes it
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return NextResponse.json({ success: false, error: 'Sign in to react.' }, { status: 401 })
  const { id } = await params
  const { emoji } = await req.json().catch(() => ({}))
  if (!POST_REACTIONS.includes(emoji)) return NextResponse.json({ success: false, error: 'Pick a reaction.' }, { status: 400 })

  const post = await prisma.profilePost.findUnique({ where: { id }, select: { authorId: true } })
  if (!post) return NextResponse.json({ success: false, error: 'Post not found.' }, { status: 404 })

  const mine = await prisma.postReaction.findUnique({ where: { postId_userId: { postId: id, userId: me } } })
  if (mine?.emoji === emoji) {
    await prisma.postReaction.delete({ where: { postId_userId: { postId: id, userId: me } } })
    return NextResponse.json({ success: true, mine: null })
  }
  await prisma.postReaction.upsert({
    where: { postId_userId: { postId: id, userId: me } },
    update: { emoji },
    create: { postId: id, userId: me, emoji },
  })
  // The first reaction from someone tells the author
  if (!mine && post.authorId !== me) {
    const link = await prisma.user.findUnique({ where: { id: post.authorId }, select: { username: true, accountNumber: true } })
    await prisma.notification
      .create({
        data: {
          userId: post.authorId,
          title: `${session.user.name || 'Someone'} reacted ${emoji} to your post`,
          message: 'See your post.',
          type: 'INFO',
          link: `/u/${link?.username || link?.accountNumber || ''}#post-${id}`,
        },
      })
      .catch(() => {})
  }
  return NextResponse.json({ success: true, mine: emoji })
}
