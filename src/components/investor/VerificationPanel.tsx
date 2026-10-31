'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { BadgeCheck, Mail, ShieldCheck } from 'lucide-react'

type Status = {
  email: string
  emailVerified: boolean
  identityVerified: boolean
  latestCheck: { status: 'PENDING' | 'APPROVED' | 'REJECTED'; reviewNote: string | null } | null
}

/** Shrink a photo on the device (long side 1600px) so it uploads quickly */
async function shrink(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('unreadable'))
      image.src = url
    })
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('unreadable'))), 'image/jpeg', 0.88))
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Email and identity verification, in Settings */
export default function VerificationPanel() {
  const [status, setStatus] = useState<Status | null>(null)
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState('')
  const [documentType, setDocumentType] = useState('national_id')
  const [fullName, setFullName] = useState('')
  const file = useRef<HTMLInputElement>(null)

  const load = useCallback(() => {
    fetch('/api/user/identity')
      .then((r) => r.json())
      .then((d) => d.success && setStatus(d))
      .catch(() => {})
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const resend = async () => {
    setBusy('email')
    const res = await fetch('/api/auth/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resend: true }) })
    const data = await res.json().catch(() => ({}))
    setNote({ ok: !!data.success, text: data.message || data.error || 'Something went wrong.' })
    setBusy('')
  }

  const submitId = async (e: React.FormEvent) => {
    e.preventDefault()
    const chosen = file.current?.files?.[0]
    if (!chosen) {
      setNote({ ok: false, text: 'Add a photo of your ID.' })
      return
    }
    setBusy('id')
    setNote(null)
    try {
      const form = new FormData()
      form.append('documentType', documentType)
      form.append('fullName', fullName)
      form.append('document', await shrink(chosen), 'id.jpg')
      const res = await fetch('/api/user/identity', { method: 'POST', body: form })
      const data = await res.json()
      setNote({ ok: !!data.success, text: data.message || data.error || 'Something went wrong.' })
      if (data.success) load()
    } catch {
      setNote({ ok: false, text: "That file isn't a photo we can read. Try a JPG or PNG." })
    } finally {
      setBusy('')
    }
  }

  if (!status) return null
  const check = status.latestCheck
  return (
    <div id="verification" className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 shadow-sm">
      <h2 className="text-sm font-bold text-[#0F1C3F] flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#C9A84C]" /> Verification
      </h2>

      <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex items-start gap-2.5">
          <Mail className="w-4 h-4 mt-0.5 text-gray-500" />
          <div>
            <p className="text-sm font-semibold text-[#0F1C3F]">Email</p>
            <p className="text-xs text-gray-500">{status.emailVerified ? `${status.email} is verified.` : `Confirm ${status.email} from the link we email you.`}</p>
          </div>
        </div>
        {status.emailVerified ? (
          <BadgeCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" aria-label="Verified" />
        ) : (
          <button type="button" onClick={resend} disabled={!!busy} className="px-3 py-1.5 rounded-lg bg-[#0F1C3F] text-white text-xs font-bold flex-shrink-0 cursor-pointer disabled:opacity-60">
            {busy === 'email' ? 'Sending…' : 'Send link'}
          </button>
        )}
      </div>

      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <BadgeCheck className="w-4 h-4 mt-0.5 text-gray-500" />
            <div>
              <p className="text-sm font-semibold text-[#0F1C3F]">Identity</p>
              <p className="text-xs text-gray-500">
                {status.identityVerified
                  ? 'Verified. Your profile shows the verified badge.'
                  : check?.status === 'PENDING'
                    ? "We're reviewing your ID. You'll get an email when it's done."
                    : check?.status === 'REJECTED'
                      ? `Not verified${check.reviewNote ? `: ${check.reviewNote}` : ''}. Send a new photo below.`
                      : 'Send a clear photo of your passport, national ID or driver’s licence. Only our team sees it.'}
              </p>
            </div>
          </div>
          {status.identityVerified && <BadgeCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" aria-label="Verified" />}
        </div>
        {!status.identityVerified && check?.status !== 'PENDING' && (
          <form onSubmit={submitId} className="grid gap-2 sm:grid-cols-2">
            <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white">
              <option value="national_id">National ID</option>
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver&apos;s licence</option>
            </select>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name as on the ID"
              className="px-3 py-2 rounded-lg border border-gray-300 text-base sm:text-sm"
            />
            <input ref={file} type="file" accept="image/*" required className="sm:col-span-2 text-xs" />
            <button type="submit" disabled={!!busy} className="sm:col-span-2 py-2 rounded-lg bg-[#0F1C3F] text-white text-xs font-bold cursor-pointer disabled:opacity-60">
              {busy === 'id' ? 'Sending…' : 'Send for review'}
            </button>
          </form>
        )}
      </div>
      {note && <p className={`text-xs ${note.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{note.text}</p>}
    </div>
  )
}
