'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import {
  DollarSign,
  CreditCard,
  Building2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Copy,
} from 'lucide-react'

interface Opportunity {
  id: string
  title: string
  minAmount: number
  maxAmount: number | null
  termMonths: number
  annualReturnRate: number
  targetAmount: number
  fundedAmount: number
}

function DepositsContent() {
  const searchParams = useSearchParams()
  const initialOppId = searchParams.get('opportunityId') || ''

  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [selectedOppId, setSelectedOppId] = useState(initialOppId)
  const [amount, setAmount] = useState<string>('5000')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successResult, setSuccessResult] = useState<any>(null)
  const [copiedField, setCopiedField] = useState('')

  useEffect(() => {
    fetch('/api/investments')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.opportunities || []
        if (list.length > 0) {
          setOpportunities(list)
          if (!selectedOppId) {
            setSelectedOppId(list[0].id)
          }
        }
      })
      .catch((err) => console.error(err))
  }, [selectedOppId])

  const selectedOpp = opportunities.find((o) => o.id === selectedOppId)

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Please enter a valid investment amount.')
      }

      if (selectedOpp && numAmount < selectedOpp.minAmount) {
        throw new Error(`Minimum investment for this fund is $${selectedOpp.minAmount.toLocaleString()}`)
      }

      const res = await fetch(`/api/investments/${selectedOppId}/invest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate investment')
      }

      setSuccessResult(data)
    } catch (err: any) {
      setError(err.message || 'An error occurred while initiating your investment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1C3F]">Deposit & Investment Funding</h1>
        <p className="text-xs text-gray-500 mt-1">
          Commit capital to selected marriage investment opportunities in United States Dollars (USD $).
        </p>
      </div>

      {successResult ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-[#0F1C3F] mb-2">
            Investment Order Initiated
          </h2>
          <p className="text-xs text-gray-600 max-w-md mx-auto mb-6">
            Your investment order for <strong>${parseFloat(amount).toLocaleString()} USD</strong> in{' '}
            <strong>{successResult.opportunity?.title}</strong> has been registered.
          </p>

          <div className="bg-gray-50 rounded-xl p-5 max-w-md mx-auto text-left space-y-2.5 text-xs mb-8 border border-gray-200">
            <div className="flex justify-between">
              <span className="text-gray-500">Investment Reference:</span>
              <span className="font-mono font-bold text-gray-900">{successResult.investmentRef}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction Reference:</span>
              <span className="font-mono font-bold text-gray-900">{successResult.transactionRef}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Status:</span>
              <span className="font-bold text-amber-600">Pending Settlement</span>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <a
              href="/portfolio"
              className="px-6 py-2.5 rounded-xl bg-[#0F1C3F] text-white text-xs font-semibold hover:bg-[#162c5e]"
            >
              View in Portfolio
            </a>
            <button
              onClick={() => setSuccessResult(null)}
              className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50"
            >
              Create Another Order
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Deposit Form */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Fund Opportunity Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Select Investment Opportunity *
                </label>
                <select
                  value={selectedOppId}
                  onChange={(e) => setSelectedOppId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none bg-white"
                >
                  {opportunities.map((opp) => (
                    <option key={opp.id} value={opp.id}>
                      {opp.title} — Min ${Number(opp.minAmount).toLocaleString()} USD ({opp.termMonths} Mo)
                    </option>
                  ))}
                </select>
              </div>

              {/* Contribution Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Contribution Amount (USD $) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    step="100"
                    min={selectedOpp?.minAmount || 1000}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                    placeholder="5,000"
                  />
                </div>
                {selectedOpp && (
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Minimum contribution: ${Number(selectedOpp.minAmount).toLocaleString()} USD
                  </p>
                )}
              </div>

              {/* Payment Method Switcher */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Select Settlement Method *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-colors ${
                      paymentMethod === 'card'
                        ? 'border-[#C9A84C] bg-[#C9A84C]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-[#C9A84C] mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">Card Payment</span>
                      <span className="text-[10px] text-gray-500">Instant digital checkout</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-colors ${
                      paymentMethod === 'bank'
                        ? 'border-[#C9A84C] bg-[#C9A84C]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-[#C9A84C] mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">USD Wire / ACH</span>
                      <span className="text-[10px] text-gray-500">Bank deposit instructions</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Wire details display if bank selected */}
              {paymentMethod === 'bank' && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                  <span className="font-bold text-[#0F1C3F] block">Wire Settlement Instructions:</span>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Beneficiary: Union Invest Escrow LLC</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Routing (ABA): 021000021</span>
                    <button
                      type="button"
                      onClick={() => handleCopy('021000021', 'routing')}
                      className="text-[#C9A84C] text-[10px] underline"
                    >
                      {copiedField === 'routing' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Account Number: 849204918239</span>
                    <button
                      type="button"
                      onClick={() => handleCopy('849204918239', 'acc')}
                      className="text-[#C9A84C] text-[10px] underline"
                    >
                      {copiedField === 'acc' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 pt-1">
                    Please reference your investor email in the transfer notes for automated reconciliation.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#0F1C3F] hover:bg-[#162c5e] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Lock className="w-4 h-4 text-[#C9A84C]" />
                {loading ? 'Processing Order...' : `Commit $${parseFloat(amount || '0').toLocaleString()} USD to Fund`}
              </button>
            </form>
          </div>

          {/* Right Col: Trust & Safety */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-xs text-gray-600 space-y-4">
              <div className="flex items-center gap-2 font-bold text-[#0F1C3F]">
                <ShieldCheck className="w-5 h-5 text-[#C9A84C]" />
                <span>Institutional Escrow</span>
              </div>
              <p className="leading-relaxed">
                All submitted investment funds are maintained in segregated custody escrow accounts until official opportunity closing and formal certificate issuance.
              </p>
              <div className="pt-2 border-t border-gray-200 text-[11px] text-gray-400">
                🔒 Webhook signature verified. Duplicate-payment protected.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DepositsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      }
    >
      <DepositsContent />
    </Suspense>
  )
}
