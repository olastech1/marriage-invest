'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users,
  UserPlus,
  Sparkles,
  Award,
  ArrowRight,
  Copy,
  Check,
  Share2,
  DollarSign,
  TrendingUp,
  Shield,
  Music,
  Lock,
  ExternalLink,
  CheckCircle2,
  Plus,
} from 'lucide-react'
import { CELEBRITY_ARTISTS } from '@/types/fanbase'
import { formatCurrency } from '@/lib/utils'

interface FriendsPool {
  id: string
  name: string
  targetAmount: number
  fundedAmount: number
  memberCount: number
  targetCategory: string
  status: 'ACTIVE' | 'FUNDED'
  members: { name: string; amount: number; isHost?: boolean }[]
}

const INITIAL_POOLS: FriendsPool[] = [
  {
    id: 'pool-1',
    name: 'Amalfi Coast 10-Year Anniversary Celebration Syndicate',
    targetAmount: 3000,
    fundedAmount: 2250,
    memberCount: 3,
    targetCategory: 'Couples & Family Celebration Vault',
    status: 'ACTIVE',
    members: [
      { name: 'Jane Doe (You)', amount: 750, isHost: true },
      { name: 'Marcus Vance', amount: 750 },
      { name: 'Samira Chen', amount: 750 },
    ],
  },
  {
    id: 'pool-2',
    name: 'Zurich Friends High-Yield Syndicate',
    targetAmount: 5000,
    fundedAmount: 5000,
    memberCount: 5,
    targetCategory: 'Union Stable Income Bond',
    status: 'FUNDED',
    members: [
      { name: 'Jane Doe (You)', amount: 1000, isHost: true },
      { name: 'Elena Rostova', amount: 1000 },
      { name: 'David Okafor', amount: 1000 },
      { name: 'Chloe Martin', amount: 1000 },
      { name: 'Tariq Al-Mansoor', amount: 1000 },
    ],
  },
]

export default function FriendsSyndicatePage() {
  const [pools, setPools] = useState<FriendsPool[]>(INITIAL_POOLS)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPoolName, setNewPoolName] = useState('')
  const [newPoolTarget, setNewPoolTarget] = useState(1000)
  const [newPoolCategory, setNewPoolCategory] = useState('Davido Timeless World Tour & Masters')
  const [copiedPoolId, setCopiedPoolId] = useState<string | null>(null)

  // Calculator
  const [calcTarget, setCalcTarget] = useState(1000)
  const [calcFriends, setCalcFriends] = useState(4)

  const handleCopyInvite = (poolId: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/fanbase/davido-timeless-tour?pool=${poolId}`
      navigator.clipboard.writeText(url)
      setCopiedPoolId(poolId)
      setTimeout(() => setCopiedPoolId(null), 2500)
    }
  }

  const handleCreatePool = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPoolName) return

    const newPool: FriendsPool = {
      id: `pool-${Date.now()}`,
      name: newPoolName,
      targetAmount: newPoolTarget,
      fundedAmount: Math.round(newPoolTarget * 0.25),
      memberCount: 1,
      targetCategory: newPoolCategory,
      status: 'ACTIVE',
      members: [{ name: 'You (Host)', amount: Math.round(newPoolTarget * 0.25), isHost: true }],
    }

    setPools([newPool, ...pools])
    setShowCreateModal(false)
    setNewPoolName('')
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A84C]/15 text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            Social Syndicate Architecture
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F1C3F]">
            Friends & Fanbase Syndicate Hub
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
            Invest alongside your friend circle, pool capital to unlock higher VIP artist perks, and access unlisted private celebrity fanbase rounds directly via secure link.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2d5e] text-[#C9A84C] font-bold text-xs shadow-md transition-all flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Friends Syndicate</span>
        </button>
      </div>

      {/* ── CELEBRITY FANBASE LINK-ONLY SHOWCASE ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0A0D14] via-[#101420] to-[#1a1426] text-white border border-[#C9A84C]/30 space-y-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[#C9A84C] text-[10px] font-bold uppercase tracking-wider mb-2">
              <Lock className="w-3 h-3 text-[#C9A84C]" />
              Private Unlisted Rounds · Only Accessible via Direct Link
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Celebrity Fanbase & Artist Royalty Syndicates
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xl leading-relaxed">
              These rounds carry verified artist profiles, streaming master royalties, VIP backstage concert passes, and direct management contacts. They do not appear on public listing boards.
            </p>
          </div>

          <Link
            href="/fanbase"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 transition-all flex-shrink-0"
          >
            <span>Fanbase Private Gateway</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#C9A84C]" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CELEBRITY_ARTISTS.map((artist) => (
            <div
              key={artist.id}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#C9A84C] transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start gap-4">
                <img
                  src={artist.avatarImage}
                  alt={artist.stageName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#C9A84C] flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">{artist.stageName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C9A84C]/20 text-[#C9A84C]">
                      {(artist.offering.projectedAPY * 100).toFixed(1)}% APY
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 font-medium truncate mt-0.5">{artist.offering.title}</p>
                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-snug">{artist.tagline}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                <span className="text-gray-400">
                  Entry: <strong className="text-white">${artist.offering.minInvestment}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/fanbase/${artist.slug}/contact`}
                    className="px-3 py-1.5 rounded-lg border border-white/20 text-gray-300 hover:text-white text-[11px] font-medium"
                  >
                    Contact Artist
                  </Link>
                  <Link
                    href={`/fanbase/${artist.slug}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#C9A84C] text-[#0F1C3F] font-bold text-[11px] hover:bg-[#d4b460]"
                  >
                    <span>View Profile & Link</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ACTIVE FRIENDS SYNDICATE POOLS ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0F1C3F]">Your Active Friends Pools</h2>
          <span className="text-xs font-semibold text-gray-500">
            {pools.length} Syndicates Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pools.map((pool) => {
            const pct = Math.round((pool.fundedAmount / pool.targetAmount) * 100)
            return (
              <div
                key={pool.id}
                className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-5 hover:border-[#C9A84C] transition-all"
              >
                <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A84C]">
                      {pool.targetCategory}
                    </span>
                    <h3 className="text-base font-bold text-[#0F1C3F] mt-0.5">{pool.name}</h3>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      pool.status === 'FUNDED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {pool.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">
                      Pooled: <strong className="text-gray-900">{formatCurrency(pool.fundedAmount)}</strong>
                    </span>
                    <span className="text-gray-500">
                      Target: <strong className="text-gray-900">{formatCurrency(pool.targetAmount)}</strong>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#0F1C3F] to-[#C9A84C] h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 block text-right font-medium">
                    {pct}% Funded by {pool.memberCount} Friends
                  </span>
                </div>

                {/* Member avatars */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                    Pool Contributors:
                  </span>
                  <div className="space-y-1.5 text-xs text-gray-600">
                    {pool.members.map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-50">
                        <span className="font-medium text-gray-800 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
                          {m.name}
                        </span>
                        <span className="font-mono font-bold text-[#0F1C3F]">
                          {formatCurrency(m.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invite friends share link button */}
                <div className="pt-2">
                  <button
                    onClick={() => handleCopyInvite(pool.id)}
                    className="w-full py-2.5 rounded-xl border border-gray-200 hover:border-[#C9A84C] text-[#0F1C3F] text-xs font-bold transition-all flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100"
                  >
                    {copiedPoolId === pool.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Invite Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-[#C9A84C]" />
                        <span>Share Pool Link with Friends</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── FRIENDS POOL CALCULATOR ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#C9A84C] block">
            Syndicate Split Simulator
          </span>
          <h2 className="text-xl font-bold text-[#0F1C3F]">
            Calculate Equal Friends Contribution
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            See how easily your group can pool capital to unlock $1,000 to $25,000 VIP artist syndicate tiers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Target VIP Allocation</label>
            <select
              value={calcTarget}
              onChange={(e) => setCalcTarget(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            >
              <option value={1000}>$1,000 (Backstage VIP Pass Tier)</option>
              <option value={2500}>$2,500 (Soundcheck & Vinyl Tier)</option>
              <option value={5000}>$5,000 (Executive Co-Producer Tier)</option>
              <option value={10000}>$10,000 (VIP Stadium Suite Tier)</option>
              <option value={25000}>$25,000 (Sovereign Dinner Tier)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Number of Friends</label>
            <div className="flex items-center gap-1.5">
              {[2, 3, 4, 5, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => setCalcFriends(n)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                    calcFriends === n
                      ? 'bg-[#0F1C3F] text-white border-[#0F1C3F]'
                      : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0F1C3F] text-white text-center flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold text-[#C9A84C] tracking-wider block">
              Each Friend Pays:
            </span>
            <span className="text-xl sm:text-2xl font-black text-white mt-0.5">
              ${(calcTarget / calcFriends).toFixed(2)} USD
            </span>
          </div>
        </div>
      </div>

      {/* ── CREATE FRIENDS POOL MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-gray-200 animate-slide-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-[#0F1C3F]">Start a Friends Syndicate</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePool} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Circle Name *</label>
                <input
                  type="text"
                  required
                  value={newPoolName}
                  onChange={(e) => setNewPoolName(e.target.value)}
                  placeholder="e.g. Day 1 VIP Club / Paris Tour Squad"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Allocation Pool</label>
                <select
                  value={newPoolTarget}
                  onChange={(e) => setNewPoolTarget(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                >
                  <option value={1000}>$1,000 (VIP Backstage)</option>
                  <option value={2500}>$2,500 (VIP Soundcheck)</option>
                  <option value={5000}>$5,000 (Executive Co-Producer)</option>
                  <option value={10000}>$10,000 (Diamond Suite)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Opportunity Scope</label>
                <input
                  type="text"
                  value={newPoolCategory}
                  onChange={(e) => setNewPoolCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F1C3F] text-[#C9A84C] font-bold text-xs hover:bg-[#1a2d5e]"
                >
                  Create & Get Invite Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
