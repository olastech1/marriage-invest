'use client'

import { useState, useEffect, useRef } from 'react'
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

export default function SavePage() {
  const { data: session } = useSession()
  const name = session?.user?.name?.split(' ')[0] || 'Investor'

  // Simulated current vault state
  const [vaultPrincipal] = useState(24750)
  const [saveAmount, setSaveAmount] = useState('500')
  const [frequency, setFrequency] = useState<'ONCE' | 'WEEKLY' | 'MONTHLY'>('MONTHLY')
  const [beneficiary, setBeneficiary] = useState<'PARTNER' | 'JOINT'>('PARTNER')
  const [partnerNote, setPartnerNote] = useState('For our upcoming travel & future home ❤️')
  const partnerName = 'Marcus Vance'
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const liveBalance = useLiveVaultBalance(vaultPrincipal)
  const todayEarned = vaultPrincipal * DAILY_RATE
  const monthlyEarned = vaultPrincipal * (APY / 12)
  const yearlyEarned = vaultPrincipal * APY
  const numSaveAmount = parseFloat(saveAmount) || 0

  // Projection: if they add numSaveAmount
  const newTotal = vaultPrincipal + numSaveAmount
  const newDailyEarned = newTotal * DAILY_RATE
  const newMonthlyEarned = newTotal * (APY / 12)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (numSaveAmount < 10) {
      setError('Minimum save amount is $10.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/investments', {
        method: 'GET',
      })
      const data = await res.json()
      const opps = Array.isArray(data) ? data : data.opportunities || []
      const opp = opps[0]
      if (!opp) throw new Error('No investment opportunities currently available.')

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
        }),
      })
      const investData = await investRes.json()
      if (!investRes.ok) throw new Error(investData.error || 'Saving failed.')
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Flame className="w-3.5 h-3.5 fill-emerald-600" />
            Your Live Joint Savings Vault · 6.8% APY
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F1C3F]">Save Together, Grow Every Second</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Your joint marriage savings vault compounds interest <strong>every single second</strong>. Watch your wealth grow in real-time.
          </p>
        </div>
        <Link
          href="/savings"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A84C] text-[#0F1C3F] font-bold text-xs shadow-sm hover:bg-[#d4b460] transition-colors self-start"
        >
          <PiggyBank size={14} />
          Manage Goals
        </Link>
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
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Compounding Live · Updated Every 100ms</span>
            </div>
            <span className="text-xs text-slate-400">6.8% APY</span>
          </div>

          <div className="text-center space-y-1">
            <span className="text-[11px] text-slate-400 uppercase tracking-widest block">Joint Vault Balance (Live)</span>
            <div className="text-4xl sm:text-5xl font-black font-mono text-white tabular-nums">
              {USD(liveBalance)}
            </div>
            <p className="text-xs text-emerald-400 font-semibold">↑ Growing right now...</p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── SAVE / DEPOSIT FORM ──────────────────────────────────── */}
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-[#0F1C3F]">Add Savings to Your Vault</h2>

          {success ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-black text-emerald-800">Savings Added Successfully!</h4>
              <p className="text-xs text-emerald-700">Your vault balance is already compounding your new deposit.</p>
              <button onClick={() => setSuccess(false)} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors">
                Add More Savings
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>
              )}

              {/* Save Target & Beneficiary Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Save Target & Beneficiary</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBeneficiary('PARTNER')}
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
                    <p className="text-[10px] text-gray-500 mt-0.5">Shared 50/50 with dual-signature lock</p>
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
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Amount to Save (USD)</label>
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
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
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
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
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
                  <h5 className="font-bold text-emerald-800 flex items-center gap-1"><Sparkles size={12} />After Adding ${numSaveAmount.toLocaleString()}</h5>
                  <div className="flex justify-between"><span className="text-gray-600">New Vault Balance</span><span className="font-bold">{USD2(newTotal)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">New Daily Earnings</span><span className="font-bold text-emerald-700">+{USD2(newDailyEarned)}/day</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">New Monthly Earnings</span><span className="font-bold text-emerald-700">+{USD2(newMonthlyEarned)}/month</span></div>
                </div>
              )}

              {/* Dual-Signature Protection Covenant Notice */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
                <Lock size={15} className="text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Mutual Dual-Signature Covenant</span>
                  <span className="text-[11px] text-amber-800 leading-relaxed block">
                    Neither partner can withdraw funds unilaterally. Once a withdrawal is requested, the other partner must review and digitally approve before any money is released.
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-[#0F1C3F] text-white font-bold text-sm hover:bg-[#1a2f64] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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

        {/* ── DAILY GROWTH BREAKDOWN ────────────────────────────────── */}
        <div className="space-y-4">
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

          <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6 space-y-3">
            <h4 className="text-sm font-bold text-[#0F1C3F]">Quick Actions</h4>
            <div className="space-y-2">
              <Link href="/savings" className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#C9A84C] transition-all text-xs font-bold text-[#0F1C3F]">
                <span className="flex items-center gap-2"><PiggyBank size={14} className="text-[#C9A84C]" />Milestone Goals & Vaults</span>
                <ArrowRight size={13} />
              </Link>
              <Link href="/solo" className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#C9A84C] transition-all text-xs font-bold text-[#0F1C3F]">
                <span className="flex items-center gap-2"><TrendingUp size={14} className="text-[#C9A84C]" />Solo Personal Investment</span>
                <ArrowRight size={13} />
              </Link>
              <Link href="/withdrawals" className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#C9A84C] transition-all text-xs font-bold text-[#0F1C3F]">
                <span className="flex items-center gap-2"><Calendar size={14} className="text-[#C9A84C]" />Request Withdrawal</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
