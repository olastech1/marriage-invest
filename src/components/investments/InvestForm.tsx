'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CreditCard, RefreshCw, Wallet } from 'lucide-react'

type Source = 'card' | 'wallet' | 'credit'

const usd = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

// Pay by card (Stripe Checkout, created once paid) or from the wallet's cash or credit balance
export default function InvestForm({ opportunityId, minAmount, maxAmount }: { opportunityId: string; minAmount: number; maxAmount: number | null }) {
  const router = useRouter()
  const [amount, setAmount] = useState(String(minAmount))
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [balances, setBalances] = useState<{ cash: number; credit: number } | null>(null)
  const [source, setSource] = useState<Source>('card')
  const value = parseFloat(amount) || 0

  useEffect(() => {
    fetch('/api/wallet')
      .then((r) => r.json())
      .then((d) => d.success && setBalances({ cash: d.cash, credit: d.credit }))
      .catch(() => {})
  }, [])

  const options: { id: Source; label: string; note: string }[] = [
    { id: 'card', label: 'Card', note: 'Paid securely by Stripe' },
    ...(balances && balances.cash > 0 ? [{ id: 'wallet' as const, label: 'Wallet cash', note: `${usd(balances.cash)} available` }] : []),
    ...(balances && balances.credit > 0 ? [{ id: 'credit' as const, label: 'Credit', note: `${usd(balances.credit)} available. Can't be withdrawn` }] : []),
  ]
  const available = source === 'wallet' ? balances?.cash ?? 0 : source === 'credit' ? balances?.credit ?? 0 : Infinity
  const short = value > available

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setPaying(true)
    try {
      const res = await fetch(`/api/investments/${opportunityId}/invest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: value, source }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not start the payment.')
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
      setDone(data.message)
      router.push(data.nextUrl || '/portfolio')
    } catch (err: any) {
      setError(err.message)
      setPaying(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-xs font-semibold text-gray-600">
        Amount (USD)
        <input
          type="number"
          min={minAmount}
          max={maxAmount ?? undefined}
          step="0.01"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-300 text-base sm:text-sm focus:outline-none focus:border-[#C9A84C]"
        />
      </label>
      {options.length > 1 && (
        <fieldset className="space-y-1.5">
          <legend className="text-xs font-semibold text-gray-600 mb-1">Pay with</legend>
          {options.map((o) => (
            <label
              key={o.id}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer ${source === o.id ? 'border-[#0F1C3F] bg-gray-50' : 'border-gray-200'}`}
            >
              <input type="radio" name="source" checked={source === o.id} onChange={() => setSource(o.id)} className="accent-[#0F1C3F]" />
              <span className="text-sm font-semibold text-[#0F1C3F]">{o.label}</span>
              <span className="text-[11px] text-gray-500 ml-auto text-right">{o.note}</span>
            </label>
          ))}
        </fieldset>
      )}
      {short && <p className="text-xs text-rose-700">That&apos;s more than your {source === 'credit' ? 'credit' : 'wallet cash'} balance.</p>}
      {error && (
        <p className="text-xs text-rose-700 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
      {done && <p className="text-xs text-emerald-700">{done}</p>}
      <button
        type="submit"
        disabled={paying || value < minAmount || short}
        className="w-full py-3.5 px-4 bg-[#0F1C3F] hover:bg-[#162c5e] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
      >
        {paying ? <RefreshCw className="w-4 h-4 animate-spin" /> : source === 'card' ? <CreditCard className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
        {paying
          ? source === 'card'
            ? 'Opening secure payment…'
            : 'Investing…'
          : source === 'card'
            ? `Invest ${usd(value)} by card`
            : `Invest ${usd(value)} from ${source === 'credit' ? 'credit' : 'wallet'}`}
      </button>
      <p className="text-[11px] text-gray-400 text-center">
        {source === 'credit' ? "Investments paid with credit can't be withdrawn." : 'Card payments are processed by Stripe.'} Investments carry risk, including loss of capital.
      </p>
    </form>
  )
}
