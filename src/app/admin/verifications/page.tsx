'use client'

import { useCallback, useEffect, useState } from 'react'
import { BadgeCheck } from 'lucide-react'

type Check = {
  id: string
  documentType: string
  fullName: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewNote: string | null
  createdAt: string
  user: { name: string; email: string; accountNumber: string | null } | null
}

const DOC_LABEL: Record<string, string> = { passport: 'Passport', national_id: 'National ID', drivers_license: "Driver's licence" }

export default function AdminVerificationsPage() {
  const [checks, setChecks] = useState<Check[] | null>(null)
  const [open, setOpen] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(() => {
    fetch('/api/admin/identity')
      .then((r) => r.json())
      .then((d) => setChecks(d.checks || []))
      .catch(() => setChecks([]))
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const decide = async (id: string, action: 'approve' | 'reject') => {
    const note = action === 'reject' ? window.prompt('Reason, shown to the member (e.g. "The photo is blurry")') : ''
    if (note === null) return
    setBusy(id)
    setError('')
    const res = await fetch(`/api/admin/identity/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, note }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) setError(data.error || 'Something went wrong.')
    setBusy('')
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BadgeCheck className="w-6 h-6 text-[#C9A84C]" /> Identity verifications
        </h1>
        <p className="text-xs text-gray-500 mt-1">Check the name and photo on each ID, then approve or reject it. Members are told either way.</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!checks ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : checks.length === 0 ? (
        <p className="text-sm text-gray-500">No identity checks yet.</p>
      ) : (
        <div className="space-y-3">
          {checks.map((c) => (
            <div key={c.id} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-gray-900">{c.user?.name || 'Member'} <span className="font-normal text-gray-500">· {c.user?.email}</span></p>
                  <p className="text-xs text-gray-500">
                    {DOC_LABEL[c.documentType] || c.documentType} · name on ID: <strong>{c.fullName}</strong> · sent {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    c.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : c.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {c.status === 'PENDING' ? 'Waiting' : c.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                </span>
              </div>
              {c.reviewNote && <p className="text-xs text-gray-500">Note: {c.reviewNote}</p>}
              <button type="button" onClick={() => setOpen(open === c.id ? '' : c.id)} className="text-xs font-bold text-[#0F1C3F] underline cursor-pointer">
                {open === c.id ? 'Hide ID photo' : 'Show ID photo'}
              </button>
              {open === c.id && (
                // eslint-disable-next-line @next/next/no-img-element -- private photo from our own admin API
                <img src={`/api/admin/identity/${c.id}/document`} alt={`ID of ${c.fullName}`} className="max-h-96 rounded-xl border border-gray-200" />
              )}
              {c.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => decide(c.id, 'approve')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-60 cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => decide(c.id, 'reject')}
                    className="px-4 py-2 rounded-xl border border-red-300 text-red-700 text-xs font-bold disabled:opacity-60 cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
