'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell,
  AlertTriangle,
  Sparkles,
  Flame,
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingUp,
  DollarSign,
  Heart,
  Users,
  Check,
  RefreshCw,
  X,
  ExternalLink,
  ShieldAlert,
  Zap,
} from 'lucide-react'

interface NotificationItem {
  id: string
  userId: string
  title: string
  message: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT'
  read: boolean
  link: string | null
  createdAt: string | Date
  category?: 'BONUS_MATCH' | 'PARTNER_DEPOSIT' | 'PARTNER_CHANGE' | 'COMPOUND_URGENCY' | 'GENERAL'
  requiresAction?: boolean
  attended?: boolean
  attendedAt?: string | Date | null
  amount?: number
  partnerName?: string
  actionLabel?: string
  metadata?: any
}

interface Props {
  initialNotifications: NotificationItem[]
  currentUserName: string
  partnerName?: string
}

export default function UrgentNotificationCenter({
  initialNotifications,
  currentUserName,
  partnerName = 'Your Partner',
}: Props) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications || [])
  const [attendingIds, setAttendingIds] = useState<Record<string, boolean>>({})
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'URGENT' | 'ALL'>('URGENT')
  const [calculatorAmount, setCalculatorAmount] = useState<number>(500)

  // 24-hour countdown timer simulation
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 18,
    minutes: 42,
    seconds: 15,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 }
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        return { hours: 23, minutes: 59, seconds: 59 }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Filter pending disturbing notifications (requiresAction and not attended)
  const pendingDisturbing = notifications.filter(
    (n) => (n.requiresAction || n.category === 'BONUS_MATCH' || n.category === 'PARTNER_DEPOSIT') && !n.attended
  )

  const handleAttend = async (id: string, customSuccess?: string) => {
    setAttendingIds((prev) => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`/api/notifications/${id}/attend`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, attended: true, read: true, attendedAt: new Date() } : n))
        )
        setToastMessage(customSuccess || '✓ Action attended & acknowledged! Partner notified.')
        setTimeout(() => setToastMessage(null), 4000)
      }
    } catch (err) {
      console.error('Failed to attend notification', err)
    } finally {
      setAttendingIds((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleAttendAll = async () => {
    try {
      const res = await fetch('/api/notifications/attend-all', {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, attended: true, read: true, attendedAt: new Date() }))
        )
        setToastMessage('✓ All pending partner actions & alerts attended to!')
        setTimeout(() => setToastMessage(null), 4000)
      }
    } catch (err) {
      console.error('Failed to attend all', err)
    }
  }

  const calcBonus = Math.round(calculatorAmount * 0.10 * 100) / 100
  const calcTotal = calculatorAmount + calcBonus

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-xl animate-bounce-subtle">
          <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-white/80 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION HEADER: High-Converting Disturbance & Action Center  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#0F1C3F] via-[#162752] to-[#0F1C3F] p-4 text-white shadow-md border border-[#C9A84C]/30">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Bell className="h-5 w-5 animate-wiggle" />
            {pendingDisturbing.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white ring-2 ring-[#0F1C3F]">
                {pendingDisturbing.length}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#C9A84C]">
                Urgent Action Center
              </span>
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/30">
                {pendingDisturbing.length} Items Awaiting Attention
              </span>
            </div>
            <h2 className="text-base font-bold text-white">
              Partner Notifications & High-Yield Opportunities
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab(activeTab === 'URGENT' ? 'ALL' : 'URGENT')}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            {activeTab === 'URGENT' ? 'View All Logs' : 'View Urgent Only'}
          </button>
          {pendingDisturbing.length > 0 && (
            <button
              onClick={handleAttendAll}
              className="rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#d4b460] px-3.5 py-1.5 text-xs font-bold text-[#0F1C3F] hover:shadow transition-all"
            >
              Attend All
            </button>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. FLASH BONUS DISTURBANCE CARD: Save Now & Earn 10% Match    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F1C3F] via-[#1a2f64] to-[#0F1C3F] p-6 text-white shadow-xl border-2 border-[#C9A84C]/50">
        {/* Shimmer background accent */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#C9A84C]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Top urgency tag & timer */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>
              <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                <Zap size={12} className="text-amber-300" />
                Flash Bonus: 10% Cash Match Active
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-mono font-bold text-amber-300 border border-white/10">
              <Clock size={13} />
              <span>Ends in: {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
          </div>

          {/* Headline and Value Proposition */}
          <div className="space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Save Now & Earn An Extra 10% On Every Dollar You Deposit!
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Don’t let your money sit idle. For the next 24 hours, Union Verify matches <strong>10% of any deposit</strong> added to your Joint Marriage Savings Vault. Free capital credited instantly to your compounding principal.
            </p>
          </div>

          {/* Interactive Live Bonus Calculator */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C9A84C] flex items-center gap-1.5">
                <Sparkles size={13} />
                Interactive Instant Match Preview
              </span>
              <span className="text-xs text-slate-300 font-medium">Select Amount to Test:</span>
            </div>

            {/* Quick Amount Pills */}
            <div className="flex flex-wrap gap-2">
              {[100, 250, 500, 1000, 2500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCalculatorAmount(amt)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    calculatorAmount === amt
                      ? 'bg-[#C9A84C] text-[#0F1C3F] shadow-md scale-105'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  ${amt.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Live Calculation Output Bar */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
              <div className="rounded-xl bg-white/5 p-2 border border-white/5">
                <span className="text-[10px] uppercase text-slate-400 block font-sans">You Deposit</span>
                <span className="text-sm sm:text-base font-black text-white">${calculatorAmount.toLocaleString()}</span>
              </div>
              <div className="rounded-xl bg-emerald-500/20 p-2 border border-emerald-500/30">
                <span className="text-[10px] uppercase text-emerald-300 block font-sans">+10% Match Bonus</span>
                <span className="text-sm sm:text-base font-black text-emerald-400">+${calcBonus.toFixed(2)}</span>
              </div>
              <div className="rounded-xl bg-[#C9A84C]/20 p-2 border border-[#C9A84C]/30">
                <span className="text-[10px] uppercase text-[#C9A84C] block font-sans">Total In Vault</span>
                <span className="text-sm sm:text-base font-black text-white">${calcTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <Link
              href={`/save?bonus=10percent&amount=${calculatorAmount}`}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#C9A84C] via-[#e5c56e] to-[#C9A84C] px-6 py-3.5 text-sm font-black text-[#0F1C3F] shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all"
            >
              <DollarSign size={16} />
              Claim 10% Match & Deposit ${calculatorAmount.toLocaleString()} Now →
            </Link>
            <button
              onClick={() => handleAttend('notif_bonus_10percent', '✓ Bonus notice attended. You can claim it anytime from the Save page.')}
              disabled={attendingIds['notif_bonus_10percent']}
              className="w-full sm:w-auto rounded-2xl border border-white/20 px-4 py-3.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              {attendingIds['notif_bonus_10percent'] ? 'Attending...' : 'Attend & Dismiss for Now'}
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. PENDING PARTNER ACTIONS (Stays on Dashboard Until Attended)*/}
      {/* ───────────────────────────────────────────────────────────── */}
      {pendingDisturbing.filter((n) => n.id !== 'notif_bonus_10percent').length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-rose-600" />
              Partner Actions Requiring Immediate Attendance (Will Not Disappear Until Attended)
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Covenant Rule 4.2 Active
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {pendingDisturbing
              .filter((n) => n.id !== 'notif_bonus_10percent')
              .map((notif) => {
                const isDeposit = notif.category === 'PARTNER_DEPOSIT' || notif.amount
                const isUrgency = notif.category === 'COMPOUND_URGENCY'
                const isReminder = notif.category === 'PARTNER_CHANGE'
                const isAttending = attendingIds[notif.id]

                return (
                  <div
                    key={notif.id}
                    className={`rounded-2xl border-2 p-5 shadow-sm transition-all relative overflow-hidden flex flex-col justify-between ${
                      isDeposit
                        ? 'border-rose-400 bg-rose-50/60 ring-2 ring-rose-200/50'
                        : isUrgency
                        ? 'border-amber-400 bg-amber-50/60'
                        : 'border-blue-300 bg-blue-50/50'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Badge line */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            isDeposit
                              ? 'bg-rose-600 text-white'
                              : isUrgency
                              ? 'bg-amber-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {isDeposit ? '🚨 Partner Deposit · Match Required' : isUrgency ? '⚠️ Lost Interest' : '🔔 Partner Scheduled'}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          Pending Attendance
                        </span>
                      </div>

                      {/* Content */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{notif.title}</h4>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                      </div>

                      {/* Financial parity note if deposit */}
                      {isDeposit && notif.amount && (
                        <div className="rounded-xl bg-white/80 p-3 border border-rose-200 text-xs space-y-1">
                          <div className="flex justify-between font-bold text-rose-900">
                            <span>Amount To Match</span>
                            <span className="font-mono">${Number(notif.amount).toLocaleString()}</span>
                          </div>
                          <p className="text-[11px] text-rose-700">
                            Matching this deposit maintains 50/50 beneficial parity and unlocks full dual-signature withdrawals.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-200/60 mt-3">
                      {notif.link ? (
                        <Link
                          href={notif.link}
                          className="flex-1 rounded-xl bg-[#0F1C3F] px-3.5 py-2.5 text-center text-xs font-bold text-white hover:bg-[#1a2f64] transition-colors flex items-center justify-center gap-1.5"
                        >
                          {notif.actionLabel || 'Attend Now'}
                          <ArrowRight size={13} />
                        </Link>
                      ) : null}
                      <button
                        onClick={() => handleAttend(notif.id)}
                        disabled={isAttending}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-1 flex-shrink-0"
                      >
                        {isAttending ? (
                          <RefreshCw size={13} className="animate-spin text-slate-400" />
                        ) : (
                          <Check size={13} className="text-emerald-600" />
                        )}
                        Mark Attended
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div className="text-xs">
            <strong className="font-bold">All Partner Actions Attended To:</strong> Both spouses are currently in full parity. Whenever your partner deposits or updates settings, you will be alerted right here until attended to.
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. FULL NOTIFICATION LEDGER (Toggleable)                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'ALL' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-fade-in">
          <div className="border-b border-slate-100 px-5 py-3.5 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Complete Notification Ledger ({notifications.length})
            </h4>
            <span className="text-[11px] text-slate-400">Archived & Active</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start justify-between gap-3 p-4 transition-colors ${
                  !n.read || (!n.attended && n.requiresAction) ? 'bg-amber-50/30' : 'hover:bg-slate-50'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{n.title}</span>
                    {n.attended ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-emerald-700">
                        Attended
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.2 text-[10px] font-bold text-amber-800">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {!n.attended && (
                  <button
                    onClick={() => handleAttend(n.id)}
                    disabled={attendingIds[n.id]}
                    className="flex-shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Attend
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
