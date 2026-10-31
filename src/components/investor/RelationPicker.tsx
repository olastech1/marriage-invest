'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { RELATIONS, type Relation } from '@/lib/relations'

/** The key for a label like "Business partner" (the chat list only has labels) */
export const relationKey = (labelOrKey?: string | null): Relation | null => {
  if (!labelOrKey) return null
  if (labelOrKey in RELATIONS) return labelOrKey as Relation
  return (Object.entries(RELATIONS).find(([, label]) => label === labelOrKey)?.[0] as Relation) || null
}

/** What a linked partner is to me, tappable to change (friend → spouse, …) */
export default function RelationPicker({
  partnerId,
  partnerName,
  relation,
  onChanged,
  className = '',
}: {
  partnerId: string
  partnerName: string
  relation: Relation | null
  onChanged?: (relation: Relation) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const box = useRef<HTMLDivElement>(null)
  // Placed on the screen (not inside the header), so a clipped header can't cut it off
  const [at, setAt] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const choose = async (next: Relation) => {
    setError('')
    if (next === relation) return setOpen(false)
    setBusy(true)
    const res = await fetch('/api/spouse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'relation', partnerId, relation: next }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!data.success) return setError(data.error || 'Could not change it.')
    setOpen(false)
    onChanged?.(next)
  }

  return (
    <div ref={box} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setAt({ top: r.bottom + 4, left: Math.max(8, Math.min(r.left, window.innerWidth - 232)) })
          setOpen(!open)
        }}
        className={`inline-flex items-center gap-0.5 font-semibold cursor-pointer ${className}`}
        aria-label={`Change what ${partnerName} is to you`}
        aria-expanded={open}
      >
        {busy ? 'Saving…' : relation ? RELATIONS[relation] : 'Partner'}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && at && (
        <div style={{ top: at.top, left: at.left }} className="fixed z-50 w-56 rounded-2xl border border-gray-200 bg-white shadow-xl p-2 text-left">
          <p className="px-2 pt-1 pb-2 text-[11px] text-gray-500">What is {partnerName.split(' ')[0]} to you now? They&apos;ll see the change.</p>
          {(Object.keys(RELATIONS) as Relation[]).map((key) => (
            <button
              key={key}
              type="button"
              disabled={busy}
              onClick={() => choose(key)}
              className="w-full px-2 py-2 rounded-lg text-sm text-[#0F1C3F] hover:bg-gray-50 flex items-center justify-between cursor-pointer disabled:opacity-50"
            >
              {RELATIONS[key]}
              {key === relation && <Check className="w-4 h-4 text-emerald-600" />}
            </button>
          ))}
          {error && <p className="px-2 pt-1 text-[11px] text-rose-700">{error}</p>}
        </div>
      )}
    </div>
  )
}
