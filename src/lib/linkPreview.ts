/**
 * Link previews for chat messages: title, description and image of a page.
 *
 * Links to Union Verify itself are described from the database (a member's
 * chat link, a profile, a fund). Other links are fetched server-side with
 * guards so a message can't make the server reach private addresses: public
 * http(s) on the default ports only, every address checked when connecting
 * (also after redirects), a short timeout and a size cap.
 */

import http from 'node:http'
import https from 'node:https'
import dns from 'node:dns'
import net from 'node:net'
import zlib from 'node:zlib'
import type { Readable } from 'node:stream'
import { prisma } from '@/lib/db'
import { formatAccountNumber } from '@/lib/utils'

export type LinkPreview = {
  url: string
  title: string
  description: string
  image: string | null
  siteName: string
  /** A Union Verify page (opens in the app) */
  internal: boolean
  /** Initials to show instead of an image (member links) */
  initials?: string
}

const OWN_HOSTS = new Set(['unionverify.com', 'www.unionverify.com', 'marriage-invest.vercel.app'])
try {
  if (process.env.NEXT_PUBLIC_APP_URL) OWN_HOSTS.add(new URL(process.env.NEXT_PUBLIC_APP_URL).host)
} catch {
  // not a URL
}

const TIMEOUT_MS = 4000
const MAX_BYTES = 512 * 1024
const MAX_REDIRECTS = 3
const CACHE_MS = 6 * 60 * 60 * 1000

const cache = new Map<string, { at: number; preview: LinkPreview | null }>()

const initials = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

export function isOwnHost(host: string, requestHost?: string | null) {
  const h = host.toLowerCase()
  return OWN_HOSTS.has(h) || (!!requestHost && h === requestHost.toLowerCase())
}

// ---------------------------------------------------------------------------
// Union Verify links
// ---------------------------------------------------------------------------

async function ownPreview(url: URL): Promise<LinkPreview> {
  const base = { url: url.toString(), image: null, siteName: 'Union Verify', internal: true }
  const path = url.pathname.replace(/\/+$/, '') || '/'

  if (path === '/chat') {
    const id = url.searchParams.get('recipientId') || url.searchParams.get('to') || url.searchParams.get('user') || ''
    const member = id
      ? await prisma.user.findFirst({
          where: { OR: [{ id }, { username: id.toLowerCase() }], role: 'INVESTOR' },
          select: { name: true, accountNumber: true },
        })
      : null
    if (member) {
      return {
        ...base,
        title: `Chat with ${member.name}`,
        description: `Union Verify member${member.accountNumber ? ` · ID ${formatAccountNumber(member.accountNumber)}` : ''}`,
        initials: initials(member.name),
      }
    }
    return { ...base, title: 'Union Verify chat', description: 'Open the conversation on Union Verify.' }
  }

  const profile = path.match(/^\/u\/([^/]+)$/)
  if (profile) {
    const member = await prisma.user.findUnique({
      where: { username: decodeURIComponent(profile[1]).toLowerCase() },
      select: { name: true, bio: true },
    })
    if (member) {
      return { ...base, title: member.name, description: member.bio?.slice(0, 200) || 'Union Verify member profile', initials: initials(member.name) }
    }
  }

  const fund = path.match(/^\/investments\/([^/]+)$/)
  if (fund) {
    const opportunity = await prisma.investmentOpportunity.findUnique({
      where: { slug: decodeURIComponent(fund[1]) },
      select: { title: true, description: true },
    })
    if (opportunity) return { ...base, title: opportunity.title, description: opportunity.description.slice(0, 200) }
  }

  if (path === '/register') return { ...base, title: 'Join Union Verify', description: 'Create your free account to save and invest together.' }
  return { ...base, title: 'Union Verify', description: 'Save and invest together as a couple.' }
}

// ---------------------------------------------------------------------------
// Other websites
// ---------------------------------------------------------------------------

const blocked = new net.BlockList()
for (const [prefix, bits] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
  ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
] as const) {
  blocked.addSubnet(prefix, bits, 'ipv4')
}
for (const [prefix, bits] of [
  ['::', 128], ['::1', 128], ['64:ff9b::', 96], ['100::', 64], ['2001:db8::', 32], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
] as const) {
  blocked.addSubnet(prefix, bits, 'ipv6')
}

/** True for loopback, private, link-local and other non-public addresses */
export function isPrivateAddress(address: string): boolean {
  const family = net.isIP(address)
  if (family === 4) return blocked.check(address, 'ipv4')
  if (family !== 6) return true
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)
  if (mapped) return blocked.check(mapped[1], 'ipv4')
  if (/^::ffff:/i.test(address)) return true
  return blocked.check(address, 'ipv6')
}

/** DNS lookup that refuses non-public addresses (checked when connecting, so it also covers redirects) */
const publicLookup: net.LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, '', 0)
    const list = addresses as dns.LookupAddress[]
    if (!list.length || list.some((a) => isPrivateAddress(a.address))) {
      return callback(Object.assign(new Error('Address not allowed'), { code: 'EBLOCKED' }), '', 0)
    }
    if (options.all) callback(null, list)
    else callback(null, list[0].address, list[0].family)
  })
}

function checkTarget(url: URL): boolean {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
  if (url.port && url.port !== '80' && url.port !== '443') return false
  if (url.username || url.password) return false
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) return false
  // IP addresses skip DNS, so check them here
  if (net.isIP(host)) return !isPrivateAddress(host)
  return host.includes('.')
}

type Page = { url: URL; html: string }

function getPage(url: URL, signal: AbortSignal, redirects = 0): Promise<Page | null> {
  if (!checkTarget(url)) return Promise.resolve(null)
  const client = url.protocol === 'https:' ? https : http
  return new Promise((resolve) => {
    const req = client.get(
      url,
      {
        lookup: publicLookup,
        signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; UnionVerifyBot/1.0; +https://unionverify.com)',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'en',
        },
      },
      (res) => {
        const status = res.statusCode || 0
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume()
          if (redirects >= MAX_REDIRECTS) return resolve(null)
          let next: URL
          try {
            next = new URL(res.headers.location, url)
          } catch {
            return resolve(null)
          }
          return getPage(next, signal, redirects + 1).then(resolve)
        }
        const type = String(res.headers['content-type'] || '')
        if (status < 200 || status >= 300 || !/text\/html|application\/xhtml\+xml/i.test(type)) {
          res.resume()
          return resolve(null)
        }
        const encoding = String(res.headers['content-encoding'] || '').toLowerCase()
        let body: Readable = res
        if (encoding === 'gzip') body = res.pipe(zlib.createGunzip())
        else if (encoding === 'deflate') body = res.pipe(zlib.createInflate())
        else if (encoding === 'br') body = res.pipe(zlib.createBrotliDecompress())

        const chunks: Buffer[] = []
        let size = 0
        const finish = () => resolve({ url, html: Buffer.concat(chunks).toString('utf8') })
        body.on('data', (chunk: Buffer) => {
          size += chunk.length
          chunks.push(chunk)
          // The tags we need are in <head>: stop reading once we have plenty
          if (size >= MAX_BYTES) {
            res.destroy()
            finish()
          }
        })
        body.on('end', finish)
        body.on('error', () => (size ? finish() : resolve(null)))
      },
    )
    req.on('error', () => resolve(null))
  })
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" }

function decodeEntities(value: string) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+|#39);/gi, (whole, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : whole
    }
    return ENTITIES[code.toLowerCase()] ?? whole
  })
}

const clean = (value: string | undefined, max: number) =>
  value ? decodeEntities(value).replace(/\s+/g, ' ').trim().slice(0, max) : ''

function parsePage({ url, html }: Page): LinkPreview | null {
  const head = html.slice(0, MAX_BYTES)
  const meta: Record<string, string> = {}
  for (const tag of head.match(/<meta\s[^>]*>/gi) || []) {
    const attrs: Record<string, string> = {}
    for (const m of tag.matchAll(/([a-zA-Z:_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) {
      attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? ''
    }
    const key = (attrs.property || attrs.name || '').toLowerCase()
    if (key && attrs.content && !(key in meta)) meta[key] = attrs.content
  }
  const pageTitle = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]

  const title = clean(meta['og:title'] || meta['twitter:title'] || pageTitle, 200)
  if (!title) return null
  let image: string | null = null
  const rawImage = meta['og:image:secure_url'] || meta['og:image'] || meta['twitter:image'] || meta['twitter:image:src']
  if (rawImage) {
    try {
      const resolved = new URL(decodeEntities(rawImage.trim()), url)
      if (resolved.protocol === 'https:') image = resolved.toString()
    } catch {
      image = null
    }
  }
  return {
    url: url.toString(),
    title,
    description: clean(meta['og:description'] || meta['twitter:description'] || meta.description, 300),
    image,
    siteName: clean(meta['og:site_name'], 80) || url.hostname.replace(/^www\./, ''),
    internal: false,
  }
}

// ---------------------------------------------------------------------------

/** Preview for a link in a chat message, or null if there's nothing to show */
export async function getLinkPreview(raw: string, requestHost?: string | null): Promise<LinkPreview | null> {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  if ((url.protocol !== 'https:' && url.protocol !== 'http:') || raw.length > 2048) return null
  if (isOwnHost(url.host, requestHost)) return ownPreview(url)

  url.hash = ''
  const key = url.toString()
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.preview

  const page = await getPage(url, AbortSignal.timeout(TIMEOUT_MS)).catch(() => null)
  const preview = page ? parsePage(page) : null
  if (cache.size > 500) cache.delete(cache.keys().next().value as string)
  cache.set(key, { at: Date.now(), preview })
  return preview
}
