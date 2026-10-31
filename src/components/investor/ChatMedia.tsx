'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Lock, Wallet, X } from 'lucide-react'

export type MediaData = {
  mediaId: string
  mimeType?: string
  width?: number | null
  height?: number | null
  /** Locked: the person it was sent to pays this to see it */
  price?: number
  preview?: string | null
  /** Sent to me, locked, not paid for yet */
  locked?: boolean
}

const usd = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

/** The blurred cover on a locked photo/video sent to me, with card / wallet payment */
function LockedCover({ kind, data, messageId, onUnlocked }: { kind: 'image' | 'video'; data: MediaData; messageId: string; onUnlocked?: () => void }) {
  const [paying, setPaying] = useState(false)
  const [cash, setCash] = useState<number | null>(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const price = data.price || 0

  const open = async () => {
    setPaying(true)
    const d = await fetch('/api/wallet')
      .then((r) => r.json())
      .catch(() => null)
    setCash(d?.success ? d.cash : 0)
  }
  const unlock = async (source: 'card' | 'wallet') => {
    setBusy(source)
    setError('')
    try {
      const res = await fetch('/api/chat/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId, source }) })
      const d = await res.json()
      if (!d.success) throw new Error(d.error || 'Could not unlock. Try again.')
      if (d.checkoutUrl) {
        window.location.href = d.checkoutUrl
        return
      }
      onUnlocked?.()
    } catch (err) {
      setError((err as Error).message)
    }
    setBusy('')
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center overflow-hidden">
      {data.preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.preview} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2f64] to-[#0F1C3F]" />
      )}
      <div className="relative w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
        <Lock className="w-4 h-4 text-white" />
      </div>
      {!paying ? (
        <button type="button" onClick={open} className="relative px-3.5 py-2 rounded-xl bg-[#C9A84C] text-[#0F1C3F] text-xs font-bold cursor-pointer">
          Unlock {kind === 'video' ? 'video' : 'photo'} for {usd(price)}
        </button>
      ) : (
        <div className="relative w-full max-w-[220px] rounded-xl bg-white text-[#0F1C3F] p-2.5 space-y-1.5 shadow-xl">
          <button type="button" onClick={() => unlock('card')} disabled={!!busy} className="w-full py-2 rounded-lg bg-[#0F1C3F] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">
            <CreditCard className="w-3.5 h-3.5" /> {busy === 'card' ? 'Opening…' : `Pay ${usd(price)} by card`}
          </button>
          {cash !== null && cash >= price && (
            <button type="button" onClick={() => unlock('wallet')} disabled={!!busy} className="w-full py-2 rounded-lg border border-[#0F1C3F] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">
              <Wallet className="w-3.5 h-3.5" /> {busy === 'wallet' ? 'Unlocking…' : `Wallet cash (${usd(cash)})`}
            </button>
          )}
          {error && <p className="text-[11px] text-rose-700">{error}</p>}
          <button type="button" onClick={() => setPaying(false)} className="w-full text-[11px] text-gray-500 cursor-pointer">
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

const MAX_VIDEO_BYTES = 25 * 1024 * 1024
const MAX_SIDE = 1600

export const mediaUrl = (id: string) => `/api/chat/media/${encodeURIComponent(id)}`

/** A tiny blurred-looking JPEG of a picture or video frame (shown on locked posts) */
function tinyPreview(source: CanvasImageSource, width: number, height: number): string | null {
  try {
    const w = 24
    const h = Math.max(1, Math.round((height / width) * w))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d')!.drawImage(source, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', 0.5)
  } catch {
    return null
  }
}

/** A photo, made smaller on the phone first so it sends and loads fast */
async function preparePhoto(file: File): Promise<{ blob: Blob; width: number; height: number; preview: string | null }> {
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) throw new Error("That photo couldn't be opened. Try a JPG or PNG.")
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
  if (!blob) throw new Error("That photo couldn't be prepared.")
  return { blob, width, height, preview: tinyPreview(canvas, width, height) }
}

/** A video's width and height (so its space is kept while it loads) and a first-frame preview */
function videoSize(file: File): Promise<{ width: number; height: number; preview: string | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    let settled = false
    const done = (width = 0, height = 0, preview: string | null = null) => {
      if (settled) return
      settled = true
      URL.revokeObjectURL(url)
      resolve({ width, height, preview })
    }
    setTimeout(() => done(v.videoWidth, v.videoHeight), 5000)
    v.preload = 'auto'
    v.muted = true
    v.playsInline = true
    v.onloadeddata = () => {
      v.currentTime = Math.min(0.5, (v.duration || 1) / 2)
    }
    v.onseeked = () => done(v.videoWidth, v.videoHeight, tinyPreview(v, v.videoWidth || 16, v.videoHeight || 9))
    v.onerror = () => done()
    v.src = url
  })
}

/**
 * Upload a photo or video, in pieces: for the chat with `recipientId`, or for a profile post.
 * Returns the mediaId to send with the message or post, and a tiny preview.
 */
export async function uploadChatMedia(
  file: File,
  target: { recipientId: string } | { forPost: true },
  onProgress: (fraction: number) => void,
): Promise<{ mediaId: string; preview: string | null; kind: 'image' | 'video' }> {
  const isVideo = file.type.startsWith('video/')
  if (!isVideo && !file.type.startsWith('image/')) throw new Error('Choose a photo or a video.')
  if (isVideo && file.size > MAX_VIDEO_BYTES) throw new Error('That video is too large. Send one up to 25 MB (about a minute).')

  const { blob, width, height, preview } = isVideo ? { blob: file as Blob, ...(await videoSize(file)) } : await preparePhoto(file)

  const start = await fetch('/api/chat/media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...target, kind: isVideo ? 'video' : 'image', size: blob.size, width, height }),
  }).then((r) => r.json())
  if (!start.success) throw new Error(start.error || 'Could not start the upload.')

  for (let i = 0; i < start.partCount; i++) {
    const piece = blob.slice(i * start.partSize, (i + 1) * start.partSize)
    let res: Response | null = null
    // One retry per piece for a dropped connection
    for (let attempt = 0; attempt < 2 && !res?.ok; attempt++) {
      res = await fetch(`/api/chat/media/${start.mediaId}?part=${i}`, { method: 'PUT', body: piece }).catch(() => null)
    }
    if (!res?.ok) {
      const data = await res?.json().catch(() => null)
      throw new Error(data?.error || 'The upload stopped. Check your connection and try again.')
    }
    onProgress((i + 1) / start.partCount)
  }
  return { mediaId: start.mediaId, preview, kind: isVideo ? 'video' : 'image' }
}

/** A photo or video in a chat bubble; tap a photo to see it full screen */
export function ChatMediaBubble({
  kind,
  data,
  caption,
  isMe,
  messageId,
  onUnlocked,
}: {
  kind: 'image' | 'video'
  data: MediaData
  caption?: string
  isMe: boolean
  messageId?: string
  /** Paid for: refresh the messages */
  onUnlocked?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState(false)
  // Bumped to try loading again
  const [attempt, setAttempt] = useState(0)
  const src = `${mediaUrl(data.mediaId)}${attempt ? `?r=${attempt}` : ''}`
  // Keep the space while it loads, so the chat doesn't jump
  const ratio = data.width && data.height ? `${data.width} / ${data.height}` : kind === 'video' ? '16 / 9' : '4 / 3'

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className={`rounded-2xl overflow-hidden shadow-xs border ${isMe ? 'bg-[#0F1C3F] border-[#0F1C3F] rounded-tr-none' : 'bg-white border-gray-200 rounded-tl-none'}`}>
      <div className="bg-gray-100 w-[260px] sm:w-[320px] max-h-[420px] flex items-center justify-center" style={{ aspectRatio: ratio }}>
        {data.locked && !isMe && messageId ? (
          <LockedCover kind={kind} data={data} messageId={messageId} onUnlocked={onUnlocked} />
        ) : failed ? (
          // Couldn't load, or this browser can't play the format (e.g. an iPhone video on Android)
          <div className="p-4 text-center space-y-2 text-xs text-gray-600">
            <p>{kind === 'video' ? "This video can't play here." : "This photo didn't load."}</p>
            <div className="flex justify-center gap-3 font-semibold">
              <button
                type="button"
                onClick={() => {
                  setFailed(false)
                  setAttempt((n) => n + 1)
                }}
                className="text-[#0F1C3F] underline cursor-pointer"
              >
                Try again
              </button>
            </div>
          </div>
        ) : kind === 'image' ? (
          <button type="button" onClick={() => setOpen(true)} className="w-full h-full cursor-zoom-in" aria-label="Open photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={caption || 'Photo'} draggable={false} loading="lazy" decoding="async" onError={() => setFailed(true)} className="w-full h-full object-cover" />
          </button>
        ) : (
          <video src={`${src}#t=0.1`} controls controlsList="nodownload noremoteplayback" disablePictureInPicture playsInline preload="metadata" onError={() => setFailed(true)} className="w-full h-full object-contain bg-black" />
        )}
      </div>
      {isMe && !!data.price && (
        <p className="px-3 pt-2 text-[11px] text-[#C9A84C] font-semibold flex items-center gap-1">
          <Lock className="w-3 h-3" /> Locked for them · {usd(data.price)}
        </p>
      )}
      {caption && (
        <p translate="no" className={`px-3 py-2 text-xs sm:text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${isMe ? 'text-white' : 'text-gray-800'}`}>{caption}</p>
      )}
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setOpen(false)} role="dialog" aria-label="Photo">
          <button type="button" onClick={() => setOpen(false)} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={caption || 'Photo'} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
