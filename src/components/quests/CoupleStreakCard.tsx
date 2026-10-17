'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DAILY_QUESTS, DailyQuest } from '@/types/quests'
import {
  Flame,
  Sparkles,
  Heart,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  MessageSquareHeart,
  HelpCircle,
} from 'lucide-react'

export function CoupleStreakCard() {
  const [streak, setStreak] = useState<number>(0)
  const [questIndex, setQuestIndex] = useState<number>(0)
  const currentQuest: DailyQuest = DAILY_QUESTS[questIndex % DAILY_QUESTS.length]

  const [partner1Answer, setPartner1Answer] = useState<string>('')
  const [customText, setCustomText] = useState<string>('')
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)
  const [isPartnerRevealed, setIsPartnerRevealed] = useState<boolean>(false)

  // Partner 2 simulated response once revealed
  const partner2Simulated =
    'I would love to invest 70% into the home down payment vault so we have our backyard garden, and keep 30% for a dream 2-week trip!'

  const handleSelectOption = (opt: string) => {
    setPartner1Answer(opt)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const ans = customText.trim() || partner1Answer
    if (!ans) return

    setPartner1Answer(ans)
    setIsSubmitted(true)

    // Simulate partner also answering after a short moment or reveal
    setTimeout(() => {
      setIsPartnerRevealed(true)
      setStreak((prev) => prev + 1)
    }, 1200)
  }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#0F1C3F] via-[#162752] to-[#0F1C3F] text-white p-5 sm:p-6 shadow-xl border border-[#C9A84C]/30 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Streak & Yield Booster Badge */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center animate-pulse">
            <Flame className="w-6 h-6 fill-orange-500 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black text-white">
                {streak}-Day Wealth Streak
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A84C] text-[#0F1C3F]">
                +0.25% APY Boost
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Spousal synergy bonus active on your 6.8% Marriage Savings Vault
            </p>
          </div>
        </div>

        <Link
          href="/quests"
          className="text-xs font-bold text-[#C9A84C] hover:text-white transition-colors flex items-center gap-1"
        >
          Quest Hub <ArrowRight size={13} />
        </Link>
      </div>

      {/* Daily Question Body */}
      <div className="relative z-10 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A84C] bg-[#C9A84C]/10 px-2.5 py-0.5 rounded-full border border-[#C9A84C]/20">
            Today's Prompt · {currentQuest.categoryLabel}
          </span>
          <span className="text-[11px] text-slate-400">
            Question #{currentQuest.dayIndex} of 7
          </span>
        </div>

        <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
          {currentQuest.question}
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          {currentQuest.hint}
        </p>

        {isPartnerRevealed ? (
          /* Mutual Unlocked Answers */
          <div className="mt-3 p-4 rounded-2xl bg-white/10 border border-[#C9A84C]/40 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-xs font-bold text-[#C9A84C]">
              <span className="flex items-center gap-1.5">
                <Heart size={14} className="fill-rose-500 text-rose-500" />
                Both Spouses Answered · Streak Extended!
              </span>
              <span className="text-emerald-400">+0.25% APY Active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  You Said
                </span>
                <p className="text-white font-medium italic">
                  &ldquo;{partner1Answer || customText}&rdquo;
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A84C] block">
                  Your Spouse Said
                </span>
                <p className="text-white font-medium italic">
                  &ldquo;{partner2Simulated}&rdquo;
                </p>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-300">
              <span>Great minds aligned! Discuss more in your Mutual Chat.</span>
              <Link
                href="/chat"
                className="text-[#C9A84C] font-bold hover:underline inline-flex items-center gap-1"
              >
                Open Mutual Chat <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        ) : isSubmitted ? (
          /* Waiting for Partner State */
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
            <div className="w-8 h-8 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <p className="text-xs text-white font-bold">
              Your answer has been encrypted & locked in!
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              We notified your partner. As soon as they reply, both answers unlock here and in your mutual chat.
            </p>
          </div>
        ) : (
          /* Interactive Answer Form */
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            {currentQuest.quickOptions && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {currentQuest.quickOptions.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`p-2.5 rounded-xl text-left border text-xs font-medium transition-all ${
                      partner1Answer === opt
                        ? 'bg-[#C9A84C] text-[#0F1C3F] border-[#C9A84C] font-bold shadow-sm'
                        : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Or type your custom thoughts here..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-white/10 text-white placeholder-slate-400 border border-white/20 focus:outline-none focus:border-[#C9A84C]"
              />
              <button
                type="submit"
                disabled={!partner1Answer && !customText.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#C9A84C] text-[#0F1C3F] text-xs font-bold hover:bg-[#d4b460] transition-colors disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
              >
                <Flame size={14} className="fill-[#0F1C3F]" />
                Lock In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
