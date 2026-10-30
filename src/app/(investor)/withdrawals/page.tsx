'use client'

import { useState, useEffect } from 'react'
import {
  ArrowRight,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  X,
  Lock,
  HeartHandshake,
  UserCheck,
  UserX,
  Check,
} from 'lucide-react'

interface PartnerApprovalMeta {
  requiresPartnerApproval?: boolean
  partnerApprovalStatus?: 'AWAITING_PARTNER' | 'APPROVED' | 'REJECTED' | 'NOT_REQUIRED'
  requestedByName?: string
  partnerName?: string
  partnerApprovedAt?: string
  partnerRejectedAt?: string
  partnerSignature?: string
  partnerNote?: string
}

interface WithdrawalItem {
  id: string
  amount: number
  fee: number
  netAmount: number
  status: string
  bankName: string | null
  accountNumber: string | null
  adminNote: string | null
  partnerApproval?: PartnerApprovalMeta | null
  createdAt: string
  investment: {
    referenceNumber: string
    opportunity: { title: string }
  }
}

interface PendingPartnerApproval {
  id: string
  amount: number
  fee: number
  netAmount: number
  bankName: string | null
  accountNumber: string | null
  createdAt: string
  requesterId: string
  requesterName: string
  partnerName: string
  opportunityTitle: string
  referenceNumber?: string
  partnerApprovalStatus: string
  requiresPartnerApproval: boolean
}

interface ActiveInvestment {
  id: string
  referenceNumber: string
  amount: number
  opportunity: { title: string; termMonths: number }
  status: string
}

// Confirmation step: shows the fees the server will deduct before the request is sent
function ConfirmWithdrawalPanel({
  amount,
  selectedInvestment,
  partnerName,
  onContinue,
  onCancel,
}: {
  amount: number
  selectedInvestment: ActiveInvestment | undefined
  partnerName: string
  onContinue: () => void
  onCancel: () => void
}) {
  const fee = amount * 0.02
  const penalty = amount * 0.01

  const USD = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)

  const isSolo = selectedInvestment?.referenceNumber?.startsWith('SOLO-')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-6">
        <div className="bg-[#0F1C3F] p-5 text-white flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C9A84C]">Confirm withdrawal</span>
            <h3 className="text-lg font-bold">{USD(amount)}</h3>
            {selectedInvestment && (
              <p className="text-xs text-slate-300">From {selectedInvestment.opportunity.title}</p>
            )}
          </div>
          <button onClick={onCancel} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5 text-sm text-slate-700">
            <div className="flex justify-between"><span>Withdrawal fee (2%)</span><span>-{USD(fee)}</span></div>
            <div className="flex justify-between"><span>Early withdrawal penalty (1%)</span><span>-{USD(penalty)}</span></div>
            <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1.5">
              <span>You will receive</span><span>{USD(Math.max(0, amount - fee - penalty))}</span>
            </div>
          </div>

          {!isSolo && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <HeartHandshake size={14} className="text-amber-700 flex-shrink-0 mt-0.5" />
              <span>
                This is a joint withdrawal, so <strong>{partnerName}</strong> has to approve it before it is processed.
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-2xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onContinue}
              className="flex-1 py-3 rounded-2xl bg-[#0F1C3F] text-white font-bold text-sm hover:bg-[#1a2f64] transition-colors"
            >
              {isSolo ? 'Submit request' : `Submit and ask ${partnerName}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([])
  const [eligibleInvestments, setEligibleInvestments] = useState<ActiveInvestment[]>([])
  const [pendingPartnerApprovals, setPendingPartnerApprovals] = useState<PendingPartnerApproval[]>([])
  const [partnerName, setPartnerName] = useState('your partner')
  const [selectedInvestmentId, setSelectedInvestmentId] = useState('')
  const [amount, setAmount] = useState('1000')
  const [bankName, setBankName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [routingNumber, setRoutingNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [hasPendingReciprocation, setHasPendingReciprocation] = useState(false)
  const [pendingReciprocation, setPendingReciprocation] = useState<any>(null)

  const feePercent = 0.02
  const penaltyPercent = 0.01
  const numAmount = parseFloat(amount) || 0
  const feeAmount = numAmount * feePercent
  const penaltyAmount = numAmount * penaltyPercent
  const netAmount = Math.max(0, numAmount - feeAmount - penaltyAmount)
  const selectedInvestment = eligibleInvestments.find((i) => i.id === selectedInvestmentId)
  const isSolo = selectedInvestment?.referenceNumber?.startsWith('SOLO-')

  const loadData = () => {
    fetch('/api/withdrawals')
      .then((res) => res.json())
      .then((data) => {
        if (data.withdrawals) setWithdrawals(data.withdrawals)
        if (data.eligibleInvestments) {
          setEligibleInvestments(data.eligibleInvestments)
          if (!selectedInvestmentId && data.eligibleInvestments.length > 0) {
            setSelectedInvestmentId(data.eligibleInvestments[0].id)
          }
        }
        if (data.pendingPartnerApprovals) {
          setPendingPartnerApprovals(data.pendingPartnerApprovals)
        }
        if (data.partnerName) {
          setPartnerName(data.partnerName)
        }
        if (typeof data.hasPendingReciprocation === 'boolean') {
          setHasPendingReciprocation(data.hasPendingReciprocation)
        }
        if (data.pendingReciprocation) {
          setPendingReciprocation(data.pendingReciprocation)
        }
      })
      .catch((err) => console.error(err))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!selectedInvestmentId) {
      setError('Please select an investment to withdraw from.')
      return
    }
    if (!isSolo && hasPendingReciprocation) {
      setError(
        `Withdrawal locked: reciprocate ${pendingReciprocation?.depositorName || partnerName}'s deposit first ($${Number(pendingReciprocation?.amount || 0).toLocaleString()}).`
      )
      return
    }
    if (numAmount < 100) {
      setError('Minimum withdrawal request is $100.')
      return
    }
    if (!bankName || !accountName || !accountNumber) {
      setError('Please fill in all bank account details.')
      return
    }
    // Show the fee breakdown before sending
    setShowConfirm(true)
  }

  const handleConfirmedWithdrawal = async () => {
    setShowConfirm(false)
    setLoading(true)
    setError('')
    try {
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
          partnerName,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Withdrawal request failed.')
      setSuccess(true)
      setSuccessMessage(
        data.partnerApprovalRequired
          ? `Withdrawal of $${numAmount.toLocaleString()} submitted. ${partnerName} needs to approve it before it is processed.`
          : `Withdrawal of $${numAmount.toLocaleString()} submitted for processing.`
      )
      setAmount('1000')
      setBankName('')
      setAccountName('')
      setAccountNumber('')
      setRoutingNumber('')
      loadData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Partner Approves withdrawal
  const handlePartnerApprove = async (withdrawalId: string) => {
    setActionLoading(withdrawalId)
    setError('')
    try {
      const res = await fetch(`/api/withdrawals/${withdrawalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'partner_approve' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to approve withdrawal')
      setSuccess(true)
      setSuccessMessage(`You approved ${partnerName}'s withdrawal. It will now be processed.`)
      loadData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Partner Declines withdrawal
  const handlePartnerReject = async (withdrawalId: string) => {
    setActionLoading(withdrawalId)
    setError('')
    try {
      const res = await fetch(`/api/withdrawals/${withdrawalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'partner_reject' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to decline withdrawal')
      setSuccess(true)
      setSuccessMessage(`Withdrawal declined. The funds stay in your joint savings.`)
      loadData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-indigo-100 text-indigo-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">
      {/* Confirmation Modal */}
      {showConfirm && (
        <ConfirmWithdrawalPanel
          amount={numAmount}
          selectedInvestment={selectedInvestment}
          partnerName={partnerName}
          onContinue={handleConfirmedWithdrawal}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F1C3F]/10 text-[#0F1C3F] text-xs font-bold uppercase tracking-wider mb-1.5">
            <HeartHandshake className="w-3.5 h-3.5 text-[#C9A84C]" />
            Withdrawals
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F1C3F]">Withdrawals &amp; Partner Approvals</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Withdrawals from joint savings need your partner&apos;s approval before they are processed.
          </p>
        </div>
      </div>

      {/* ── RECIPROCATION LOCK BANNER ── */}
      {hasPendingReciprocation && (
        <div className="rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-red-300">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Lock className="w-6 h-6 text-amber-200" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-black/30 px-2.5 py-0.5 rounded-full text-amber-200">
                  Reciprocate first
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black">
                Joint withdrawals are locked until you reciprocate
              </h3>
              <p className="text-xs text-red-100 leading-relaxed max-w-xl">
                {pendingReciprocation?.depositorName || partnerName} made a deposit into your joint savings. Reciprocate ${Number(pendingReciprocation?.amount || 0).toLocaleString()} to unlock joint withdrawals.
              </p>
            </div>
          </div>
          <form method="post" action="/pay/match" className="flex-shrink-0">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white text-[#0F1C3F] font-black text-xs sm:text-sm shadow-lg hover:bg-slate-100 transition-all transform hover:scale-105 cursor-pointer"
            >
              Reciprocate ${Number(pendingReciprocation?.amount || 0).toLocaleString()}
              <ArrowRight size={14} />
            </button>
          </form>
        </div>
      )}

      {/* ── SPOUSE'S REQUESTS WAITING FOR MY APPROVAL ── */}
      {pendingPartnerApprovals.length > 0 && (
        <div className="rounded-3xl border-2 border-[#C9A84C] bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 shadow-lg space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/70 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#0F1C3F] flex items-center justify-center text-[#C9A84C]">
                <HeartHandshake size={20} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#C9A84C] block">
                  Approval needed
                </span>
                <h3 className="text-base font-black text-[#0F1C3F]">
                  Withdrawal requests from your partner ({pendingPartnerApprovals.length})
                </h3>
              </div>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-amber-200/80 text-amber-900 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Lock size={12} />
              Waiting for you
            </span>
          </div>

          <p className="text-xs text-gray-700 leading-relaxed">
            Your partner asked to withdraw from your joint savings. The request is not processed unless you approve it.
          </p>

          <div className="space-y-3">
            {pendingPartnerApprovals.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{req.requesterName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                      Partner request
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    From: <strong className="text-slate-800">{req.opportunityTitle}</strong>
                  </div>
                  <div className="text-xs text-slate-500">
                    Requested on {new Date(req.createdAt).toLocaleDateString()} {req.bankName ? ` · Bank: ${req.bankName}` : ''}
                  </div>
                </div>

                <div className="flex flex-col md:items-end">
                  <span className="text-xs text-slate-400 font-medium uppercase">Requested Amount</span>
                  <span className="text-xl font-black text-[#0F1C3F]">${req.amount.toLocaleString()}</span>
                  <span className="text-[11px] text-red-600 font-medium">Net after fees: ${req.netAmount.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2 pt-2 md:pt-0">
                  <button
                    type="button"
                    disabled={actionLoading === req.id}
                    onClick={() => handlePartnerApprove(req.id)}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <UserCheck size={14} />
                    {actionLoading === req.id ? 'Saving...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading === req.id}
                    onClick={() => handlePartnerReject(req.id)}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-300 text-red-700 font-bold text-xs hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <UserX size={14} />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Early Withdrawal Warning Banner */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-amber-900">Fees and approval</h4>
          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
            Each withdrawal has a <strong>2% fee</strong> plus a <strong>1% early withdrawal penalty</strong>, deducted from the amount.
            For joint savings, {partnerName} is asked to approve the request before it is processed.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Request a Withdrawal</h2>
            {isSolo ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Solo Account</span>
            ) : (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#C9A84C]/20 text-[#0F1C3F] border border-[#C9A84C]/40">
                Joint · needs partner approval
              </span>
            )}
          </div>

          {success && (
            <div className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Done</p>
                <p className="text-xs text-emerald-700 mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmitRequest} className="space-y-4">
            {/* Investment Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Withdraw from</label>
              {eligibleInvestments.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                  No eligible investments available for withdrawal.
                </div>
              ) : (
                <select
                  value={selectedInvestmentId}
                  onChange={(e) => setSelectedInvestmentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#C9A84C] bg-white"
                  required
                >
                  {eligibleInvestments.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.opportunity.title} · ${Number(inv.amount).toLocaleString()} · Ref: {inv.referenceNumber}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Withdrawal Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#C9A84C]"
                  required
                />
              </div>

              {/* Fee breakdown */}
              {numAmount > 0 && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs space-y-1">
                  <div className="flex justify-between text-red-700">
                    <span>Withdrawal fee (2%)</span><span className="font-bold">–${feeAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-orange-700">
                    <span>Early withdrawal penalty (1%)</span><span className="font-bold">–${penaltyAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-black border-t border-red-200 pt-1">
                    <span>You Will Receive</span><span className="text-emerald-700">${netAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={13} />
                Bank Account Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)}
                  className="col-span-2 w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#C9A84C]" required />
                <input type="text" placeholder="Account Holder Name" value={accountName} onChange={(e) => setAccountName(e.target.value)}
                  className="col-span-2 w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#C9A84C]" required />
                <input type="text" placeholder="Account Number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#C9A84C]" required />
                <input type="text" placeholder="Routing / SWIFT (optional)" value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#C9A84C]" />
              </div>
            </div>

            {!isSolo && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <HeartHandshake size={15} className="text-amber-700 flex-shrink-0 mt-0.5" />
                <span>
                  Once you submit, <strong>{partnerName}</strong> is notified and has to approve the withdrawal before it is processed.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || eligibleInvestments.length === 0 || (!isSolo && hasPendingReciprocation)}
              className="w-full py-3.5 rounded-2xl bg-[#0F1C3F] text-white font-bold text-sm hover:bg-[#1a2f64] transition-colors disabled:opacity-50"
            >
              {loading
                ? 'Processing...'
                : !isSolo && hasPendingReciprocation
                ? `Locked: reciprocate ${pendingReciprocation?.depositorName || partnerName}'s deposit first`
                : 'Review withdrawal'}
            </button>
          </form>
        </div>

        {/* Withdrawal History */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Withdrawal History</h2>
            <span className="text-xs text-slate-400">{withdrawals.length} Total</span>
          </div>
          <div className="divide-y divide-slate-100">
            {withdrawals.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No withdrawal requests yet</p>
              </div>
            ) : (
              withdrawals.map((w) => {
                const partnerMeta = w.partnerApproval
                const isWaitingSpouse = partnerMeta?.partnerApprovalStatus === 'AWAITING_PARTNER'
                const isSpouseApproved = partnerMeta?.partnerApprovalStatus === 'APPROVED'
                const isSpouseRejected = partnerMeta?.partnerApprovalStatus === 'REJECTED'

                return (
                  <div key={w.id} className="px-5 py-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">${Number(w.amount).toLocaleString()}</span>
                      <div className="flex items-center gap-1.5">
                        {isWaitingSpouse && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <Clock size={11} />
                            Waiting for partner
                          </span>
                        )}
                        {isSpouseApproved && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <Check size={11} />
                            Partner approved
                          </span>
                        )}
                        {isSpouseRejected && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                            <X size={11} />
                            Declined by partner
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColors[w.status] || 'bg-gray-100 text-gray-600'}`}>
                          {w.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600">{w.investment?.opportunity?.title}</p>
                    {w.bankName && <p className="text-xs text-slate-400">{w.bankName} · ****{w.accountNumber?.slice(-4)}</p>}

                    {isWaitingSpouse && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1">
                        Waiting for {partnerMeta?.partnerName || partnerName} to approve.
                      </p>
                    )}

                    {isSpouseApproved && (
                      <p className="text-[11px] text-emerald-700 bg-emerald-50 rounded px-2 py-1">
                        Approved by your partner.
                      </p>
                    )}

                    <p className="text-[11px] text-slate-400">{new Date(w.createdAt).toLocaleDateString()}</p>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
