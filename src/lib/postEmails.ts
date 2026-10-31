/**
 * Telling people about a new profile post: every partner (email and
 * notification), and every visitor who messaged the author and left an email
 * (email with an unsubscribe link; they can stop these per author).
 */

import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { getPartnerIds } from '@/lib/partners'
import { emailMember } from '@/lib/activity'
import { sendActivityEmail } from '@/lib/email'
import { postUrl } from '@/lib/posts'
import { siteUrl } from '@/lib/site'

/** Most visitors emailed about one post */
const MAX_VISITOR_EMAILS = 200

function sign(value: string) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || ''
  return crypto.createHmac('sha256', `post-unsubscribe:${secret}`).update(value).digest('base64url')
}

export function unsubscribeToken(email: string, authorId: string) {
  const value = Buffer.from(`${email}|${authorId}`).toString('base64url')
  return `${value}.${sign(value)}`
}

export function readUnsubscribeToken(token: string): { email: string; authorId: string } | null {
  const [value, sig] = token.split('.')
  if (!value || !sig) return null
  const expected = sign(value)
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  const [email, authorId] = Buffer.from(value, 'base64url').toString().split('|')
  return email && authorId ? { email, authorId } : null
}

/** Visitors (no account) who messaged this member and left an email */
async function visitorEmails(authorId: string) {
  const rows = await prisma.chatMessage.findMany({
    where: { recipientId: authorId, senderId: { startsWith: 'guest_' } },
    select: { proposalData: true },
    orderBy: { createdAt: 'desc' },
    take: 2000,
  })
  const emails = new Set<string>()
  for (const r of rows) {
    const email = (r.proposalData as { guestEmail?: unknown } | null)?.guestEmail
    if (typeof email === 'string' && email.includes('@')) emails.add(email.toLowerCase())
  }
  if (!emails.size) return []
  const [members, optedOut] = await Promise.all([
    // Members hear through their account instead
    prisma.user.findMany({ where: { email: { in: [...emails] } }, select: { email: true } }),
    prisma.postEmailOptOut.findMany({ where: { authorId, email: { in: [...emails] } }, select: { email: true } }),
  ])
  const skip = new Set([...members, ...optedOut].map((m) => m.email.toLowerCase()))
  return [...emails].filter((e) => !skip.has(e)).slice(0, MAX_VISITOR_EMAILS)
}

/** Partners and visitors who messaged the author hear about a new post, with the post itself in the email */
export async function tellAboutPost(
  author: { id: string; name: string },
  post: { id: string; caption: string; mediaId: string | null; mediaKind: string | null; price: number | null },
) {
  const [partners, visitors, link] = await Promise.all([getPartnerIds(author.id), visitorEmails(author.id), postUrl(author.id, post.id)])
  const name = author.name
  const what = post.mediaKind === 'video' ? 'a video' : post.mediaKind === 'image' ? 'a photo' : 'an update'
  const paragraphs = [
    ...(post.caption ? [`"${post.caption.length > 600 ? `${post.caption.slice(0, 600)}…` : post.caption}"`] : []),
    post.price
      ? `🔒 Locked ${post.mediaKind === 'video' ? 'video' : 'photo'}. Unlock it for $${post.price.toLocaleString()} on Union Verify.`
      : post.mediaKind === 'video'
        ? '▶ Watch the video on Union Verify.'
        : '',
  ].filter(Boolean)
  const email = {
    subject: `${name} posted ${what}`,
    heading: `New post from ${name}`,
    paragraphs: paragraphs.length ? paragraphs : [`${name} posted on their profile.`],
    // The photo itself for free photo posts (locked ones and videos open on the site)
    image:
      post.mediaId && post.mediaKind === 'image' && !post.price
        ? { src: `${siteUrl()}/api/chat/media/${post.mediaId}`, href: link, alt: post.caption.slice(0, 100) || `Photo from ${name}` }
        : undefined,
    ctaLabel: post.mediaKind === 'video' && !post.price ? '▶ Watch the video' : 'View more',
    ctaPath: link,
  }
  const line = `${name} posted ${what} on their profile.`

  await Promise.all(
    partners.map(async (partnerId) => {
      await emailMember(partnerId, { ...email, secondaryCta: { label: 'Chat', path: `/chat?recipientId=${encodeURIComponent(author.id)}` } })
      await prisma.notification
        .create({ data: { userId: partnerId, title: `New post from ${name}`, message: line, type: 'INFO', link } })
        .catch(() => {})
    }),
  )
  // Visitors have no account: "Chat" opens the profile, where they can message
  const profile = link.split('#')[0]
  for (let i = 0; i < visitors.length; i += 10) {
    await Promise.all(
      visitors.slice(i, i + 10).map((to) =>
        sendActivityEmail({
          to,
          ...email,
          secondaryCta: { label: 'Chat', path: profile },
          unsubscribeUrl: `${siteUrl()}/api/posts/unsubscribe?t=${unsubscribeToken(to, author.id)}`,
        }).catch(() => false),
      ),
    )
  }
}
