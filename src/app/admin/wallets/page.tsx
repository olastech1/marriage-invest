'use client'

import { useCallback, useEffect, useState } from 'react'
import { Search, Wallet } from 'lucide-react'

type Entry = { id: string; kind: 'CASH' | 'CREDIT'; amount: number; reason: string; createdAt: string }
type Member = { id: string; name: string; email: string; accountNumber: string | null; cash: number; credit: number; entries: Entry[] }
type Pending = {
  id: string
  amount: number
  bankName: string
  accountName: string
  accountNumber: string
  routingNumber: string | null
  createdAt: string
  member: { name: string; email: string; accountNumber: string | null } | null
}

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
const input = 'px-3 py-2 rounded-lg border border-gray-300 text-sm'

export default function AdminWalletsPage() {
  const [query, setQuery] = useState('')
  const [member, setMember] = useState<Member | null>(null)
  const [pending, setPending] = useState<Pending[] | null>(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(async (q: string) => {
    const res = await fetch(`/api/admin/wallets${q ? `?q=${encodeURIComponent(q)}` : ''}`)
    const data = await res.json().catch(() => ({}))
    setPending(data.pending || [])
    if (q) {
      setMember(data.member || null)
      if (!data.success) setMessage({ ok: false, text: data.error || 'Something went wrong.' })
    }
  }, [])
  useEffect(() => {
    fetch('/api/admin/wallets')
      .then((r) => r.json())
      .then((d) => setPending(d.pending || []))
      .catch(() => setPending([]))
  }, [])

  const find = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setBusy('find')
    await load(query.trim())
    setBusy('')
  }

  const changeCredit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!member) return
    setBusy('credit')
    setMessage(null)
    const res = await fetch('/api/admin/wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: member.id, amount: parseFloat(amount), note }),
    })
    const data = await res.json().catch(() => ({}))
    setMessage({ ok: res.ok, text: data.message || data.error || 'Something went wrong.' })
    if (res.ok) {
      setAmount('')
      setNote('')
      await load(member.accountNumber || member.email)
    }
    setBusy('')
  }

  const decide = async (id: string, action: 'paid' | 'reject') => {
    const reason = action === 'reject' ? window.prompt('Reason, shown to the member (the money goes back to their wallet)') : ''
    if (reason === null) return
    if (action === 'paid' && !window.confirm('Mark as paid? Only do this after the money has been sent to their bank.')) return
    setBusy(id)
    const res = await fetch(`/api/admin/wallets/withdrawals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, note: reason }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) setMessage({ ok: false, text: data.error || 'Something went wrong.' })
    setBusy('')
    await load(member ? member.accountNumber || member.email : '')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-[#C9A84C]" /> Wallets
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Cash is real money members added by card; they can invest or withdraw it. Credit is what you add here: members can invest it but never withdraw it, and it
          isn&apos;t counted in deposits, raised amounts or totals. The two are always kept apart.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
        <form onSubmit={find} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} required placeholder="Member account ID or email" className={`${input} w-full pl-9`} />
          </div>
          <button type="submit" disabled={!!busy} className="px-4 rounded-lg bg-[#0F1C3F] text-white text-sm font-bold disabled:opacity-50 cursor-pointer">
            {busy === 'find' ? '…' : 'Find'}
          </button>
        </form>

        {member && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold text-gray-900">
                {member.name} <span className="font-normal text-gray-500">· {member.email}</span>
              </p>
              <div className="flex gap-4 text-sm">
                <span>
                  Cash <strong>{usd(member.cash)}</strong>
                </span>
                <span>
                  Credit <strong>{usd(member.credit)}</strong>
                </span>
              </div>
            </div>
            <form onSubmit={changeCredit} className="grid gap-2 sm:grid-cols-[140px_1fr_auto]">
              <input required type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount, e.g. 500" className={input} />
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={150} placeholder="Note in their wallet history (optional)" className={input} />
              <button type="submit" disabled={!!busy} className="px-4 py-2 rounded-lg bg-[#C9A84C] text-[#0F1C3F] text-sm font-bold disabled:opacity-50 cursor-pointer">
                {busy === 'credit' ? 'Saving…' : parseFloat(amount) < 0 ? 'Remove credit' : 'Add credit'}
              </button>
            </form>
            <p className="text-[11px] text-gray-500">Use a minus sign (e.g. -100) to remove credit. Credit already invested can&apos;t be removed.</p>
            {member.entries.length > 0 && (
              <ul className="divide-y divide-gray-100 text-xs">
                {member.entries.map((e) => (
                  <li key={e.id} className="py-2 flex justify-between gap-3">
                    <span className="text-gray-600">
                      {new Date(e.createdAt).toLocaleString()} · <strong>{e.kind === 'CREDIT' ? 'Credit' : 'Cash'}</strong> · {e.reason}
                    </span>
                    <span className={`font-bold whitespace-nowrap ${e.amount > 0 ? 'text-emerald-700' : 'text-gray-900'}`}>
                      {e.amount > 0 ? '+' : '−'}
                      {usd(Math.abs(e.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {message && <p className={`text-sm ${message.ok ? 'text-emerald-700' : 'text-red-600'}`}>{message.text}</p>}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-900">Cash withdrawals to pay</h2>
        {!pending ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : pending.length === 0 ? (
          <p className="text-sm text-gray-500">None waiting.</p>
        ) : (
          pending.map((p) => (
            <div key={p.id} className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-gray-600 space-y-0.5">
                <p className="text-sm font-bold text-gray-900">
                  {usd(p.amount)} · {p.member?.name || 'Member'} <span className="font-normal text-gray-500">{p.member?.email}</span>
                </p>
                <p>
                  {p.bankName} · {p.accountName} · {p.accountNumber}
                  {p.routingNumber && ` · ${p.routingNumber}`}
                </p>
                <p>Requested {new Date(p.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => decide(p.id, 'reject')} disabled={!!busy} className="px-3 py-2 rounded-lg border border-gray-300 text-xs font-bold text-gray-700 cursor-pointer">
                  Return to wallet
                </button>
                <button type="button" onClick={() => decide(p.id, 'paid')} disabled={!!busy} className="px-3 py-2 rounded-lg bg-[#0F1C3F] text-white text-xs font-bold cursor-pointer">
                  Mark as paid
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
