'use client'

import { useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import UserAvatar from '@/components/investor/UserAvatar'

const SIZE = 320

/** Square-crop and shrink a photo on the phone before upload (a few dozen KB) */
async function toSquareJpeg(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('unreadable'))
      image.src = url
    })
    const side = Math.min(img.naturalWidth, img.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('unreadable')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, SIZE, SIZE)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('unreadable'))), 'image/jpeg', 0.85),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Tell the header and menus to show the new photo */
export const announceProfileChange = () => window.dispatchEvent(new Event('uv:profile-changed'))

export default function ProfilePhotoPicker({
  name,
  avatarUrl,
  onChange,
}: {
  name: string
  avatarUrl: string | null
  onChange: (avatarUrl: string | null) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const upload = async (file: File) => {
    setBusy(true)
    setError('')
    try {
      const photo = await toSquareJpeg(file)
      const form = new FormData()
      form.append('photo', photo, 'photo.jpg')
      const res = await fetch('/api/user/avatar', { method: 'POST', body: form })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'The photo could not be saved.')
      onChange(data.avatarUrl)
      announceProfileChange()
    } catch (err) {
      setError(err instanceof Error && err.message !== 'unreadable' ? err.message : "That file isn't a photo we can read. Try a JPG or PNG.")
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  const remove = async () => {
    if (!window.confirm('Remove your profile photo?')) return
    setBusy(true)
    setError('')
    try {
      await fetch('/api/user/avatar', { method: 'DELETE' })
      onChange(null)
      announceProfileChange()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="relative block flex-shrink-0 rounded-full cursor-pointer disabled:opacity-60"
        aria-label="Change profile photo"
      >
        <UserAvatar name={name} src={avatarUrl} className="w-20 h-20 text-xl" />
        <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#C9A84C] text-[#0F1C3F] flex items-center justify-center border-2 border-white">
          <Camera className="w-3.5 h-3.5" />
        </span>
      </button>
      <div className="space-y-1.5">
        <p className="text-sm font-bold text-[#0F1C3F]">Profile photo</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg bg-[#0F1C3F] text-white text-xs font-bold cursor-pointer disabled:opacity-60"
          >
            {busy ? 'Saving…' : avatarUrl ? 'Change photo' : 'Add photo'}
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-60"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          )}
        </div>
        <p className="text-[11px] text-gray-400">Shown on your profile, in chats and to people who find you.</p>
        {error && <p className="text-[11px] font-semibold text-rose-700">{error}</p>}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) upload(file)
        }}
      />
    </div>
  )
}
