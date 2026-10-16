'use client'

import { useState } from 'react'
import { Sparkles, HeartHandshake, CheckCircle2, ArrowRight } from 'lucide-react'

export default function YieldForGoodCard() {
  const [pledgePercent, setPledgePercent] = useState<number>(5)
  const [pledged, setPledged] = useState<boolean>(false)

  // Simulation: Assuming $50,000 portfolio generating ~$4,500 annual returns
  const simulatedAnnualReturn = 4500
  const simulatedPledgeAnnual = (simulatedAnnualReturn * (pledgePercent / 100)).toFixed(0)
  const simulatedNightsProvided = Math.round(Number(simulatedPledgeAnnual) / 35)

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#0F1C3F] via-[#1a2f64] to-[#0F1C3F] text-white p-6 sm:p-8 shadow-xl border border-[#C9A84C]/30 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Yield for Good · Automated Spousal Philanthropy
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
          Grow Your Matrimonial Wealth While Giving Back to Inclusive Communities
        </h3>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
          Automate your family giving. Direct a modest slice of your monthly investment distributions or savings vault APY into audited LGBTQ+ youth housing, marriage legal defense, and adoption grants.
        </p>

        {/* Interactive Slider / Buttons */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-2 font-medium">
            <span>Monthly Yield Allocation Percentage</span>
            <span className="text-[#C9A84C] font-bold text-sm">{pledgePercent}% of Earnings</span>
          </div>

          <div className="grid grid-cols-4 gap-2 max-w-md">
            {[2, 5, 10, 15].map((pct) => (
              <button
                key={pct}
                onClick={() => {
                  setPledgePercent(pct)
                  setPledged(false)
                }}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  pledgePercent === pct
                    ? 'bg-[#C9A84C] text-[#0F1C3F] border-[#C9A84C] shadow-sm'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Impact preview */}
          <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">ESTIMATED ANNUAL IMPACT</span>
              <span className="text-base font-bold text-emerald-400">
                ${simulatedPledgeAnnual} USD / Year
              </span>
              <span className="text-slate-400 text-[11px] block">
                ≈ {simulatedNightsProvided} safe shelter nights or 3 family adoption legal filings
              </span>
            </div>

            <button
              onClick={() => setPledged(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A84C] text-[#0F1C3F] font-bold text-xs hover:bg-[#d4b460] transition-colors self-start sm:self-auto"
            >
              {pledged ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-800" />
                  Pledge Registered
                </>
              ) : (
                <>
                  <HeartHandshake size={14} />
                  Activate {pledgePercent}% Yield Pledge
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
