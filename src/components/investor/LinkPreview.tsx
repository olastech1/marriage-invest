'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { ExternalLink, Link2 } from 'lucide-react'
import UserAvatar from '@/components/investor/UserAvatar'

export type LinkPreviewData = {
  url: string
  title: string
  description: string
  image: string | null
  siteName: string
  internal: boolean
  initials?: string
  avatar?: string | null
}

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi

/** Drop punctuation that ends a sentence rather than the link ("see x.com/a." -> "x.com/a") */
function trimLink(raw: string) {
  let link = raw.replace(/[.,!?;:'"]+$/, '')
  while (link.endsWith(')') && (link.match(/\(/g) || []).length < (link.match(/\)/g) || []).length) link = link.slice(0, -1)
  return link
}

const toHref = (link: string) => (/^https?:\/\//i.test(link) ? link : `https://${link}`)

/** Links in a message, in order (http(s) and www. only) */
export function findLinks(text: string): string[] {
  return (text.match(URL_PATTERN) || []).map((raw) => toHref(trimLink(raw)))
}

/** True for a link to this site (opens inside the app) */
export function isOwnLink(href: string) {
  if (typeof window === 'undefined') return false
  try {
    const host = new URL(href).host.toLowerCase()
    return host === window.location.host.toLowerCase() || host === 'unionverify.com' || host === 'www.unionverify.com' || host === 'marriage-invest.vercel.app'
  } catch {
    return false
  }
}

/** Message text with its links made tappable */
export function Linkified({
  text,
  linkClassName,
  onOpenOwn,
}: {
  text: string
  linkClassName: string
  /** Open a Union Verify link inside the app (return true if handled) */
  onOpenOwn?: (href: string) => boolean
}) {
  const parts: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(URL_PATTERN)) {
    const link = trimLink(match[0])
    const start = match.index ?? 0
    if (start > last) parts.push(text.slice(last, start))
    const href = toHref(link)
    parts.push(
      <a
        key={start}
        href={href}
        target={isOwnLink(href) ? undefined : '_blank'}
        rel="noopener noreferrer nofollow ugc"
        onClick={(e) => {
          if (isOwnLink(href) && onOpenOwn?.(href)) e.preventDefault()
        }}
        className={`underline underline-offset-2 break-all ${linkClassName}`}
      >
        {link}
      </a>,
    )
    last = start + link.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

// One request per link, shared by every message that shows it (polling re-renders often)
const previews = new Map<string, Promise<LinkPreviewData | null>>()

function loadPreview(url: string) {
  let pending = previews.get(url)
  if (!pending) {
    pending = fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => (data?.preview as LinkPreviewData) || null)
      .catch(() => null)
    previews.set(url, pending)
  }
  return pending
}

/** Preview card under a message: image, site, title and description */
export function LinkPreviewCard({ url, onOpenOwn }: { url: string; onOpenOwn?: (href: string) => boolean }) {
  const [preview, setPreview] = useState<LinkPreviewData | null | undefined>(undefined)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    let live = true
    loadPreview(url).then((p) => live && setPreview(p))
    return () => {
      live = false
    }
  }, [url])

  if (!preview) return null
  const own = isOwnLink(url)

  return (
    <a
      href={url}
      target={own ? undefined : '_blank'}
      rel="noopener noreferrer nofollow ugc"
      onClick={(e) => {
        if (own && onOpenOwn?.(url)) e.preventDefault()
      }}
      className="mt-1.5 block w-full max-w-[320px] overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-xs hover:border-gray-300 transition-colors"
    >
      {preview.image && !imageFailed && (
        // eslint-disable-next-line @next/next/no-img-element -- any website's image; next/image only allows listed hosts
        <img
          src={preview.image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          className="w-full max-h-44 object-cover bg-gray-100"
        />
      )}
      <div className="flex items-start gap-2.5 p-3">
        {(!preview.image || imageFailed) &&
          (preview.initials ? (
            <UserAvatar name={preview.title.replace(/^Chat with /, '')} src={preview.avatar} className="w-10 h-10 text-xs" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#0F1C3F] text-[#C9A84C] flex items-center justify-center flex-shrink-0">
              <Link2 className="w-4 h-4" />
            </div>
          ))}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate">{preview.siteName}</p>
          <p className="text-[13px] font-bold text-[#0F1C3F] leading-snug line-clamp-2">{preview.title}</p>
          {preview.description && <p className="text-[11px] text-gray-500 leading-snug mt-0.5 line-clamp-2">{preview.description}</p>}
          <p className="mt-1.5 text-[11px] font-bold text-[#C9A84C] flex items-center gap-1">
            {own ? 'Open' : 'Open link'}
            {!own && <ExternalLink className="w-3 h-3" />}
          </p>
        </div>
      </div>
    </a>
  )
}
