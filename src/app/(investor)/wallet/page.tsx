'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, ArrowUpFromLine, CreditCard, Plus, RefreshCw, Wallet } from 'lucide-react'

type Entry = { id: string; kind: 'CASH' | 'CREDIT'; amount: number; reason: string; createdAt: string }
type Withdrawal = { id: string; amount: number; status: 'PENDING' | 'PAID' | 'REJECTED'; bankName: string; accountEnding: string; adminNote: string | null; createdAt: string }
type Data = { cash: number; credit: number; entries: Entry[]; withdrawals: Withdrawal[] }

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
const input = 'w-full min-w-0 px-3 py-2.5 rounded-xl border border-gray-300 text-base sm:text-sm focus:outline-none focus:border-[#C9A84C]'

function WalletContent() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<Data | null>(null)
  const [amount, setAmount] = useState('')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const [showWithdraw, setShowWithdraw] = useState(false)
  const [w, setW] = useState({ amount: '', bankName: '', accountName: '', accountNumber: '', routingNumber: '' })
  const [withdrawNote, setWithdrawNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)

  const load = useCallback(() => {
    fetch('/api/wallet')
      .then((r) => r.json())
      .then((d) => d.success && setData(d))
      .catch(() => {})
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const post = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/wallet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return res.json()
  }

  const topUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setPaying(true)
    try {
      const d = await post({ action: 'topup', amount: parseFloat(amount) })
      if (!d.success || !d.checkoutUrl) throw new Error(d.error || 'Could not start the payment.')
      window.location.href = d.checkoutUrl
    } catch (err) {
      setError((err as Error).message)
      setPaying(false)
    }
  }

  const withdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setWithdrawing(true)
    setWithdrawNote(null)
    try {
      const d = await post({ action: 'withdraw', ...w, amount: parseFloat(w.amount) })
      setWithdrawNote({ ok: !!d.success, text: d.message || d.error || 'Something went wrong.' })
      if (d.success) {
        setW({ amount: '', bankName: '', accountName: '', accountNumber: '', routingNumber: '' })
        setShowWithdraw(false)
        load()
      }
    } catch {
      setWithdrawNote({ ok: false, text: 'Something went wrong.' })
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1C3F]">Wallet</h1>
        <p className="text-sm text-gray-500">Money you can invest with in one tap.</p>
      </div>

      {searchParams.get('checkout_canceled') === 'true' && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">Payment canceled. Nothing was charged.</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-[#0F1C3F] text-white p-5">
          <p className="text-xs text-white/70 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" /> Cash
          </p>
          <p className="text-3xl font-bold mt-1">{data ? usd(data.cash) : '—'}</p>
          <p className="text-[11px] text-white/60 mt-1">Invest it or withdraw it to your bank.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs text-gray-500">Credit</p>
          <p className="text-3xl font-bold text-[#0F1C3F] mt-1">{data ? usd(data.credit) : '—'}</p>
          <p className="text-[11px] text-gray-500 mt-1">For investing on Union Verify only. Credit can&apos;t be withdrawn.</p>
        </div>
      </div>

      {data && data.cash + data.credit > 0 && (
        <Link href="/solo" className="block text-center py-3 rounded-xl bg-[#C9A84C] text-[#0F1C3F] font-bold text-sm hover:bg-[#d4b460]">
          Browse investments →
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={topUp} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="font-bold text-[#0F1C3F] flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#C9A84C]" /> Add money
          </h2>
          <label className="block text-xs font-semibold text-gray-600">
            Amount (USD)
            <input type="number" min="10" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" className={`mt-1 ${input}`} />
          </label>
          {error && (
            <p className="text-xs text-rose-700 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
          <button
            type="submit"
            disabled={paying || !(parseFloat(amount) >= 10)}
            className="w-full py-3 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2f64] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {paying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {paying ? 'Opening secure payment…' : parseFloat(amount) >= 10 ? `Add ${usd(parseFloat(amount))} by card` : 'Add by card'}
          </button>
          <p className="text-[11px] text-gray-400">Minimum $10. Payments are processed by Stripe and go into your cash balance.</p>
        </form>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="font-bold text-[#0F1C3F] flex items-center gap-2">
            <ArrowUpFromLine className="w-5 h-5 text-[#C9A84C]" /> Withdraw cash
          </h2>
          {!showWithdraw ? (
            <>
              <p className="text-sm text-gray-500">Send your cash balance to your bank. Our team pays it out, usually within 3 business days.</p>
              <button
                type="button"
                onClick={() => setShowWithdraw(true)}
                disabled={!data || data.cash <= 0}
                className="w-full py-2.5 rounded-xl border border-[#0F1C3F] text-[#0F1C3F] font-bold text-sm hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
              >
                {data && data.cash <= 0 ? 'No cash to withdraw' : 'Withdraw'}
              </button>
            </>
          ) : (
            <form onSubmit={withdraw} className="space-y-2">
              <input required type="number" min="1" step="0.01" max={data?.cash} inputMode="decimal" placeholder={`Amount (up to ${usd(data?.cash || 0)})`} value={w.amount} onChange={(e) => setW({ ...w, amount: e.target.value })} className={input} />
              <input required placeholder="Bank name" value={w.bankName} onChange={(e) => setW({ ...w, bankName: e.target.value })} className={input} />
              <input required placeholder="Account name" value={w.accountName} onChange={(e) => setW({ ...w, accountName: e.target.value })} className={input} />
              <input required placeholder="Account number" inputMode="numeric" value={w.accountNumber} onChange={(e) => setW({ ...w, accountNumber: e.target.value })} className={input} />
              <input placeholder="Routing / sort code (if your bank has one)" value={w.routingNumber} onChange={(e) => setW({ ...w, routingNumber: e.target.value })} className={input} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowWithdraw(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-600 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={withdrawing} className="flex-1 py-2.5 rounded-xl bg-[#0F1C3F] text-white text-sm font-bold disabled:opacity-50 cursor-pointer">
                  {withdrawing ? 'Sending…' : 'Request withdrawal'}
                </button>
              </div>
            </form>
          )}
          {withdrawNote && <p className={`text-xs ${withdrawNote.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{withdrawNote.text}</p>}
          {data?.withdrawals.length ? (
            <ul className="divide-y divide-gray-100 pt-1">
              {data.withdrawals.map((x) => (
                <li key={x.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                  <span className="text-gray-600">
                    {new Date(x.createdAt).toLocaleDateString()} · {x.bankName} ••{x.accountEnding}
                    {x.status === 'REJECTED' && x.adminNote && <span className="block text-rose-700">{x.adminNote}</span>}
                  </span>
                  <span className="text-right">
                    <span className="font-bold text-[#0F1C3F] block">{usd(x.amount)}</span>
                    <span className={x.status === 'PAID' ? 'text-emerald-700' : x.status === 'REJECTED' ? 'text-rose-700' : 'text-amber-700'}>
                      {x.status === 'PAID' ? 'Paid' : x.status === 'REJECTED' ? 'Returned to wallet' : 'In progress'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-bold text-[#0F1C3F] mb-3">History</h2>
        {!data ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : data.entries.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing yet. Add money to get started.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.entries.map((e) => (
              <li key={e.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{e.reason}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(e.createdAt).toLocaleDateString()} · {e.kind === 'CREDIT' ? 'Credit' : 'Cash'}
                  </p>
                </div>
                <span className={`text-sm font-bold whitespace-nowrap ${e.amount > 0 ? 'text-emerald-700' : 'text-[#0F1C3F]'}`}>
                  {e.amount > 0 ? '+' : '−'}
                  {usd(Math.abs(e.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function WalletPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-400">Loading…</div>}>
      <WalletContent />
    </Suspense>
  )
}
