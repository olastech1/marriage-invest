'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'

/** "Confirm your email" with a button to send the link again */
export default function VerifyEmailBanner({ email }: { email: string }) {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  const send = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/auth/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resend: true }) })
      const data = await res.json()
      setNote(data.message || data.error || 'Something went wrong.')
    } catch {
      setNote('Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <Mail className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold text-amber-950">Confirm your email</p>
          <p className="text-xs text-amber-900/80">{note || `Open the link we sent to ${email}. It keeps your account secure and lets you reset your password.`}</p>
        </div>
      </div>
      <button type="button" onClick={send} disabled={busy} className="px-4 py-2 rounded-xl bg-[#0F1C3F] text-white text-xs font-bold flex-shrink-0 cursor-pointer disabled:opacity-60">
        {busy ? 'Sending…' : 'Send the link again'}
      </button>
    </div>
  )
}
