import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { siteUrl } from '@/lib/site'

// The link preview when a member shares their profile (WhatsApp, Instagram…): casual, about chatting
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug.toLowerCase().trim()
  const user = await (/^\d{8}$/.test(slug)
    ? prisma.user.findFirst({ where: { accountNumber: slug, role: 'INVESTOR' }, select: { name: true, bio: true, avatarUrl: true } })
    : prisma.user.findUnique({ where: { username: slug }, select: { name: true, bio: true, avatarUrl: true } })
  ).catch(() => null)
  if (!user) return { title: { absolute: 'Union' } }

  const first = user.name.split(' ')[0]
  const title = `Chat with ${first} 💬`
  const bio = user.bio?.trim().replace(/\s+/g, ' ')
  const description = bio ? (bio.length > 150 ? `${bio.slice(0, 150)}…` : bio) : `Say hi to ${first} on Union. Tap to chat.`
  const images = user.avatarUrl ? [{ url: `${siteUrl()}${user.avatarUrl}`, width: 400, height: 400, alt: first }] : undefined
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, type: 'profile', siteName: 'Union', url: `${siteUrl()}/u/${slug}`, images },
    twitter: { card: images ? 'summary' : 'summary', title, description, images: images?.map((i) => i.url) },
  }
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
