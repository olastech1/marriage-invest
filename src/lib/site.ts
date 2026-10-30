/**
 * The site's public address, for links in emails, payments and invites.
 * A Vercel deploy address (*.vercel.app) is never used: members should always
 * land on the real domain.
 */

export const SITE_URL = 'https://www.unionverify.com'

export function siteUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_APP_URL || '').trim().replace(/\/$/, '')
  if (!configured) return SITE_URL
  try {
    return /\.vercel\.app$/i.test(new URL(configured).hostname) ? SITE_URL : configured
  } catch {
    return SITE_URL
  }
}
