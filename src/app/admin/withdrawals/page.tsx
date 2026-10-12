'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Building2,
  User,
  ShieldAlert,
} from 'lucide-react'

interface WithdrawalRequest {
  id: string
  amount: number
  fee: number
  netAmount: number
  status: string
  bankName: string | null
  accountName: string | null
  accountNumber: string | null
  routingNumber: string | null
  createdAt: string
  user: { name: string; email: string }
  investment: {
    referenceNumber: string
    opportunity: { title: string }
  }
}

export default function AdminWithdrawalsPage() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const fetchRequests = () => {
    fetch('/api/admin/withdrawals')
      .then((res) => res.json())
      .then((data) => {
        if (data.withdrawals) setRequests(data.withdrawals)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleDecision = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(`Withdrawal successfully ${action}d.`)
        fetchRequests()
      } else {
        alert(data.error || 'Failed to update withdrawal status')
      }
    } catch (e: any) {
      alert(e.message || 'Error executing decision')
    } finally {
      setActionLoading(null)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const pending = requests.filter((r) => r.status === 'PENDING')
  const history = requests.filter((r) => r.status !== 'PENDING')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Withdrawal & Payout Approval Queue</h1>
        <p className="text-xs text-gray-500 mt-1">
          Review, approve, or reject investor capital redemption requests with dual audit recordkeeping.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Pending Queue */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Pending Review Queue</h2>
            <p className="text-xs text-gray-500">Requires finance authorization before wire dispatch.</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            {pending.length} Pending Actions
          </span>
        </div>

        {pending.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            No pending withdrawal requests in the queue.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pending.map((req) => (
              <div key={req.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-[#0F1C3F]">{req.user.name}</span>
                    <span className="text-xs text-gray-400">({req.user.email})</span>
                  </div>

                  <div className="text-xs text-gray-600">
                    Vehicle: <strong>{req.investment?.opportunity?.title}</strong> • Ref: {req.investment?.referenceNumber}
                  </div>

                  <div className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex flex-wrap gap-4">
                    <span>Bank: <strong>{req.bankName}</strong></span>
                    <span>Beneficiary: <strong>{req.accountName}</strong></span>
                    <span>Account: <strong>{req.accountNumber}</strong></span>
                    <span>Routing: <strong>{req.routingNumber}</strong></span>
                  </div>

                  <div className="text-[11px] text-gray-400">
                    Requested on: {formatDate(req.createdAt)}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-lg font-bold text-[#0F1C3F] block">
                      ${Number(req.netAmount).toLocaleString()} USD
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Gross: ${Number(req.amount).toLocaleString()} • Fee: ${Number(req.fee).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecision(req.id, 'reject')}
                      disabled={actionLoading === req.id}
                      className="px-4 py-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleDecision(req.id, 'approve')}
                      disabled={actionLoading === req.id}
                      className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                    >
                      Approve & Wire
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decision History */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Historical Disbursed & Rejected Requests</h2>
          <p className="text-xs text-gray-500">Historical records archived for compliance auditing.</p>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            No historical requests processed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Investor</th>
                  <th className="py-3 px-6">Gross Amount</th>
                  <th className="py-3 px-6">Net Payout</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-6 font-mono text-gray-500">{formatDate(h.createdAt)}</td>
                    <td className="py-3.5 px-6 font-medium text-gray-900">{h.user.name}</td>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">{formatCurrency(Number(h.amount))}</td>
                    <td className="py-3.5 px-6 font-bold text-emerald-600">{formatCurrency(Number(h.netAmount))}</td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        h.status === 'APPROVED' || h.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {h.status}
                      </span>
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
