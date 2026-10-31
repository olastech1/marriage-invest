import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { MAX_PINNED } from '@/lib/posts'

export const dynamic = 'force-dynamic'

async function myPost(id: string) {
  const session = await auth()
  const me = session?.user?.id
  if (!me) return { error: NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 }) }
  const post = await prisma.profilePost.findUnique({ where: { id } })
  if (!post || post.authorId !== me) return { error: NextResponse.json({ success: false, error: 'Post not found.' }, { status: 404 }) }
  return { post, me }
}

// PATCH /api/posts/[id]  { action: pin | unpin }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const found = await myPost(id)
  if (found.error) return found.error
  const body = await req.json().catch(() => ({}))

  if (body.action === 'pin') {
    const pinned = await prisma.profilePost.count({ where: { authorId: found.me, pinnedAt: { not: null }, NOT: { id } } })
    if (pinned >= MAX_PINNED) {
      return NextResponse.json({ success: false, error: `You can pin up to ${MAX_PINNED} posts. Unpin one first.` }, { status: 409 })
    }
    await prisma.profilePost.update({ where: { id }, data: { pinnedAt: new Date() } })
    return NextResponse.json({ success: true })
  }
  if (body.action === 'unpin') {
    await prisma.profilePost.update({ where: { id }, data: { pinnedAt: null } })
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ success: false, error: 'Unknown action.' }, { status: 400 })
}

// DELETE /api/posts/[id]  remove my post and its photo/video
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const found = await myPost(id)
  if (found.error) return found.error
  const { mediaId } = found.post
  await prisma.$transaction([
    prisma.profilePost.delete({ where: { id } }),
    ...(mediaId ? [prisma.chatMediaPart.deleteMany({ where: { mediaId } }), prisma.chatMedia.deleteMany({ where: { id: mediaId } })] : []),
  ])
  return NextResponse.json({ success: true })
}
