import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { escapeHtml } from '@/lib/utils'
import { readUnsubscribeToken } from '@/lib/postEmails'

export const dynamic = 'force-dynamic'

function page(title: string, body: string) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;background:#0F1C3F;color:#fff;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:16px}
main{max-width:420px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:28px;text-align:center}
button{background:#C9A84C;color:#0F1C3F;border:0;border-radius:12px;padding:12px 20px;font-weight:700;font-size:14px;cursor:pointer}p{color:#cbd5e1;font-size:14px;line-height:1.5}</style></head>
<body><main>${body}</main></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  )
}

async function authorName(authorId: string) {
  return (await prisma.user.findUnique({ where: { id: authorId }, select: { name: true } }))?.name || 'this member'
}

// GET: ask first (mail scanners open links, so the link alone never unsubscribes)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t') || ''
  const found = readUnsubscribeToken(token)
  if (!found) return page('Link not valid', '<h2>This link is not valid</h2><p>It may have been copied incompletely.</p>')
  const name = escapeHtml(await authorName(found.authorId))
  return page(
    'Unsubscribe',
    `<h2>Stop emails about ${name}'s posts?</h2><p>${escapeHtml(found.email)} won't get emails when ${name} posts.</p>
<form method="post"><input type="hidden" name="t" value="${escapeHtml(token)}"><button type="submit">Unsubscribe</button></form>`,
  )
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  const found = readUnsubscribeToken(String(form?.get('t') || req.nextUrl.searchParams.get('t') || ''))
  if (!found) return page('Link not valid', '<h2>This link is not valid</h2>')
  await prisma.postEmailOptOut.upsert({
    where: { email_authorId: { email: found.email, authorId: found.authorId } },
    update: {},
    create: { email: found.email, authorId: found.authorId },
  })
  const name = escapeHtml(await authorName(found.authorId))
  return page('Unsubscribed', `<h2>You're unsubscribed</h2><p>You won't get emails about ${name}'s posts anymore.</p>`)
}
