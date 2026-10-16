'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Award,
  FileCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  Lock,
  ExternalLink,
} from 'lucide-react'
import type { AccountRating } from '@/lib/rating'
import { formatCurrency } from '@/lib/utils'

interface AccountRatingCardProps {
  rating: AccountRating
}

export default function AccountRatingCard({ rating }: AccountRatingCardProps) {
  const [expanded, setExpanded] = useState(false)

  const tierColors: Record<string, { badge: string; border: string; glow: string; text: string }> = {
    AAA: {
      badge: 'bg-gradient-to-r from-[#C9A84C] to-[#e6c86e] text-[#0F1C3F] border-[#C9A84C]',
      border: 'border-[#C9A84C]/40',
      glow: 'shadow-lg shadow-[#C9A84C]/15 ring-1 ring-[#C9A84C]/30',
      text: 'text-[#C9A84C]',
    },
    'AA+': {
      badge: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400',
      border: 'border-emerald-300',
      glow: 'shadow-md shadow-emerald-500/10 ring-1 ring-emerald-300',
      text: 'text-emerald-700',
    },
    A: {
      badge: 'bg-gradient-to-r from-sky-600 to-blue-700 text-white border-sky-400',
      border: 'border-sky-200',
      glow: 'shadow-sm',
      text: 'text-sky-700',
    },
    BBB: {
      badge: 'bg-gradient-to-r from-indigo-600 to-violet-700 text-white border-indigo-400',
      border: 'border-indigo-200',
      glow: 'shadow-sm',
      text: 'text-indigo-700',
    },
    BB: {
      badge: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-300',
      border: 'border-amber-200',
      glow: 'shadow-sm',
      text: 'text-amber-700',
    },
    C: {
      badge: 'bg-gray-600 text-white border-gray-400',
      border: 'border-gray-200',
      glow: 'shadow-sm',
      text: 'text-gray-700',
    },
  }

  const currentTheme = tierColors[rating.tier] || tierColors.C

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl bg-white border ${currentTheme.border} ${currentTheme.glow} p-5 sm:p-7 transition-all relative overflow-hidden`}
    >
      {/* Background watermark seal */}
      <div className="absolute -top-10 -right-10 w-48 h-48 opacity-[0.03] pointer-events-none">
        <Award className="w-full h-full text-[#0F1C3F]" />
      </div>

      {/* ── TOP BAR: TIER BADGE & SUMMARY ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-gray-100 pb-5">
        <div className="flex items-start sm:items-center gap-4">
          {/* Main Tier Grade Emblem */}
          <div className="relative flex-shrink-0">
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center font-serif font-black text-2xl sm:text-3xl shadow-md border-2 ${currentTheme.badge}`}
            >
              <span>{rating.tier}</span>
              <span className="text-[9px] font-sans font-bold tracking-widest uppercase opacity-85 -mt-0.5">
                RATING
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0F1C3F] text-[#C9A84C] flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C9A84C]">
                Fiduciary Account Rating
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Score: {rating.score} / 100
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Verified Real Capital Only
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F1C3F] tracking-tight">
              {rating.title}
            </h2>
            <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
              {rating.subtitle}
            </p>
          </div>
        </div>

        {/* Real Capital & Next Tier Callout */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 flex-shrink-0 bg-gray-50/80 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-gray-200">
          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
              Settled Real Deposits
            </span>
            <span className="text-base sm:text-lg font-bold text-[#0F1C3F]">
              {formatCurrency(rating.realDepositedAmount)}
            </span>
            <span className="text-[10px] text-gray-400 block">
              Demo allocations strictly excluded
            </span>
          </div>
          {rating.nextTier && (
            <div className="text-left sm:text-right sm:mt-1">
              <span className="text-[11px] font-semibold text-[#0F1C3F] bg-[#C9A84C]/15 px-2.5 py-1 rounded-lg border border-[#C9A84C]/30 inline-block">
                +{rating.pointsToNextTier} pts to {rating.nextTier}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── METRICS & PROGRESS TRACKER ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-5 border-b border-gray-100">
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0F1C3F]/5 text-[#0F1C3F] flex items-center justify-center flex-shrink-0">
            <FileCheck className="w-5 h-5 text-[#C9A84C]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              Documents Accumulated
            </span>
            <span className="text-sm font-bold text-[#0F1C3F]">
              {rating.documentCount} of {rating.totalAvailableDocuments} Documents
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0F1C3F]/5 text-[#0F1C3F] flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 text-[#C9A84C]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              Matrimonial Covenant
            </span>
            <span className="text-sm font-bold text-[#0F1C3F]">
              {rating.hasMarriageCovenant ? 'Solemnized & Docketed' : 'Not Yet Registered'}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0F1C3F]/5 text-[#0F1C3F] flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#C9A84C]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              Legal Identity Status
            </span>
            <span className="text-sm font-bold text-[#0F1C3F]">
              {rating.isIdentityVerified ? 'KYC Verified' : 'Standard Verification'}
            </span>
          </div>
        </div>
      </div>

      {/* ── EXPANDABLE DOCUMENT CHECKLIST ── */}
      <div className="pt-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0F1C3F] hover:text-[#C9A84C] transition-colors"
          >
            <span>{expanded ? 'Hide Document Portfolio Breakdown' : 'View Document Portfolio Breakdown & Requirements'}</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <Link
            href="/my-documents"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F1C3F] hover:text-[#C9A84C] transition-colors"
          >
            <span>Open Document Vault</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C9A84C]" />
          </Link>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rating.checklist.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                    item.met ? 'bg-emerald-50/50 border-emerald-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {item.met ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-gray-900 truncate">{item.label}</p>
                      {item.met ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex-shrink-0">
                          Accumulated
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex-shrink-0">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Fiduciary Perks Callout */}
            <div className="p-4 rounded-xl bg-[#0F1C3F] text-white space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9A84C]">
                  {rating.tier} Tier Matrimonial Entitlements
                </h4>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300">
                {rating.perks.map((p, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
