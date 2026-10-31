'use client'

import { useState } from 'react'
import Link from 'next/link'
import { KeyRound } from 'lucide-react'

const input = 'w-full min-w-0 px-4 py-2.5 rounded-lg border border-gray-300 text-base sm:text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none'

/** Change my password: other devices are signed out and need the new one */
export default function ChangePassword() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (next !== repeat) return setNote({ ok: false, text: "The new passwords don't match." })
    setBusy(true)
    setNote(null)
    const res = await fetch('/api/user/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current, next }) })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    setNote({ ok: !!data.success, text: data.message || data.error || 'Something went wrong.' })
    if (data.success) {
      setCurrent('')
      setNext('')
      setRepeat('')
    }
  }

  return (
    <form onSubmit={submit} className="pt-6 border-t border-gray-100 space-y-3">
      <h3 className="text-sm font-bold text-[#0F1C3F] flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-[#C9A84C]" /> Change password
      </h3>
      <p className="text-xs text-gray-500">You stay signed in here. Every other phone or computer is signed out and needs the new password.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input type="password" required autoComplete="current-password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} className={input} />
        <input type="password" required autoComplete="new-password" placeholder="New password" value={next} onChange={(e) => setNext(e.target.value)} className={input} />
        <input type="password" required autoComplete="new-password" placeholder="New password again" value={repeat} onChange={(e) => setRepeat(e.target.value)} className={input} />
      </div>
      <p className="text-[11px] text-gray-400">At least 8 characters, with a capital letter and a number.</p>
      {note && <p className={`text-xs ${note.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{note.text}</p>}
      <div className="flex items-center justify-between gap-3">
        <Link href="/forgot-password" className="text-xs font-semibold text-gray-500 hover:text-[#0F1C3F]">
          Forgot your current password?
        </Link>
        <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-xl bg-[#0F1C3F] hover:bg-[#162c5e] text-white text-xs font-bold disabled:opacity-50 cursor-pointer">
          {busy ? 'Saving…' : 'Change password'}
        </button>
      </div>
    </form>
  )
}
