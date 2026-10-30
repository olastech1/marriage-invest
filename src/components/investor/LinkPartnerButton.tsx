'use client'

import { useEffect, useRef, useState } from 'react'
import { Heart } from 'lucide-react'
import { RELATIONS, type Relation } from '@/lib/relations'

export type LinkResult = { ok: boolean; linked: boolean; text: string }

/** "Link as partner": pick what you are to each other, then send the request */
export default function LinkPartnerButton({
  userId,
  name,
  onDone,
  className = '',
  label = 'Link as partner',
}: {
  userId: string
  name: string
  onDone: (result: LinkResult) => void
  className?: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const send = async (relation: Relation) => {
    setBusy(true)
    try {
      const res = await fetch('/api/spouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', userId, relation }),
      })
      const data = await res.json()
      const as = RELATIONS[relation].toLowerCase()
      onDone({
        ok: !!data.success,
        linked: !!data.linked,
        text: !data.success
          ? data.error || 'Something went wrong.'
          : data.linked
            ? `You are now linked with ${name}.`
            : `Request sent to ${name} (${as})${data.emailed ? ' in chat and by email' : ''}. They accept it on their dashboard or in your chat.`,
      })
      setOpen(false)
    } catch {
      onDone({ ok: false, linked: false, text: 'Something went wrong.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center justify-center gap-1 rounded-xl font-bold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer disabled:opacity-60 ${className}`}
      >
        <Heart className="w-3.5 h-3.5" />
        <span>{busy ? 'Sending…' : label}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-40 w-56 rounded-2xl border border-gray-200 bg-white shadow-xl p-2">
          <p className="px-2 pt-1 pb-2 text-[11px] text-gray-500 leading-snug">
            What is {name.split(' ')[0]} to you? You&apos;ll have a joint vault together; your other partners aren&apos;t affected.
          </p>
          {(Object.keys(RELATIONS) as Relation[]).map((r) => (
            <button
              key={r}
              type="button"
              disabled={busy}
              onClick={() => send(r)}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-[#0F1C3F] hover:bg-rose-50 cursor-pointer disabled:opacity-60"
            >
              {RELATIONS[r]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
