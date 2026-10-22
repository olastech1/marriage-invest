'use client'

import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'

// Invite your spouse or anyone (by email) to invest in an opportunity
export default function InviteToInvest({ opportunityId, minAmount, compact = false }: { opportunityId: string; minAmount: number; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const [spouseName, setSpouseName] = useState<string | null>(null)
  const [to, setTo] = useState<'spouse' | 'email'>('email')
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (!open) return
    fetch('/api/savings/reciprocation')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.partnerId) {
          setSpouseName(data.partnerName)
          setTo('spouse')
        }
      })
      .catch(() => {})
  }, [open])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setResult(null)
    try {
      const res = await fetch(`/api/investments/${opportunityId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: to === 'spouse' ? 'spouse' : email, amount: amount ? Number(amount) : undefined, note }),
      })
      const data = await res.json()
      setResult({ ok: !!data.success, text: data.message || data.error || 'Something went wrong.' })
      if (data.success) {
        setEmail('')
        setNote('')
      }
    } catch {
      setResult({ ok: false, text: 'Something went wrong.' })
    } finally {
      setSending(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#0F1C3F] text-[#0F1C3F] font-bold hover:bg-gray-50 cursor-pointer ${
          compact ? 'px-3 py-1.5 text-xs' : 'w-full py-3 text-sm'
        }`}
      >
        <UserPlus className="w-4 h-4" /> Invite to invest
      </button>
    )
  }

  return (
    <form onSubmit={send} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3 text-left">
      <p className="text-sm font-bold text-[#0F1C3F]">Invite someone to invest</p>
      {spouseName && (
        <div className="flex gap-2 text-xs">
          <label className={`flex-1 rounded-xl border px-3 py-2 cursor-pointer ${to === 'spouse' ? 'border-[#C9A84C] bg-[#C9A84C]/10' : 'border-gray-200'}`}>
            <input type="radio" name="to" className="mr-1.5" checked={to === 'spouse'} onChange={() => setTo('spouse')} />
            {spouseName}
          </label>
          <label className={`flex-1 rounded-xl border px-3 py-2 cursor-pointer ${to === 'email' ? 'border-[#C9A84C] bg-[#C9A84C]/10' : 'border-gray-200'}`}>
            <input type="radio" name="to" className="mr-1.5" checked={to === 'email'} onChange={() => setTo('email')} />
            Someone else
          </label>
        </div>
      )}
      {to === 'email' && (
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Their email address"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-base sm:text-sm focus:outline-none focus:border-[#C9A84C]"
        />
      )}
      <input
        type="number"
        min={minAmount}
        step="0.01"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={`Suggested amount (optional, min $${minAmount.toLocaleString()})`}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-base sm:text-sm focus:outline-none focus:border-[#C9A84C]"
      />
      <input
        type="text"
        maxLength={300}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Message (optional)"
        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-base sm:text-sm focus:outline-none focus:border-[#C9A84C]"
      />
      {result && <p className={`text-xs ${result.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{result.text}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 cursor-pointer">
          Close
        </button>
        <button type="submit" disabled={sending} className="px-4 py-2 rounded-xl bg-[#0F1C3F] text-white text-xs font-bold disabled:opacity-50 cursor-pointer">
          {sending ? 'Sending…' : 'Send invitation'}
        </button>
      </div>
    </form>
  )
}
