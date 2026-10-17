'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  PiggyBank,
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  DollarSign,
  Flame,
  Clock,
  Calendar,
  Plus,
  RefreshCw,
  BarChart3,
  Heart,
  Users,
  Scale,
  Zap,
  AlertTriangle,
  ShieldCheck,
  Bell,
  Mail,
  Phone,
  Trash2,
  Send,
  UserCheck,
  Filter,
} from 'lucide-react'

const APY = 0.068
const DAILY_RATE = APY / 365

function useLiveVaultBalance(principal: number) {
  const [balance, setBalance] = useState(principal)
  const startRef = useRef(principal)
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    startRef.current = principal
    startTimeRef.current = Date.now()
    setBalance(principal)

    const interval = setInterval(() => {
      const secondsElapsed = (Date.now() - startTimeRef.current) / 1000
      const earned = startRef.current * DAILY_RATE * (secondsElapsed / 86400)
      setBalance(startRef.current + earned)
    }, 100)

    return () => clearInterval(interval)
  }, [principal])

  return balance
}

const USD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 6, maximumFractionDigits: 6 }).format(n)

const USD2 = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

interface DepositItem {
  id: string
  reference?: string
  amount: number
  depositorName: string
  isCurrentUser: boolean
  vaultTitle: string
  status: 'APPROVED' | 'PENDING_MATCH'
  statusLabel: string
  canRemind: boolean
  partnerEmail: string
  partnerName: string
  createdAt: string | Date
}

interface DepositReminderItem {
  id: string
  userId: string
  targetPartnerName: string
  targetEmail: string
  amount: number
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'ONCE'
  dayOfWeek?: string
  dayOfMonth?: number
  time?: string
  note: string
  channels: ('EMAIL' | 'IN_APP' | 'CHAT_SYSTEM')[]
  active: boolean
  nextReminderDate: string
}

export default function SavePage() {
  const { data: session } = useSession()
  const currentUserName = session?.user?.name || 'Jane Doe'
  const partnerName = 'Marcus Vance'
  const partnerEmail = 'marcus.vance@unioninvest.com'
  const partnerPhone = '+1 (555) 782-9940'

  // Vault Principal State (starts clean at 0 on fresh site)
  const [vaultPrincipal, setVaultPrincipal] = useState(0)
  const [saveAmount, setSaveAmount] = useState('500')
  const [frequency, setFrequency] = useState<'ONCE' | 'WEEKLY' | 'MONTHLY'>('MONTHLY')
  const [beneficiary, setBeneficiary] = useState<'PARTNER' | 'JOINT'>('PARTNER')
  const [partnerNote, setPartnerNote] = useState('For our upcoming travel & future home ❤️')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')

  // Spousal Reciprocation Covenant State
  const [reciprocationData, setReciprocationData] = useState<any>(null)
  const [isReciprocalMatch, setIsReciprocalMatch] = useState(false)
  const [simulatingPartner, setSimulatingPartner] = useState(false)

  // Reminders & Nudges State
  const [reminders, setReminders] = useState<DepositReminderItem[]>([])
  const [showAddReminderModal, setShowAddReminderModal] = useState(false)
  const [reminderAmount, setReminderAmount] = useState('500')
  const [reminderFrequency, setReminderFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('MONTHLY')
  const [reminderTarget, setReminderTarget] = useState<'PARTNER' | 'SELF'>('PARTNER')
  const [reminderNote, setReminderNote] = useState('Remember our monthly $500 contribution for our joint matrimonial vault! ❤️')
  const [isNudging, setIsNudging] = useState(false)
  const [nudgeSuccessBanner, setNudgeSuccessBanner] = useState('')
  const [remindedDepositIds, setRemindedDepositIds] = useState<Record<string, boolean>>({})

  // Deposits Ledger State
  const [deposits, setDeposits] = useState<DepositItem[]>([])
  const [depositFilter, setDepositFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL')
  const [loadingDeposits, setLoadingDeposits] = useState(false)

  const liveBalance = useLiveVaultBalance(vaultPrincipal)
  const todayEarned = vaultPrincipal * DAILY_RATE
  const monthlyEarned = vaultPrincipal * (APY / 12)
  const yearlyEarned = vaultPrincipal * APY
  const numSaveAmount = parseFloat(saveAmount) || 0

  // Projection: if they add numSaveAmount
  const newTotal = vaultPrincipal + numSaveAmount
  const newDailyEarned = newTotal * DAILY_RATE
  const newMonthlyEarned = newTotal * (APY / 12)

  // -------------------------------------------------------------------------
  // Data Loaders
  // -------------------------------------------------------------------------
  const loadReciprocation = useCallback(async () => {
    try {
      const res = await fetch('/api/savings/reciprocation')
      const data = await res.json()
      if (data) {
        setReciprocationData(data)
      }
    } catch (err) {
      console.error('Failed to load reciprocation data', err)
    }
  }, [])

  const loadDeposits = useCallback(async () => {
    setLoadingDeposits(true)
    try {
      const res = await fetch('/api/savings/deposits')
      const data = await res.json()
      if (data.success && Array.isArray(data.deposits)) {
        setDeposits(data.deposits)
      }
    } catch (err) {
      console.error('Failed to load deposits', err)
    } finally {
      setLoadingDeposits(false)
    }
  }, [])

  const loadReminders = useCallback(async () => {
    try {
      const res = await fetch('/api/savings/reminders')
      const data = await res.json()
      if (data.success && Array.isArray(data.reminders)) {
        setReminders(data.reminders)
      }
    } catch (err) {
      console.error('Failed to load reminders', err)
    }
  }, [])

  useEffect(() => {
    loadReciprocation()
    loadDeposits()
    loadReminders()

    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.totalInvested === 'number') {
          setVaultPrincipal(data.totalInvested)
        }
      })
      .catch(() => {})
  }, [loadReciprocation, loadDeposits, loadReminders])

  const handleOneClickReciprocate = () => {
    const targetAmount = reciprocationData?.pendingReciprocation?.amount || 500
    setSaveAmount(String(targetAmount))
    setBeneficiary('JOINT')
    setIsReciprocalMatch(true)
    document.getElementById('save-deposit-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSimulatePartnerDeposit = async () => {
    setSimulatingPartner(true)
    setError('')
    try {
      const res = await fetch('/api/savings/reciprocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate_partner_deposit',
          amount: 500,
          partnerNote: 'I just saved $500 for our trip to Italy! Under our Spousal Covenant, you must match this deposit ❤️',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to simulate partner deposit')
      await loadReciprocation()
      await loadDeposits()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSimulatingPartner(false)
    }
  }

  // -------------------------------------------------------------------------
  // Handle Save / Add Savings to Dedicated Matrimonial Vault
  // -------------------------------------------------------------------------
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (numSaveAmount < 10) {
      setError('Minimum save amount is $10.')
      return
    }
    setLoading(true)
    try {
      // Find or auto-provision the dedicated couple vault
      let opp: any = null
      try {
        const res = await fetch('/api/investments', { method: 'GET' })
        if (res.ok) {
          const data = await res.json()
          const opps = Array.isArray(data) ? data : data.opportunities || []
          opp = opps.find((o: any) => o.id === 'opp_couple_joint') || opps[0]
        }
      } catch (e) {
        console.warn('Fallback to couple joint opportunity', e)
      }

      if (!opp) {
        opp = {
          id: 'opp_couple_joint',
          title: `${currentUserName} & ${partnerName} Spousal Contribution`,
        }
      }

      const investRes = await fetch(`/api/investments/${opp.id}/invest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numSaveAmount,
          frequency,
          beneficiary,
          partnerName,
          partnerNote: beneficiary === 'PARTNER' ? partnerNote : undefined,
          type: 'SAVE',
          isReciprocalMatch: isReciprocalMatch || (reciprocationData?.hasPendingReciprocation && numSaveAmount >= (reciprocationData?.pendingReciprocation?.amount || 0)),
        }),
      })
      const investData = await investRes.json()
      if (!investRes.ok) throw new Error(investData.error || 'Saving failed.')

      setVaultPrincipal((prev) => prev + numSaveAmount)
      setSuccess(true)
      if (isReciprocalMatch || reciprocationData?.hasPendingReciprocation) {
        setSuccessMessage(`✓ Spousal Reciprocation Fulfilled! You matched ${partnerName}'s deposit with $${numSaveAmount.toLocaleString()}. Both partners are in full financial parity and vault withdrawals are unlocked!`)
      } else {
        setSuccessMessage(`Savings added! Under Spousal Covenant Rule 4.2, ${partnerName} is now required to reciprocate with a matching deposit.`)
      }
      setIsReciprocalMatch(false)
      await loadReciprocation()
      await loadDeposits()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // -------------------------------------------------------------------------
  // Send Instant Nudge / Deposit Reminder
  // -------------------------------------------------------------------------
  const handleSendNudge = async (targetAmount = 500, noteText?: string, depositId?: string) => {
    setIsNudging(true)
    try {
      const res = await fetch('/api/savings/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_now',
          amount: targetAmount,
          targetPartnerName: partnerName,
          targetEmail: partnerEmail,
          vaultName: `${currentUserName} & ${partnerName} Spousal Contribution`,
          note: noteText || `Hey ${partnerName}, sending a deposit reminder to contribute $${targetAmount.toLocaleString()} to our joint matrimonial vault! ❤️`,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setNudgeSuccessBanner(`✓ Deposit reminder dispatched to ${partnerName} via Email (${partnerEmail}), In-App Alert, and Couple Chat!`)
        if (depositId) {
          setRemindedDepositIds((prev) => ({ ...prev, [depositId]: true }))
        }
        setTimeout(() => setNudgeSuccessBanner(''), 5000)
      }
    } catch (err) {
      console.error('Failed to send nudge:', err)
    } finally {
      setIsNudging(false)
    }
  }

  // -------------------------------------------------------------------------
  // Add Scheduled Deposit Reminder
  // -------------------------------------------------------------------------
  const handleCreateScheduledReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/savings/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_reminder',
          amount: Number(reminderAmount) || 500,
          targetPartnerName: reminderTarget === 'PARTNER' ? partnerName : currentUserName,
          targetEmail: reminderTarget === 'PARTNER' ? partnerEmail : (session?.user?.email || 'jane.doe@unioninvest.com'),
          vaultName: `${currentUserName} & ${partnerName} Spousal Contribution`,
          frequency: reminderFrequency,
          note: reminderNote,
          channels: ['EMAIL', 'IN_APP', 'CHAT_SYSTEM'],
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowAddReminderModal(false)
        setNudgeSuccessBanner(`✓ Scheduled ${reminderFrequency.toLowerCase()} deposit reminder created! Delivered via Email & System Chat.`)
        await loadReminders()
        setTimeout(() => setNudgeSuccessBanner(''), 4500)
      }
    } catch (err) {
      console.error('Failed to create reminder:', err)
    }
  }

  const handleDeleteReminder = async (id: string) => {
    try {
      await fetch(`/api/savings/reminders?id=${id}`, { method: 'DELETE' })
      setReminders((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error('Failed to delete reminder', err)
    }
  }

  const hasPendingReciprocation = Boolean(reciprocationData?.hasPendingReciprocation)
  const pendingReciprocation = reciprocationData?.pendingReciprocation

  const filteredDeposits = deposits.filter((d) => {
    if (depositFilter === 'APPROVED') return d.status === 'APPROVED'
    if (depositFilter === 'PENDING') return d.status === 'PENDING_MATCH'
    return true
  })

  return (
    <div className="space-y-6">
      {/* ── TOP NOTIFICATION BANNER ─────────────────────────────────── */}
      {nudgeSuccessBanner && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs sm:text-sm flex items-center justify-between shadow-lg animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 flex-shrink-0" />
            <span>{nudgeSuccessBanner}</span>
          </div>
          <button
            onClick={() => setNudgeSuccessBanner('')}
            className="text-white/80 hover:text-white text-xs px-2 py-1 rounded-lg bg-black/20"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Flame className="w-3.5 h-3.5 fill-emerald-600" />
            Your Live Joint Savings Vault · 6.8% APY
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F1C3F]">
            {currentUserName} & {partnerName} Matrimonial Vault
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Your personalized joint marriage savings vehicle compounds interest <strong>every single second</strong>. Under our Spousal Covenant, whenever one partner saves, the other must reciprocate.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => handleSendNudge(500)}
            disabled={isNudging}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Bell size={14} className="text-amber-600" />
            {isNudging ? 'Dispatching...' : `Nudge ${partnerName}`}
          </button>
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0F1C3F] text-white font-bold text-xs shadow-xs hover:bg-[#1a2f64] transition-colors"
          >
            <Users size={14} className="text-[#C9A84C]" />
            Spouse Chat
          </Link>
        </div>
      </div>

      {/* ── SPOUSE CONTACT QUICK CARD ───────────────────────────────── */}
      <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#0F1C3F] text-[#C9A84C] font-bold flex items-center justify-center text-xs">
            MV
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">{partnerName}</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                Online & Connected
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Mail size={12} className="text-[#C9A84C]" />
                {partnerEmail}
              </span>
              <span className="flex items-center gap-1">
                <Phone size={12} className="text-[#C9A84C]" />
                {partnerPhone}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddReminderModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F1C3F]/5 hover:bg-[#0F1C3F]/10 text-[#0F1C3F] font-bold text-[11px] transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Calendar size={13} className="text-[#C9A84C]" />
          + Add Deposit Reminder
        </button>
      </div>

      {/* ── LIVE VAULT BALANCE TICKER ───────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0F1C3F] via-[#162752] to-[#0F1C3F] p-6 sm:p-8 text-white shadow-xl border border-[#C9A84C]/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Compounding Live · Updated Every 100ms
              </span>
            </div>
            <span className="text-xs text-[#C9A84C] font-mono font-bold bg-[#C9A84C]/15 px-2.5 py-1 rounded-full border border-[#C9A84C]/30">
              6.8% APY Compound
            </span>
          </div>

          <div className="text-center space-y-1">
            <span className="text-[11px] text-slate-400 uppercase tracking-widest block">
              {currentUserName} & {partnerName} Joint Vault Balance
            </span>
            <div className="text-4xl sm:text-5xl font-black font-mono text-white tabular-nums">
              {USD(liveBalance)}
            </div>
            <p className="text-xs text-emerald-400 font-semibold">↑ Growing right now in real time</p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Today&apos;s Earnings</span>
              <span className="text-sm font-black text-emerald-400">+{USD2(todayEarned)}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">This Month</span>
              <span className="text-sm font-black text-[#C9A84C]">+{USD2(monthlyEarned)}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Annual (Proj.)</span>
              <span className="text-sm font-black text-white">+{USD2(yearlyEarned)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── COMPULSORY SPOUSAL RECIPROCATION COVENANT PANEL ───────── */}
      <div
        className={`rounded-3xl p-6 sm:p-7 border-2 transition-all shadow-md relative overflow-hidden ${
          hasPendingReciprocation
            ? 'bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-amber-500/5 border-amber-300 ring-2 ring-amber-400/30'
            : 'bg-emerald-500/5 border-emerald-200'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5 ${
                  hasPendingReciprocation
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {hasPendingReciprocation ? (
                  <>
                    <Zap size={13} className="fill-white" />
                    Compulsory Reciprocation Active · Rule 4.2
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    Spousal Parity in 100% Harmony
                  </>
                )}
              </span>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Scale size={13} className="text-[#C9A84C]" />
                Mutual Spousal Match Covenant
              </span>
            </div>

            {hasPendingReciprocation ? (
              <>
                <h3 className="text-xl sm:text-2xl font-black text-[#0F1C3F]">
                  {pendingReciprocation?.depositorName || partnerName} Deposited ${Number(pendingReciprocation?.amount || 500).toLocaleString()} — Your Reciprocation is Compulsory
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Under your Spousal Financial Covenant, every deposit made into the vault requires mandatory partner reciprocation within 48 hours to preserve parity.
                </p>
                {pendingReciprocation?.partnerNote && (
                  <div className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-white/80 border border-amber-200 text-xs text-amber-900 font-medium">
                    <Heart size={13} className="text-rose-500 fill-rose-500 flex-shrink-0" />
                    <span>&ldquo;{pendingReciprocation.partnerNote}&rdquo;</span>
                  </div>
                )}
                <div className="flex items-center gap-3 pt-1 text-xs text-amber-900 font-bold flex-wrap">
                  <span className="flex items-center gap-1 bg-amber-100/80 px-2.5 py-1 rounded-lg">
                    <Clock size={13} className="text-amber-700" />
                    Covenant Window: 41h remaining
                  </span>
                  <span className="flex items-center gap-1 bg-rose-100/80 text-rose-800 px-2.5 py-1 rounded-lg">
                    <Lock size={13} className="text-rose-700" />
                    Vault Withdrawals Locked Until Matched
                  </span>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg sm:text-xl font-bold text-[#0F1C3F]">
                  Spousal Savings Parity is 100% Balanced
                </h3>
                <p className="text-xs text-slate-500">
                  Every deposit made by you or {partnerName} has been reciprocated. Whenever one partner saves, the other partner is required to match within 48 hours.
                </p>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center gap-2.5 w-full md:w-auto flex-shrink-0">
            {hasPendingReciprocation && (
              <button
                type="button"
                onClick={handleOneClickReciprocate}
                className="px-6 py-3.5 rounded-2xl bg-[#0F1C3F] hover:bg-[#1a2f64] text-white font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95"
              >
                <Sparkles size={15} className="text-[#C9A84C]" />
                Reciprocate & Match ${Number(pendingReciprocation?.amount || 500).toLocaleString()}
              </button>
            )}
            <button
              type="button"
              disabled={simulatingPartner}
              onClick={handleSimulatePartnerDeposit}
              className="px-4 py-2.5 rounded-xl border border-gray-300 hover:border-[#C9A84C] bg-white text-gray-700 font-bold text-xs hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw size={12} className={simulatingPartner ? 'animate-spin' : ''} />
              {simulatingPartner ? 'Simulating...' : `Simulate ${partnerName} Depositing $500`}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── SAVE / DEPOSIT FORM ──────────────────────────────────── */}
        <div id="save-deposit-form" className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#0F1C3F]">Add Savings to Your Vault</h2>
            {isReciprocalMatch && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Zap size={11} className="fill-amber-600" />
                Matching Spousal Deposit
              </span>
            )}
          </div>

          {success ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-black text-emerald-800 text-base">Savings Added Successfully!</h4>
              <p className="text-xs text-emerald-700 max-w-md mx-auto leading-relaxed">{successMessage}</p>
              <button
                onClick={() => setSuccess(false)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
              >
                Add More Savings
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>
              )}

              {/* Target & Beneficiary */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Save Target & Beneficiary</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBeneficiary('PARTNER')
                      setIsReciprocalMatch(false)
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      beneficiary === 'PARTNER'
                        ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#0F1C3F] ring-1 ring-[#C9A84C]'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Heart size={14} className="text-rose-500 fill-rose-500" />
                      Save for {partnerName}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">Earmarked gift with spousal dedication</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBeneficiary('JOINT')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      beneficiary === 'JOINT'
                        ? 'border-[#0F1C3F] bg-[#0F1C3F]/5 text-[#0F1C3F] ring-1 ring-[#0F1C3F]'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Users size={14} className="text-[#0F1C3F]" />
                      Joint Spousal Vault
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">Shared 50/50 with compulsory reciprocation</p>
                  </button>
                </div>
              </div>

              {beneficiary === 'PARTNER' && (
                <div className="space-y-1.5 animate-in fade-in-50 duration-200">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Heart size={12} className="text-rose-500" />
                    Dedication Note for {partnerName}
                  </label>
                  <input
                    type="text"
                    value={partnerNote}
                    onChange={(e) => setPartnerNote(e.target.value)}
                    placeholder="e.g. For our upcoming travel & future home ❤️"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C]"
                  />
                </div>
              )}

              {/* Amount */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Amount to Save (USD)</label>
                  {hasPendingReciprocation && (
                    <span className="text-[11px] font-bold text-amber-700">
                      Match Required: ${Number(pendingReciprocation?.amount || 500).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={saveAmount}
                    onChange={(e) => setSaveAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C]"
                    required
                  />
                </div>
                {/* Quick amounts */}
                <div className="flex gap-2 flex-wrap">
                  {[100, 250, 500, 1000, 2500].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setSaveAmount(String(a))}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                        saveAmount === String(a)
                          ? 'bg-[#0F1C3F] text-white border-[#0F1C3F]'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      ${a.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Saving Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ONCE', label: 'One-Time' },
                    { id: 'WEEKLY', label: 'Weekly' },
                    { id: 'MONTHLY', label: 'Monthly' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFrequency(f.id as 'ONCE' | 'WEEKLY' | 'MONTHLY')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        frequency === f.id
                          ? 'bg-[#0F1C3F] text-white border-[#0F1C3F] shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact preview */}
              {numSaveAmount > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-2 text-xs">
                  <h5 className="font-bold text-emerald-800 flex items-center gap-1">
                    <Sparkles size={12} />
                    After Adding ${numSaveAmount.toLocaleString()} to {currentUserName} & {partnerName} Vault
                  </h5>
                  <div className="flex justify-between"><span className="text-gray-600">New Vault Balance</span><span className="font-bold">{USD2(newTotal)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">New Daily Earnings</span><span className="font-bold text-emerald-700">+{USD2(newDailyEarned)}/day</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">New Monthly Earnings</span><span className="font-bold text-emerald-700">+{USD2(newMonthlyEarned)}/month</span></div>
                </div>
              )}

              {/* Dual-Signature & Compulsory Reciprocation Covenant Notice */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
                <Scale size={15} className="text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Compulsory Reciprocation Protocol (Rule 4.2)</span>
                  <span className="text-[11px] text-amber-800 leading-relaxed block">
                    Under our Spousal Covenant, every deposit made into the joint vault is <strong>compulsory for the partner to reciprocate</strong> within 48 hours. Vault withdrawals are locked until parity is restored.
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-[#0F1C3F] text-white font-bold text-sm hover:bg-[#1a2f64] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Adding...</>
                ) : (
                  <><Plus size={15} />Save ${numSaveAmount > 0 ? numSaveAmount.toLocaleString() : '–'} to Vault</>
                )}
              </button>
            </form>
          )}
        </div>

        {/* ── RIGHT COLUMN: SCHEDULED REMINDERS & ACCRUAL BREAKDOWN ─ */}
        <div className="space-y-4">
          {/* Active Deposit Reminders Card */}
          <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#0F1C3F] flex items-center gap-2">
                <Bell size={16} className="text-[#C9A84C]" />
                Deposit Reminders & Spousal Nudges
              </h3>
              <button
                type="button"
                onClick={() => setShowAddReminderModal(true)}
                className="text-[11px] font-bold text-[#0F1C3F] hover:text-[#C9A84C] flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Add Reminder
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Set automated deposit reminders for you or {partnerName}. When triggered, reminders are sent via <strong>Email</strong>, <strong>In-App Notification</strong>, and posted directly to your <strong>Couple Chat</strong>.
            </p>

            {reminders.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <Calendar className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 font-semibold">No scheduled deposit reminders yet</p>
                <button
                  type="button"
                  onClick={() => setShowAddReminderModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0F1C3F] text-white font-bold text-xs hover:bg-[#1a2f64] transition-colors cursor-pointer"
                >
                  Create Your First Reminder
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reminders.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#0F1C3F]">${r.amount.toLocaleString()} Deposit</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {r.frequency}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate max-w-xs">
                        Target: {r.targetPartnerName} · Channels: Email & Chat
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendNudge(r.amount, r.note)}
                        disabled={isNudging}
                        className="px-2.5 py-1 rounded-lg bg-[#C9A84C] text-[#0F1C3F] font-bold text-[10px] hover:bg-[#d4b460] transition-colors cursor-pointer"
                        title="Send this reminder right now"
                      >
                        Nudge Now
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReminder(r.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete Reminder"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Interest Accrual Breakdown */}
          <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-[#0F1C3F] flex items-center gap-2">
              <BarChart3 size={16} className="text-[#C9A84C]" />
              Daily Interest Accrual Breakdown
            </h3>

            <div className="space-y-3 text-xs">
              {[
                { period: 'Per Second', amount: vaultPrincipal * DAILY_RATE / 86400 },
                { period: 'Per Minute', amount: vaultPrincipal * DAILY_RATE / 1440 },
                { period: 'Per Hour', amount: vaultPrincipal * DAILY_RATE / 24 },
                { period: 'Per Day', amount: vaultPrincipal * DAILY_RATE },
                { period: 'Per Week', amount: vaultPrincipal * DAILY_RATE * 7 },
                { period: 'Per Month', amount: vaultPrincipal * (APY / 12) },
                { period: 'Per Year (Compounded)', amount: vaultPrincipal * (Math.pow(1 + APY, 1) - 1) },
              ].map((row) => (
                <div key={row.period} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#C9A84C]" />
                    <span className="text-gray-600 font-medium">{row.period}</span>
                  </div>
                  <span className="font-black text-emerald-700">+{USD2(row.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ALL DEPOSITS & APPROVAL LEDGER ──────────────────────────── */}
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden space-y-4 p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-[#0F1C3F] flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-[#C9A84C]" />
              All Vault Deposits & Spousal Parity Ledger
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Review every deposit made by you and {partnerName}. Send reminders for unreciprocated or pending contributions.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 text-xs font-bold self-start sm:self-auto">
            <button
              onClick={() => setDepositFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                depositFilter === 'ALL' ? 'bg-white text-[#0F1C3F] shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({deposits.length})
            </button>
            <button
              onClick={() => setDepositFilter('APPROVED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                depositFilter === 'APPROVED' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Approved ({deposits.filter((d) => d.status === 'APPROVED').length})
            </button>
            <button
              onClick={() => setDepositFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                depositFilter === 'PENDING' ? 'bg-white text-amber-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending ({deposits.filter((d) => d.status === 'PENDING_MATCH').length})
            </button>
          </div>
        </div>

        {loadingDeposits ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading deposits...</div>
        ) : filteredDeposits.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <PiggyBank className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-gray-700">No deposits found in this view</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Make your first contribution above, or simulate {partnerName} making a deposit to trigger the spousal reciprocation protocol.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredDeposits.map((item) => {
              const isReminded = Boolean(remindedDepositIds[item.id])

              return (
                <div
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-full font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
                        item.isCurrentUser
                          ? 'bg-[#0F1C3F] text-white'
                          : 'bg-[#C9A84C]/20 text-[#0F1C3F] border border-[#C9A84C]/40'
                      }`}
                    >
                      {item.isCurrentUser ? 'You' : 'MV'}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900">{item.depositorName}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800 animate-pulse'
                          }`}
                        >
                          {item.statusLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {item.vaultTitle} · {new Date(item.createdAt).toLocaleDateString()} at{' '}
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <span className="text-base font-black text-[#0F1C3F]">
                        +${item.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-emerald-600 block font-semibold">
                        {item.status === 'APPROVED' ? '6.8% Accruing' : 'Awaiting Match'}
                      </span>
                    </div>

                    {/* Send Reminder Action Button */}
                    {item.status === 'PENDING_MATCH' ? (
                      <button
                        type="button"
                        onClick={() => handleSendNudge(item.amount, `Reminder: Spousal match of $${item.amount.toLocaleString()} is due under Rule 4.2.`, item.id)}
                        disabled={isNudging || isReminded}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                          isReminded
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-[#0F1C3F] hover:bg-[#1a2f64] text-white shadow-xs'
                        }`}
                      >
                        <Bell size={13} className={isReminded ? 'text-emerald-600' : 'text-[#C9A84C]'} />
                        <span>{isReminded ? '✓ Reminder Dispatched' : `Send Reminder to ${partnerName}`}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendNudge(item.amount, `Great job on our $${item.amount} deposit! Let's schedule our next contribution!`, item.id)}
                        disabled={isNudging || isReminded}
                        className="px-2.5 py-1.5 rounded-xl border border-gray-200 hover:border-[#C9A84C] text-gray-600 hover:text-[#0F1C3F] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Send size={12} className="text-[#C9A84C]" />
                        <span>{isReminded ? '✓ Sent' : 'Remind to Deposit More'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── MODAL: ADD SCHEDULED DEPOSIT REMINDER ─────────────────────── */}
      {showAddReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#0F1C3F] flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#C9A84C]" />
                  Add Deposit Reminder
                </h3>
                <p className="text-xs text-gray-500">
                  Schedule automatic deposit alerts sent via Email, In-App Alert, and Couple Chat.
                </p>
              </div>
              <button
                onClick={() => setShowAddReminderModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateScheduledReminder} className="space-y-4">
              {/* Target */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Reminder Recipient</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setReminderTarget('PARTNER')}
                    className={`py-2.5 px-3 rounded-xl border font-bold transition-all text-left ${
                      reminderTarget === 'PARTNER'
                        ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#0F1C3F] ring-1 ring-[#C9A84C]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{partnerName} (Spouse)</span>
                    <span className="text-[10px] text-gray-400 block font-normal">{partnerEmail}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReminderTarget('SELF')}
                    className={`py-2.5 px-3 rounded-xl border font-bold transition-all text-left ${
                      reminderTarget === 'SELF'
                        ? 'border-[#0F1C3F] bg-[#0F1C3F]/5 text-[#0F1C3F] ring-1 ring-[#0F1C3F]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>Myself ({currentUserName})</span>
                    <span className="text-[10px] text-gray-400 block font-normal">Personal alert</span>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Deposit Target Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={reminderAmount}
                    onChange={(e) => setReminderAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C]"
                    required
                  />
                </div>
              </div>

              {/* Frequency */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Reminder Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'DAILY', label: 'Daily' },
                    { id: 'WEEKLY', label: 'Weekly' },
                    { id: 'MONTHLY', label: 'Monthly' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setReminderFrequency(f.id as any)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        reminderFrequency === f.id
                          ? 'bg-[#0F1C3F] text-white border-[#0F1C3F]'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Reminder Note / Message</label>
                <input
                  type="text"
                  value={reminderNote}
                  onChange={(e) => setReminderNote(e.target.value)}
                  placeholder="e.g. Remember our monthly deposit! ❤️"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldCheck size={14} className="text-amber-700 flex-shrink-0 mt-0.5" />
                <span>
                  Delivery channels: <strong>Email</strong> ({reminderTarget === 'PARTNER' ? partnerEmail : 'your email'}), <strong>In-App Alert</strong>, and an official <strong>System Reminder Card in Couple Chat</strong>.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddReminderModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2f64] text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
