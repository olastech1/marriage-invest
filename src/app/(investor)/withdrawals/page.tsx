'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  ArrowDownToLine,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
} from 'lucide-react'

interface WithdrawalItem {
  id: string
  amount: number
  fee: number
  netAmount: number
  status: string
  bankName: string | null
  accountNumber: string | null
  adminNote: string | null
  createdAt: string
  investment: {
    referenceNumber: string
    opportunity: { title: string }
  }
}

interface ActiveInvestment {
  id: string
  referenceNumber: string
  amount: number
  opportunity: { title: string; termMonths: number }
  status: string
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([])
  const [investments, setInvestments] = useState<ActiveInvestment[]>([])
  const [selectedInvestmentId, setSelectedInvestmentId] = useState('')
  const [amount, setAmount] = useState('1000')
  const [bankName, setBankName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [routingNumber, setRoutingNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const feePercent = 0.02 // 2% standard liquidity/processing fee
  const numAmount = parseFloat(amount) || 0
  const feeAmount = numAmount * feePercent
  const netAmount = Math.max(0, numAmount - feeAmount)

  const loadData = () => {
    fetch('/api/withdrawals')
      .then((res) => res.json())
      .then((data) => {
        if (data.withdrawals) setWithdrawals(data.withdrawals)
        if (data.eligibleInvestments) {
          setInvestments(data.eligibleInvestments)
          if (!selectedInvestmentId && data.eligibleInvestments.length > 0) {
            setSelectedInvestmentId(data.eligibleInvestments[0].id)
          }
        }
      })
      .catch((err) => console.error(err))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setSuccess(false)

    try {
      if (!selectedInvestmentId) {
        throw new Error('Please select an investment vehicle to withdraw from.')
      }
      if (numAmount <= 0) {
        throw new Error('Please enter a valid withdrawal amount.')
      }

      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investmentId: selectedInvestmentId,
          amount: numAmount,
          bankName,
          accountName,
          accountNumber,
          routingNumber,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Withdrawal submission failed')
      }

      setSuccess(true)
      loadData()
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting withdrawal request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1C3F]">Withdrawal & Payout Requests</h1>
        <p className="text-xs text-gray-500 mt-1">
          Submit capital redemption or distribution withdrawals in USD subject to contractual terms and administrative review.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-base font-bold text-[#0F1C3F] mb-6">
            Initiate USD Redemption Request
          </h2>

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Withdrawal Request Queued:</strong> Your request has been forwarded to the compliance and finance officers for dual review. You will receive an update once approved.
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Investment selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Select Investment Vehicle *
              </label>
              <select
                value={selectedInvestmentId}
                onChange={(e) => setSelectedInvestmentId(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white focus:ring-2 focus:ring-[#C9A84C] outline-none"
              >
                {investments.length === 0 ? (
                  <option value="">No eligible active investments found</option>
                ) : (
                  investments.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.referenceNumber} — {inv.opportunity.title} (${Number(inv.amount).toLocaleString()} USD)
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Requested Withdrawal Amount (USD $) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                  $
                </span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                />
              </div>
            </div>

            {/* Fee Calculation Breakdown */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Gross Withdrawal Amount:</span>
                <span className="font-semibold text-gray-900">${numAmount.toLocaleString()} USD</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Contractual Processing Fee (2%):</span>
                <span className="font-semibold text-gray-900">-${feeAmount.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-gray-900 font-bold pt-2 border-t border-gray-200">
                <span>Estimated Net Payout:</span>
                <span className="text-emerald-600 text-sm">${netAmount.toFixed(2)} USD</span>
              </div>
            </div>

            {/* Bank details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Recipient Bank Name *
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. JPMorgan Chase"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Jane & John Doe"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Account Number / IBAN *
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 123456789"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Routing (ABA) / SWIFT Code *
                </label>
                <input
                  type="text"
                  required
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  placeholder="e.g. 021000021"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || investments.length === 0}
              className="w-full py-3 rounded-xl bg-[#0F1C3F] hover:bg-[#162c5e] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ArrowDownToLine className="w-4 h-4 text-[#C9A84C]" />
              {loading ? 'Submitting to Review Queue...' : 'Submit Withdrawal Request'}
            </button>
          </form>
        </div>

        {/* Right Info Card */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-xs text-gray-600 space-y-4">
          <div className="flex items-center gap-2 font-bold text-[#0F1C3F]">
            <ShieldCheck className="w-5 h-5 text-[#C9A84C]" />
            <span>Dual Administrative Workflow</span>
          </div>
          <p className="leading-relaxed">
            To prevent unauthorized liquidations, every payout request is cross-checked against investor eligibility, AML thresholds, and available settled escrow balances.
          </p>
          <p className="leading-relaxed text-[11px] text-gray-400">
            Standard ACH / Wire disbursement time is 2 to 4 business days post administrative approval.
          </p>
        </div>
      </div>

      {/* Withdrawal History Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-base font-bold text-[#0F1C3F]">Withdrawal Request History</h2>
          <p className="text-xs text-gray-500">Track current status, administrative notes, and completed disbursements.</p>
        </div>

        {withdrawals.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            No withdrawal requests submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-6">Date Requested</th>
                  <th className="py-3 px-6">Associated Vehicle</th>
                  <th className="py-3 px-6">Gross Amount</th>
                  <th className="py-3 px-6">Fee (USD)</th>
                  <th className="py-3 px-6">Net Payout</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Admin Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-6 font-mono text-gray-500">
                      {formatDate(w.createdAt)}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-gray-900">
                      {w.investment?.opportunity?.title || 'Investment'}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">
                      {formatCurrency(Number(w.amount))}
                    </td>
                    <td className="py-3.5 px-6 text-gray-500 font-mono">
                      {formatCurrency(Number(w.fee))}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-emerald-600">
                      {formatCurrency(Number(w.netAmount))}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          w.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : w.status === 'APPROVED'
                            ? 'bg-blue-100 text-blue-800'
                            : w.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-gray-400 text-[11px]">
                      {w.adminNote || 'Under review'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
