'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export type MediaData = { mediaId: string; mimeType?: string; width?: number | null; height?: number | null }

const MAX_VIDEO_BYTES = 25 * 1024 * 1024
const MAX_SIDE = 1600

export const mediaUrl = (id: string) => `/api/chat/media/${encodeURIComponent(id)}`

/** A photo, made smaller on the phone first so it sends and loads fast */
async function preparePhoto(file: File): Promise<{ blob: Blob; width: number; height: number }> {
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
  return { blob, width, height }
}

/** A video's width and height, so its space is kept while it loads */
function videoSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    const done = (width = 0, height = 0) => {
      URL.revokeObjectURL(url)
      resolve({ width, height })
    }
    const timer = setTimeout(() => done(), 4000)
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      clearTimeout(timer)
      done(v.videoWidth, v.videoHeight)
    }
    v.onerror = () => {
      clearTimeout(timer)
      done()
    }
    v.src = url
  })
}

/**
 * Upload a photo or video for the chat with `recipientId`, in pieces.
 * Returns the mediaId to send with the message.
 */
export async function uploadChatMedia(file: File, recipientId: string, onProgress: (fraction: number) => void): Promise<string> {
  const isVideo = file.type.startsWith('video/')
  if (!isVideo && !file.type.startsWith('image/')) throw new Error('Choose a photo or a video.')
  if (isVideo && file.size > MAX_VIDEO_BYTES) throw new Error('That video is too large. Send one up to 25 MB (about a minute).')

  const { blob, width, height } = isVideo ? { blob: file as Blob, ...(await videoSize(file)) } : await preparePhoto(file)

  const start = await fetch('/api/chat/media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipientId, kind: isVideo ? 'video' : 'image', size: blob.size, width, height }),
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
  return start.mediaId
}

/** A photo or video in a chat bubble; tap a photo to see it full screen */
export function ChatMediaBubble({ kind, data, caption, isMe }: { kind: 'image' | 'video'; data: MediaData; caption?: string; isMe: boolean }) {
  const [open, setOpen] = useState(false)
  const src = mediaUrl(data.mediaId)
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
        {kind === 'image' ? (
          <button type="button" onClick={() => setOpen(true)} className="w-full h-full cursor-zoom-in" aria-label="Open photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={caption || 'Photo'} loading="lazy" decoding="async" className="w-full h-full object-cover" />
          </button>
        ) : (
          <video src={`${src}#t=0.1`} controls playsInline preload="metadata" className="w-full h-full object-contain bg-black" />
        )}
      </div>
      {caption && (
        <p className={`px-3 py-2 text-xs sm:text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${isMe ? 'text-white' : 'text-gray-800'}`}>{caption}</p>
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
