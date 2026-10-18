'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { COMMUNITY_CAUSES, CommunityCause, CommunityCategory } from '@/types/community'
import DonationModal from '@/components/community/DonationModal'
import YieldForGoodCard from '@/components/community/YieldForGoodCard'
import {
  Heart,
  ShieldCheck,
  Sparkles,
  Users,
  Home,
  Scale,
  Baby,
  Pill,
  Soup,
  Plane,
  HeartHandshake,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Info,
  DollarSign,
  FileCheck,
  Search,
} from 'lucide-react'

const CATEGORY_TABS: { id: string; label: string; icon: any }[] = [
  { id: 'ALL', label: 'All Community Causes', icon: Heart },
  { id: 'LGBTQ_YOUTH', label: 'Youth Crisis Housing', icon: Home },
  { id: 'MARRIAGE_EQUALITY', label: 'Marriage Legal Defense', icon: Scale },
  { id: 'INCLUSIVE_FAMILY', label: 'Family Building & Adoption', icon: Baby },
  { id: 'TRANS_HEALTH', label: 'Trans Vitality & Healthcare', icon: Pill },
  { id: 'ELDER_CARE', label: 'Senior Pioneer Dignity', icon: Soup },
  { id: 'GLOBAL_REFUGEE', label: 'International Asylum Rescue', icon: Plane },
]

export default function CommunityDonationsPage() {
  const { data: session } = useSession()
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [activeModalCause, setActiveModalCause] = useState<CommunityCause | null>(null)
  const [expandedCauseId, setExpandedCauseId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  const filteredCauses = COMMUNITY_CAUSES.filter((c) => {
    const matchesCategory = selectedCategory === 'ALL' || c.category === selectedCategory
    const matchesSearch =
      searchQuery.trim() === '' ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.partnerOrg.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const totalRaisedAcrossCauses = COMMUNITY_CAUSES.reduce((acc, c) => acc + c.raisedAmount, 0)
  const totalTargetAcrossCauses = COMMUNITY_CAUSES.reduce((acc, c) => acc + c.targetAmount, 0)
  const totalDonorsCount = COMMUNITY_CAUSES.reduce((acc, c) => acc + c.donorsCount, 0)

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0F1C3F] via-[#162752] to-[#0F1C3F] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 border-b border-[#C9A84C]/20">
        {/* Decorative Glow Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-pink-500/10 via-[#C9A84C]/15 to-blue-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="relative max-w-5xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-bold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 fill-[#C9A84C]" />
            Union Verify Community Impact Fund · 501(c)(3) Certified
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Lifting Love, Dignity & Equality — <span className="text-[#C9A84C]">Together.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto leading-relaxed">
            We believe generational marital wealth and community solidarity go hand in hand. 
            Union Verify connects married couples, friends, and allies directly to audited 501(c)(3) community funds providing LGBTQ+ youth shelter, marriage legal defense, adoption grants, and elder pioneer dignity.
          </p>

          {/* Quick Metrics Bar */}
          <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center">
              <span className="text-2xl sm:text-3xl font-black text-[#C9A84C]">
                ${(totalRaisedAcrossCauses / 1000).toFixed(0)}k+
              </span>
              <span className="block text-slate-300 text-[11px] uppercase tracking-wider font-semibold mt-1">
                Community Funds Deployed
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {totalDonorsCount.toLocaleString()}+
              </span>
              <span className="block text-slate-300 text-[11px] uppercase tracking-wider font-semibold mt-1">
                Benefactors & Donors
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                100%
              </span>
              <span className="block text-slate-300 text-[11px] uppercase tracking-wider font-semibold mt-1">
                Net Proceeds to Vetted Causes
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center">
              <span className="text-2xl sm:text-3xl font-black text-blue-400">
                501(c)(3)
              </span>
              <span className="block text-slate-300 text-[11px] uppercase tracking-wider font-semibold mt-1">
                Instant Tax Deductible Receipts
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Causes Directory ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Search & Category Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon
              const isSelected = selectedCategory === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-[#0F1C3F] text-white border-[#0F1C3F] shadow-sm ring-2 ring-[#C9A84C]/30'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={14} className={isSelected ? 'text-[#C9A84C]' : 'text-gray-400'} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-72 flex-shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search causes or partners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C] bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Causes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCauses.map((cause) => {
            const pctFunded = Math.min(
              100,
              Math.round((cause.raisedAmount / cause.targetAmount) * 100),
            )
            const isExpanded = expandedCauseId === cause.id

            return (
              <div
                key={cause.id}
                className="rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Top Badge & Header */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 border border-blue-200">
                      {cause.categoryLabel}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 flex items-center gap-1">
                      <Sparkles size={10} className="text-[#C9A84C]" />
                      {cause.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#0F1C3F] group-hover:text-[#C9A84C] transition-colors leading-snug">
                    {cause.title}
                  </h3>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    {cause.description}
                  </p>

                  {/* Impact Metrics Badges */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                    {cause.impactMetrics.map((metric, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-slate-50 text-center">
                        <span className="block text-xs font-black text-[#0F1C3F]">
                          {metric.value}
                        </span>
                        <span className="block text-[9px] text-gray-500 truncate">
                          {metric.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Funding Progress Bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#0F1C3F] font-bold">
                        ${cause.raisedAmount.toLocaleString()}
                        <span className="text-gray-400 font-normal"> of ${cause.targetAmount.toLocaleString()}</span>
                      </span>
                      <span className="text-emerald-600 font-bold">{pctFunded}%</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#C9A84C] to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${pctFunded}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>{cause.donorsCount.toLocaleString()} Donors</span>
                      <span className="text-emerald-700 font-medium">501(c)(3) Deductible</span>
                    </div>
                  </div>

                  {/* Expandable Long Description */}
                  {isExpanded && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-gray-600 space-y-2 animate-in fade-in duration-200">
                      <p className="leading-relaxed">{cause.longDescription}</p>
                      {cause.stories.map((st, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-white border border-slate-200 italic text-[11px] text-slate-700">
                          &ldquo;{st.quote}&rdquo; — <strong>{st.author}</strong> ({st.role})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-gray-100 bg-slate-50/50 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setExpandedCauseId(isExpanded ? null : cause.id)}
                    className="text-xs font-bold text-gray-500 hover:text-[#0F1C3F] transition-colors"
                  >
                    {isExpanded ? 'Less Details' : 'Impact Details'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModalCause(cause)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0F1C3F] text-white text-xs font-bold hover:bg-[#1a2f64] transition-all shadow-sm group-hover:bg-[#C9A84C] group-hover:text-[#0F1C3F]"
                  >
                    <Heart size={13} className="fill-current" />
                    Donate Now
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Yield For Good Card ───────────────────────────────────────── */}
        <YieldForGoodCard />

        {/* ── Philanthropic Integrity & Guarantees ────────────────────── */}
        <div className="rounded-3xl bg-white border border-gray-200 p-8 shadow-sm space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C9A84C] bg-[#C9A84C]/10 px-3 py-1 rounded-full">
              Fiduciary Transparency Guarantee
            </span>
            <h3 className="text-2xl font-black text-[#0F1C3F]">
              How Community Donations Are Safeguarded
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Every dollar contributed through Union Verify follows rigorous anti-corruption, verified non-profit protocols.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#0F1C3F]">100% Non-Profit Flow</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                We do not take platform deductions from direct donations. Contributions are routed directly to registered 501(c)(3) fiscal sponsors.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#0F1C3F]">Instant Tax Receipts</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Immediately receive an IRS-compliant 501(c)(3) tax deduction receipt stamped with a cryptographic signature for tax filing.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#0F1C3F]">Community Governance</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Disbursements are monitored by our advisory council of LGBTQ+ civil rights leaders, elder advocates, and marriage equality pioneers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Active Donation Modal ─────────────────────────────────────── */}
      {activeModalCause && (
        <DonationModal
          cause={activeModalCause}
          onClose={() => setActiveModalCause(null)}
          userSession={session?.user}
        />
      )}
    </div>
  )
}
