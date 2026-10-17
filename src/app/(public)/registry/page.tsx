'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SEED_REGISTRIES, CoupleRegistry } from '@/types/registry'
import {
  Gift,
  Heart,
  Search,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Calendar,
  MapPin,
  ArrowRight,
  PiggyBank,
  CheckCircle2,
} from 'lucide-react'

export default function PublicRegistryHubPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRegistries = SEED_REGISTRIES.filter((r) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      r.partner1Name.toLowerCase().includes(q) ||
      r.partner2Name.toLowerCase().includes(q) ||
      r.weddingLocation.toLowerCase().includes(q) ||
      r.slug.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-b from-[#0F1C3F] via-[#162752] to-[#0F1C3F] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-[#C9A84C]/20">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#C9A84C]/15 via-rose-500/10 to-blue-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="relative max-w-5xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-bold uppercase tracking-wider">
            <Gift className="w-3.5 h-3.5" />
            Union Invest Cash Wedding Registry · 6.8% APY
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Start Your Marriage on Solid Ground.
            <br />
            <span className="text-[#C9A84C]">Build Wealth, Not Clutter.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Replace unwanted blenders and toasters with high-yield milestone vaults. 
            Invite wedding guests to gift directly toward your dream honeymoon, first home down payment, and family nest egg.
          </p>

          {/* Registry Search Bar */}
          <div className="pt-4 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Find a couple's wedding registry (e.g. Marcus, Elena, David)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 text-xs sm:text-sm rounded-2xl bg-white text-slate-900 border border-white/20 shadow-xl focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
              />
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="text-xl sm:text-2xl font-black text-[#C9A84C]">$348,900+</span>
              <span className="block text-slate-300 text-[10px] uppercase font-semibold mt-0.5">
                Cash Gifts Delivered
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="text-xl sm:text-2xl font-black text-white">420+</span>
              <span className="block text-slate-300 text-[10px] uppercase font-semibold mt-0.5">
                Couples Registered
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">6.8% APY</span>
              <span className="block text-slate-300 text-[10px] uppercase font-semibold mt-0.5">
                Spousal Vault Yield
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="text-xl sm:text-2xl font-black text-blue-400">0% Fees</span>
              <span className="block text-slate-300 text-[10px] uppercase font-semibold mt-0.5">
                Zero Platform Cut
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Couple Registries ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#0F1C3F]">
              Active Couple Registries ({filteredRegistries.length})
            </h2>
            <p className="text-xs text-gray-500">
              Select a couple to view their love story, milestone vaults, and send a wedding gift.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRegistries.map((registry) => {
            const pct = Math.min(
              100,
              Math.round((registry.currentTotal / registry.targetTotal) * 100)
            )

            return (
              <div
                key={registry.id}
                className="rounded-3xl bg-white border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Photo & Badge */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={registry.coverPhoto}
                    alt={`${registry.partner1Name} & ${registry.partner2Name}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A84C] bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                      Wedding Day: {new Date(registry.weddingDate).toLocaleDateString()}
                    </span>
                    <h3 className="text-xl font-bold font-serif text-white mt-1 leading-snug">
                      {registry.partner1Name} & {registry.partner2Name}
                    </h3>
                    <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} className="text-[#C9A84C]" />
                      {registry.weddingLocation}
                    </p>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-4">
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {registry.greeting}
                  </p>

                  {/* Funds count */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-semibold text-slate-700">
                      {registry.funds.length} Milestone Funds:
                    </span>
                    <span className="truncate">
                      {registry.funds.map((f) => f.title).join(' · ')}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#0F1C3F] font-bold">
                        ${registry.currentTotal.toLocaleString()}
                        <span className="text-gray-400 font-normal"> of ${registry.targetTotal.toLocaleString()}</span>
                      </span>
                      <span className="text-emerald-600 font-bold">{pct}% Funded</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#C9A84C] to-emerald-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    href={`/registry/${registry.slug}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#0F1C3F] text-white font-bold text-xs hover:bg-[#1a2f64] transition-all shadow-sm group-hover:bg-[#C9A84C] group-hover:text-[#0F1C3F]"
                  >
                    <Gift size={14} />
                    View Registry & Send Gift
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Why Cash Registry Beats Toasters ──────────────────────────── */}
        <div className="rounded-3xl bg-white border border-gray-200 p-8 shadow-sm space-y-6 mt-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C9A84C] bg-[#C9A84C]/10 px-3 py-1 rounded-full">
              The Modern Marriage Standard
            </span>
            <h3 className="text-2xl font-black text-[#0F1C3F]">
              Why Couples Are Choosing High-Yield Cash Registries
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              83% of newly married couples report receiving duplicate or unwanted kitchen gifts. Union Invest turns wedding generosity into permanent financial freedom.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#0F1C3F]">6.8% Compound Growth</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                A $10,000 honeymoon or home fund gift compounds into over $19,300 in 10 years, creating tangible wealth instead of depreciating gadgets.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <PiggyBank className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#0F1C3F]">Equal 50/50 Spousal Rights</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                All wedding gifts are automatically recognized under your joint marriage covenant with balanced spousal visibility and zero individual claim disputes.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#0F1C3F]">Zero Deductions Guarantee</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Unlike department stores that charge 10%–20% markups or fees, 100% of guest gift funds go directly into the couple's FDIC-insured vault.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
