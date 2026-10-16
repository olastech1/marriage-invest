import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Decimal } from '@prisma/client/runtime/library'
import DashboardStatsPanel, { type DashboardStats } from '@/components/investor/DashboardStats'
import {
  Bell,
  Calendar,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  PiggyBank,
  HeartHandshake,
  Award,
  MessageSquareHeart,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const USD = (n: Decimal | number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    typeof n === 'number' ? n : Number(n),
  )

const pct = (funded: Decimal, target: Decimal) => {
  const t = Number(target)
  if (t === 0) return 0
  return Math.min(100, Math.round((Number(funded) / t) * 100))
}

const fmtDate = (d: Date | null) =>
  d ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d) : '—'

const statusColors: Record<string, string> = {
  PENDING:    'bg-amber-100 text-amber-700',
  ACTIVE:     'bg-emerald-100 text-emerald-700',
  MATURED:    'bg-blue-100 text-blue-700',
  CANCELLED:  'bg-red-100 text-red-600',
  DEFAULTED:  'bg-red-200 text-red-800',
  COMPLETED:  'bg-emerald-100 text-emerald-700',
  PROCESSING: 'bg-sky-100 text-sky-700',
  FAILED:     'bg-red-100 text-red-600',
}

const txTypeColors: Record<string, string> = {
  DEPOSIT:      'bg-emerald-100 text-emerald-700',
  WITHDRAWAL:   'bg-orange-100 text-orange-700',
  DISTRIBUTION: 'bg-blue-100 text-blue-700',
  FEE:          'bg-slate-100 text-slate-600',
  REFUND:       'bg-purple-100 text-purple-700',
  ADJUSTMENT:   'bg-gray-100 text-gray-600',
}

const notifIcon = (type: string) => {
  switch (type) {
    case 'SUCCESS': return <CheckCircle size={16} className="text-emerald-500" />
    case 'WARNING': return <AlertTriangle size={16} className="text-amber-500" />
    case 'ALERT':   return <AlertCircle size={16} className="text-red-500" />
    default:        return <Info size={16} className="text-blue-500" />
  }
}

// ---------------------------------------------------------------------------
// Page
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const userId = session.user.id

  // ── parallel data fetch ────────────────────────────────────────────────
  const [investments, transactions, notifications, activeOpportunities] = await Promise.all([
    prisma.investment.findMany({
      where: { userId },
      include: { opportunity: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { investment: { include: { opportunity: true } } },
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.investmentOpportunity.findMany({
      where: { status: 'ACTIVE' },
      take: 3,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // ── compute stats ──────────────────────────────────────────────────────
  const totalInvested = investments
    .filter((i) => i.status === 'ACTIVE' || i.status === 'MATURED')
    .reduce((s, i) => s + Number(i.amount), 0)

  const activeInvestmentsCount = investments.filter((i) => i.status === 'ACTIVE').length

  const totalDistributions = transactions
    .filter((t) => t.type === 'DISTRIBUTION' && t.status === 'COMPLETED')
    .reduce((s, t) => s + Number(t.netAmount), 0)

  // fetch pending count separately (not limited to 5)
  const pendingTransactions = await prisma.transaction.count({
    where: { userId, status: 'PENDING' },
  })

  const stats: DashboardStats = {
    totalInvested,
    activeInvestments: activeInvestmentsCount,
    totalDistributions,
    pendingTransactions,
  }

  // ── upcoming maturities (next 90 days) ────────────────────────────────
  const now = new Date()
  const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
  const upcomingMaturities = investments.filter(
    (i) => i.status === 'ACTIVE' && i.maturityDate && i.maturityDate > now && i.maturityDate < in90,
  )

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1C3F]">
            Welcome back, {session.user.name?.split(' ')[0] ?? 'Investor'} 👋
          </h1>
          <p className="text-sm text-slate-500">
            {new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(now)}
          </p>
        </div>
        <Link
          href="/deposits"
          className="inline-flex items-center gap-2 rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#b8943e] transition-colors"
        >
          <TrendingUp size={16} />
          Make a Deposit
        </Link>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <DashboardStatsPanel stats={stats} />

      {/* ── Joint Marriage Savings Banner ──────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0F1C3F] via-[#1a2f64] to-[#0F1C3F] p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-[#C9A84C]/30 relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-bold uppercase tracking-wider">
            <PiggyBank className="w-3.5 h-3.5" />
            Joint Marriage Savings Vault · 6.8% APY
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Save Together Toward Your Shared Marital Goals
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Both spouses can contribute to shared milestone funds (home down payment, anniversary trips, education nest egg) with equal 50/50 balance tracking and monthly interest yield payouts.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 w-full md:w-auto">
          <Link
            href="/savings"
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#0F1C3F] shadow-sm hover:bg-[#d4b460] transition-colors"
          >
            Open Savings Vault
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* ── Matrimonial Registry, Chat & Certificate Quick Actions ──────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Spouse Mutual Chat */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-[#C9A84C] transition-all flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Mutual Chat
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#0F1C3F]/5 text-[#0F1C3F] flex items-center justify-center">
                <MessageSquareHeart className="w-4 h-4 text-[#C9A84C]" />
              </div>
            </div>
            <h3 className="text-base font-bold text-[#0F1C3F]">
              Spouse Mutual Chat · Real-Time
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Encrypted channel with your partner. Propose shared vault deposits, discuss investments, and receive instant sound & push notifications.
            </p>
          </div>
          <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Online now</span>
            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F1C3F] hover:text-[#C9A84C] transition-colors"
            >
              Open Chat <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Card 2: Get Married (Never Married) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-[#C9A84C] transition-all flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A84C] bg-[#C9A84C]/10 px-2.5 py-0.5 rounded-full">
                For Unmarried Couples
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#0F1C3F]/5 text-[#0F1C3F] flex items-center justify-center">
                <HeartHandshake className="w-4 h-4 text-[#C9A84C]" />
              </div>
            </div>
            <h3 className="text-base font-bold text-[#0F1C3F]">
              Get Married Online · $500 Reg
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Never been married? File your legal single-status affidavit, solemnize your union, and register both prospective spouses.
            </p>
          </div>
          <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Reg Fee: $500</span>
            <Link
              href="/get-married"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F1C3F] hover:text-[#C9A84C] transition-colors"
            >
              Start Registration <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Card 3: Certificate & Issuance */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-[#C9A84C] transition-all flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                Legal Covenant
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#0F1C3F]/5 text-[#0F1C3F] flex items-center justify-center">
                <Award className="w-4 h-4 text-[#C9A84C]" />
              </div>
            </div>
            <h3 className="text-base font-bold text-[#0F1C3F]">
              Marriage Certificate · $500 Cert
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Review, co-sign with your spouse, and unlock your authenticated 24K gold-embossed certificate with permanent cryptographic seal.
            </p>
          </div>
          <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Cert Fee: $500</span>
            <Link
              href="/certificate"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F1C3F] hover:text-[#C9A84C] transition-colors"
            >
              View Certificate <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Recent Transactions ─────────────────────────────────── */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Recent Transactions</h2>
            <Link href="/transactions" className="flex items-center gap-1 text-xs font-medium text-[#C9A84C] hover:underline">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {transactions.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-left">Type</th>
                    <th className="px-5 py-3 text-left">Description</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => {
                    const isCredit = tx.type === 'DEPOSIT' || tx.type === 'DISTRIBUTION' || tx.type === 'REFUND'
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-3 text-slate-500">{fmtDate(tx.createdAt)}</td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${txTypeColors[tx.type] ?? 'bg-gray-100 text-gray-600'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-700 max-w-[200px] truncate">{tx.description}</td>
                        <td className={`whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isCredit ? '+' : '-'}{USD(tx.netAmount)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[tx.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Notifications ───────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-slate-500" />
              <h2 className="font-semibold text-slate-900">Notifications</h2>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C9A84C] px-1 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
          {notifications.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No notifications.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`flex gap-3 px-5 py-3.5 ${n.read ? '' : 'bg-blue-50/50'}`}
                >
                  <div className="mt-0.5 flex-shrink-0">{notifIcon(n.type)}</div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium text-slate-800 ${n.read ? '' : 'text-[#0F1C3F]'}`}>{n.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{n.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{fmtDate(n.createdAt)}</p>
                  </div>
                  {!n.read && <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#C9A84C]" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Active Portfolio ─────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Active Investments</h2>
            <Link href="/portfolio" className="flex items-center gap-1 text-xs font-medium text-[#C9A84C] hover:underline">
              Full portfolio <ArrowRight size={12} />
            </Link>
          </div>
          {investments.filter((i) => i.status === 'ACTIVE').length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-slate-400">No active investments yet.</p>
              <Link href="/deposits" className="mt-2 inline-block text-xs font-medium text-[#C9A84C] hover:underline">
                Explore opportunities →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {investments
                .filter((i) => i.status === 'ACTIVE')
                .slice(0, 4)
                .map((inv) => (
                  <li key={inv.id} className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{inv.opportunity.title}</p>
                        <p className="text-xs text-slate-500">Ref: {inv.referenceNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#0F1C3F]">{USD(inv.amount)}</p>
                        <p className="text-xs text-slate-400">Matures {fmtDate(inv.maturityDate)}</p>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* ── Upcoming Maturities & Funding Progress ───────────────── */}
        <div className="space-y-6">
          {/* Maturities */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              <Calendar size={16} className="text-slate-500" />
              <h2 className="font-semibold text-slate-900">Upcoming Maturities (90 days)</h2>
            </div>
            {upcomingMaturities.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-slate-400">No maturities in the next 90 days.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcomingMaturities.map((inv) => {
                  const days = Math.ceil(
                    (inv.maturityDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                  )
                  return (
                    <li key={inv.id} className="flex items-center justify-between px-5 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{inv.opportunity.title}</p>
                        <p className="text-xs text-slate-500">{USD(inv.amount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-[#C9A84C]">{days} days</p>
                        <p className="text-xs text-slate-400">{fmtDate(inv.maturityDate)}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Funding progress for active opportunities */}
          {activeOpportunities.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-semibold text-slate-900">Open Opportunities</h2>
              </div>
              <ul className="divide-y divide-slate-100">
                {activeOpportunities.map((opp) => {
                  const progress = pct(opp.fundedAmount, opp.targetAmount)
                  return (
                    <li key={opp.id} className="px-5 py-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-800 truncate pr-2">{opp.title}</span>
                        <span className="flex-shrink-0 text-xs font-semibold text-[#0F1C3F]">
                          {Number(opp.annualReturnRate).toFixed(1)}% p.a.
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#C9A84C] transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="flex-shrink-0 text-xs text-slate-500">{progress}%</span>
                      </div>
                      <div className="mt-1 flex justify-between text-xs text-slate-400">
                        <span>{USD(opp.fundedAmount)} raised</span>
                        <span>{USD(opp.targetAmount)} target</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
