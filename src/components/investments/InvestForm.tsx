'use client'

import { useState } from 'react'
import { AlertTriangle, CreditCard, RefreshCw } from 'lucide-react'

// Opens Stripe Checkout for an investment; it is created once the payment succeeds
export default function InvestForm({ opportunityId, minAmount, maxAmount }: { opportunityId: string; minAmount: number; maxAmount: number | null }) {
  const [amount, setAmount] = useState(String(minAmount))
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const value = parseFloat(amount) || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setPaying(true)
    try {
      const res = await fetch(`/api/investments/${opportunityId}/invest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: value }),
      })
      const data = await res.json()
      if (!res.ok || !data.checkoutUrl) throw new Error(data.error || 'Could not start the payment.')
      window.location.href = data.checkoutUrl
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
      {error && (
        <p className="text-xs text-rose-700 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
      <button
        type="submit"
        disabled={paying || value < minAmount}
        className="w-full py-3.5 px-4 bg-[#0F1C3F] hover:bg-[#162c5e] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
      >
        {paying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
        {paying ? 'Opening secure payment…' : `Invest $${value.toLocaleString()} by card`}
      </button>
      <p className="text-[11px] text-gray-400 text-center">Payments are processed by Stripe. Investments carry risk, including loss of capital.</p>
    </form>
  )
}
