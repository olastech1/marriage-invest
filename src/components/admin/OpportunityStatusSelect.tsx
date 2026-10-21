'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUSES = ['DRAFT', 'ACTIVE', 'FUNDED', 'CLOSED'] as const

/** Changes an opportunity's status through PATCH /api/investments/[id] (admin only). */
export default function OpportunityStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/investments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Could not update status')
        return
      }
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const options = STATUSES.includes(status as (typeof STATUSES)[number]) ? STATUSES : [status, ...STATUSES]

  return (
    <div className="flex flex-col items-end">
      <select
        value={status}
        onChange={handleChange}
        disabled={saving || status === 'CANCELLED'}
        aria-label="Opportunity status"
        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A84C]/15 text-[#8a6d22] border-0 focus:ring-2 focus:ring-[#C9A84C] disabled:opacity-60"
      >
        {options.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {error && <span className="text-[10px] text-red-600 mt-1">{error}</span>}
    </div>
  )
}
