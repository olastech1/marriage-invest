'use client'

import { TrendingUp, Briefcase, DollarSign, Clock } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface DashboardStats {
  totalInvested: number
  activeInvestments: number
  totalDistributions: number
  pendingTransactions: number
}

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
  accent?: boolean
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------
function StatCard({ label, value, icon, trend, trendUp, accent }: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
        accent
          ? 'border-[#C9A84C]/30 bg-gradient-to-br from-[#0F1C3F] to-[#162d6b] text-white'
          : 'border-slate-200 bg-white text-slate-800'
      }`}
    >
      {/* Background decoration */}
      {accent && (
        <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#C9A84C]/10" />
      )}

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={`text-xs font-medium uppercase tracking-wider ${accent ? 'text-white/60' : 'text-slate-500'}`}>
            {label}
          </p>
          <p className={`text-2xl font-bold tabular-nums ${accent ? 'text-white' : 'text-slate-900'}`}>{value}</p>
          {trend && (
            <p
              className={`flex items-center gap-1 text-xs font-medium ${
                trendUp
                  ? accent
                    ? 'text-emerald-300'
                    : 'text-emerald-600'
                  : accent
                    ? 'text-red-300'
                    : 'text-red-500'
              }`}
            >
              <TrendingUp size={12} className={trendUp ? '' : 'rotate-180'} />
              {trend}
            </p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
            accent ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'bg-[#0F1C3F]/8 text-[#0F1C3F]'
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export default function DashboardStatsPanel({ stats }: { stats: DashboardStats }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Invested"
        value={fmt(stats.totalInvested)}
        icon={<DollarSign size={22} />}
        accent
      />
      <StatCard
        label="Active Investments"
        value={String(stats.activeInvestments)}
        icon={<Briefcase size={22} />}
      />
      <StatCard
        label="Total Distributions"
        value={fmt(stats.totalDistributions)}
        icon={<TrendingUp size={22} />}
        trendUp
      />
      <StatCard
        label="Pending Transactions"
        value={String(stats.pendingTransactions)}
        icon={<Clock size={22} />}
        trend={stats.pendingTransactions > 0 ? `${stats.pendingTransactions} awaiting` : undefined}
        trendUp={false}
      />
    </div>
  )
}
