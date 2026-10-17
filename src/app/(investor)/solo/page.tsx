'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  User,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Lock,
  BarChart3,
  Calendar,
  DollarSign,
  AlertCircle,
  Briefcase,
} from 'lucide-react'

interface SoloOpportunity {
  id: string
  title: string
  shortDescription: string
  minAmount: number
  maxAmount: number | null
  termMonths: number
  annualReturnRate: number
  riskLevel: string
  status: string
  targetAmount: number
  fundedAmount: number
  distributionType: string
}

const RISK_COLORS: Record<string, string> = {
  LOW: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
  HIGH: 'bg-red-100 text-red-700 border-red-200',
}

const SOLO_TIERS = [
  {
    id: 'SOLO_STARTER',
    label: 'Solo Starter',
    description: 'Perfect first personal investment. Low-risk capital preservation with modest quarterly distributions.',
    minInvest: 250,
    rate: 5.8,
    termMonths: 6,
    risk: 'LOW',
    perks: ['Quarterly APY distributions', 'Capital protection covenant', 'Solo investor dashboard tracking'],
    color: 'border-emerald-300',
  },
  {
    id: 'SOLO_GROWTH',
    label: 'Solo Growth',
    description: 'Balanced individual portfolio vehicle with monthly interest payouts and flexible re-investment.',
    minInvest: 1000,
    rate: 8.5,
    termMonths: 12,
    risk: 'MEDIUM',
    perks: ['Monthly interest payouts', 'Re-invest toggle option', 'Detailed personal P&L report'],
    color: 'border-[#C9A84C]',
    badge: 'Most Popular',
  },
  {
    id: 'SOLO_PREMIUM',
    label: 'Solo Premium',
    description: 'High-conviction individual capital allocation with elevated returns and priority liquidity access.',
    minInvest: 5000,
    rate: 12.5,
    termMonths: 24,
    risk: 'HIGH',
    perks: ['Priority withdrawal queue', 'Dedicated relationship manager', 'Quarterly earnings call access', 'Custom allocation strategy'],
    color: 'border-[#0F1C3F]',
  },
]

export default function SoloInvestmentPage() {
  const [selectedTier, setSelectedTier] = useState<string>('SOLO_GROWTH')
  const [amount, setAmount] = useState<string>('1000')
  const [opportunities, setOpportunities] = useState<SoloOpportunity[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const tier = SOLO_TIERS.find((t) => t.id === selectedTier)!
  const numAmount = parseFloat(amount) || 0
  const projectedMonthly = (numAmount * (tier.rate / 100)) / 12
  const projectedTotal = numAmount * Math.pow(1 + tier.rate / 100, tier.termMonths / 12)

  useEffect(() => {
    fetch('/api/investments')
      .then((r) => r.json())
      .then((d) => setOpportunities(Array.isArray(d) ? d : d.opportunities || []))
      .catch(console.error)
  }, [])

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (numAmount < tier.minInvest) {
      setError(`Minimum for ${tier.label} is $${tier.minInvest.toLocaleString()}.`)
      return
    }
    setLoading(true)
    try {
      const opp = opportunities[0]
      if (!opp) throw new Error('No investment opportunities available. Please try again later.')
      const res = await fetch(`/api/investments/${opp.id}/invest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount, soloTier: selectedTier }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Investment failed.')
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F1C3F]/10 text-[#0F1C3F] text-xs font-bold uppercase tracking-wider mb-1.5">
            <User className="w-3.5 h-3.5" />
            Solo Personal Investment Portfolio
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F1C3F]">Your Private Solo Investment</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Invest independently with your personal capital — separate from your joint spousal vault. No partner signature required.
          </p>
        </div>
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F1C3F] text-white font-bold text-xs shadow-sm hover:bg-[#1a2f64] transition-colors self-start"
        >
          <Briefcase size={14} />
          View Portfolio
        </Link>
      </div>

      {/* Solo vs Joint comparison mini-banner */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-[#0F1C3F]/5 border border-[#0F1C3F]/15 space-y-2">
          <span className="text-xs font-bold text-[#0F1C3F] uppercase tracking-wider flex items-center gap-1.5">
            <User size={13} />
            Solo Investment (This Page)
          </span>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ Individual capital only</li>
            <li>✓ No spousal approval required</li>
            <li>✓ Personal tax reporting</li>
            <li>✓ Up to 12.5% projected APY</li>
          </ul>
        </div>
        <div className="p-4 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 space-y-2">
          <span className="text-xs font-bold text-[#C9A84C] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={13} />
            Joint Spousal Vault
          </span>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ Both spouses co-invest</li>
            <li>✓ 6.8% APY with streak boosts</li>
            <li>✓ Shared milestone tracking</li>
            <li>✓ Equal 50/50 balance rights</li>
          </ul>
        </div>
      </div>

      {/* Tier Selector */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#0F1C3F]">Choose Your Solo Investment Tier</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SOLO_TIERS.map((t) => {
            const isSelected = selectedTier === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedTier(t.id)
                  setAmount(String(t.minInvest))
                }}
                className={`p-5 rounded-3xl text-left border-2 transition-all hover:shadow-md relative overflow-hidden ${
                  isSelected
                    ? `${t.color} bg-white shadow-md ring-2 ring-[#C9A84C]/40`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {t.badge && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold bg-[#C9A84C] text-[#0F1C3F] px-2 py-0.5 rounded-full">
                    {t.badge}
                  </span>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#0F1C3F]">{t.label}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${RISK_COLORS[t.risk]}`}>
                      {t.risk}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-[#C9A84C]">{t.rate}% <span className="text-sm text-gray-400 font-normal">APY</span></div>
                  <p className="text-xs text-gray-500 leading-relaxed">{t.description}</p>
                  <div className="text-xs text-gray-400">{t.termMonths}-Month Term · Min ${t.minInvest.toLocaleString()}</div>
                  <ul className="pt-2 space-y-1">
                    {t.perks.map((p, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-[#C9A84C] font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Selected Tier
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Investment Form + Projection */}
      {success ? (
        <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-8 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h3 className="text-xl font-black text-emerald-800">Solo Investment Submitted!</h3>
          <p className="text-sm text-emerald-700">Your personal investment is under review and will be activated within 1 business day.</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/portfolio" className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors">View Portfolio</Link>
            <button onClick={() => setSuccess(false)} className="px-5 py-2.5 rounded-xl border border-emerald-300 text-emerald-700 font-bold text-xs hover:bg-emerald-50 transition-colors">Invest Again</button>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <form onSubmit={handleInvest} className="lg:col-span-3 rounded-3xl border border-gray-200 bg-white shadow-sm p-6 space-y-5">
            <h3 className="font-bold text-[#0F1C3F]">Configure Your {tier.label} Investment</h3>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Investment Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input
                  type="number"
                  min={tier.minInvest}
                  step="50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C]"
                  required
                />
              </div>
              <p className="text-[11px] text-gray-400">Minimum: ${tier.minInvest.toLocaleString()} · {tier.termMonths}-month lock-in term</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"><BarChart3 size={12} />Live Projection ({tier.label})</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span className="text-gray-500">Principal</span><span className="font-bold">${numAmount.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Annual Rate (Projected)</span><span className="font-bold text-emerald-600">{tier.rate}% APY</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Monthly Earnings (Est.)</span><span className="font-bold text-emerald-600">${projectedMonthly.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5"><span className="font-bold text-gray-700">Projected Total at Maturity</span><span className="font-black text-[#0F1C3F]">${projectedTotal.toFixed(2)}</span></div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800">
              <AlertCircle size={13} className="flex-shrink-0 mt-0.5 text-amber-600" />
              Projected returns are not guaranteed. All investments carry risk. Read the offer document before investing.
            </div>

            <button
              type="submit"
              disabled={loading || numAmount < tier.minInvest}
              className="w-full py-3.5 rounded-2xl bg-[#0F1C3F] text-white font-bold text-sm hover:bg-[#1a2f64] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
              ) : (
                <><DollarSign size={15} />Invest ${numAmount.toLocaleString()} in {tier.label}</>
              )}
            </button>
          </form>

          {/* Side Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
              <h4 className="font-bold text-[#0F1C3F] text-sm">Why Invest Solo?</h4>
              {[
                { icon: Lock, title: 'Your Capital, Your Control', desc: 'No spousal joint approval required. Invest independently on your own timeline.' },
                { icon: TrendingUp, title: 'Higher Personal Returns', desc: `Solo Premium offers up to ${SOLO_TIERS[2].rate}% APY — higher than the joint vault.` },
                { icon: ShieldCheck, title: 'Personal Tax Efficiency', desc: 'Solo investments generate separate tax documentation for individual filing.' },
                { icon: Sparkles, title: 'Stacks With Joint Vault', desc: 'Your solo investments run in parallel with your joint marriage savings vault.' },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#0F1C3F]/5 flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-[#C9A84C]" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[#0F1C3F]">{item.title}</h5>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
