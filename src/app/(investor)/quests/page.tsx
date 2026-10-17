'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DAILY_QUESTS, DailyQuest } from '@/types/quests'
import { CoupleStreakCard } from '@/components/quests/CoupleStreakCard'
import {
  Flame,
  Award,
  Sparkles,
  TrendingUp,
  Heart,
  CheckCircle2,
  Lock,
  ArrowRight,
  Calendar,
  ShieldCheck,
  MessageSquareHeart,
} from 'lucide-react'

const STREAK_MILESTONES = [
  { days: 3, label: 'Bronze Synergy', apyBoost: '+0.05% APY', achieved: false },
  { days: 7, label: 'Silver Covenant', apyBoost: '+0.10% APY', achieved: false },
  { days: 14, label: 'Gold Affinity', apyBoost: '+0.15% APY', achieved: false },
  { days: 30, label: 'Sovereign Synergy', apyBoost: '+0.25% APY', achieved: false },
]

export default function CoupleQuestsPage() {
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const currentQuest = DAILY_QUESTS.find((q) => q.dayIndex === selectedDay) || DAILY_QUESTS[0]

  return (
    <div className="space-y-8">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            Love & Wealth Daily Quests
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F1C3F]">
            Couple Financial Harmony & Daily Streaks
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Answer 1 quick financial or life prompt together each day. Build unbreakable marital trust and unlock APY interest boosters on your marriage savings vault.
          </p>
        </div>

        <Link
          href="/savings"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A84C] text-[#0F1C3F] font-bold text-xs shadow-sm hover:bg-[#d4b460] transition-colors self-start sm:self-auto"
        >
          <TrendingUp size={14} />
          View Boosted Vault (6.8% + 0.25%)
        </Link>
      </div>

      {/* ── Interactive Streak Card ───────────────────────────────────── */}
      <CoupleStreakCard />

      {/* ── Yield Booster Reward Ladder ───────────────────────────────── */}
      <div className="rounded-3xl bg-white border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#0F1C3F]">
              Spousal Streak Yield Ladder
            </h3>
            <p className="text-xs text-gray-500">
              Consecutive days of mutual financial engagement unlock permanent yield boosters for your joint savings vault.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#C9A84C]/15 text-[#0F1C3F] border border-[#C9A84C]/30 self-start sm:self-auto">
            Current Tier: Day 1 (Build streak for up to +0.25% APY)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STREAK_MILESTONES.map((m) => (
            <div
              key={m.days}
              className={`p-4 rounded-2xl border transition-all ${
                m.achieved
                  ? 'bg-amber-50/50 border-[#C9A84C] shadow-sm'
                  : 'bg-slate-50 border-slate-200 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500">
                  {m.days} Days Streak
                </span>
                {m.achieved ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <Lock size={14} className="text-gray-400" />
                )}
              </div>
              <h4 className="text-sm font-bold text-[#0F1C3F]">{m.label}</h4>
              <span className="text-base font-black text-[#C9A84C] block mt-1">
                {m.apyBoost}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 7-Day Wealth Covenant Journey ─────────────────────────────── */}
      <div className="rounded-3xl bg-white border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A84C] bg-[#C9A84C]/10 px-2.5 py-0.5 rounded-full">
            Curriculum
          </span>
          <h3 className="text-xl font-bold text-[#0F1C3F] mt-1">
            7-Day Financial Synergy Cycle
          </h3>
          <p className="text-xs text-gray-500">
            Click any day to review prompt themes and see questions answered by you and your partner.
          </p>
        </div>

        {/* Days Carousel/Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {DAILY_QUESTS.map((q) => {
            const isSelected = selectedDay === q.dayIndex
            return (
              <button
                key={q.id}
                onClick={() => setSelectedDay(q.dayIndex)}
                className={`p-3 rounded-2xl text-left border min-w-[140px] flex-shrink-0 transition-all ${
                  isSelected
                    ? 'bg-[#0F1C3F] text-white border-[#0F1C3F] shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span
                  className={`text-[10px] font-bold block uppercase tracking-wider ${
                    isSelected ? 'text-[#C9A84C]' : 'text-gray-400'
                  }`}
                >
                  Day {q.dayIndex} · {q.categoryLabel}
                </span>
                <span className="text-xs font-bold block mt-0.5 truncate">{q.title}</span>
              </button>
            )
          })}
        </div>

        {/* Selected Day Details */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#0F1C3F] uppercase tracking-wider">
              Day {currentQuest.dayIndex}: {currentQuest.title}
            </span>
            <span className="text-gray-400">{currentQuest.categoryLabel}</span>
          </div>

          <h4 className="text-base sm:text-lg font-bold text-[#0F1C3F]">
            {currentQuest.question}
          </h4>

          <p className="text-xs text-gray-600 leading-relaxed italic">
            💡 Financial Harmony Tip: {currentQuest.hint}
          </p>

          <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-xs">
            <span className="text-emerald-700 font-medium">
              ✓ Unlocked and recorded in your Spousal Covenant Archive
            </span>
            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 font-bold text-[#0F1C3F] hover:text-[#C9A84C] transition-colors"
            >
              Discuss in Mutual Chat <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
