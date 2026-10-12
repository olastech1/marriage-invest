/**
 * /admin/dashboard – Platform overview for admin staff.
 *
 * Server Component: fetches all data via Prisma.
 * Charts are rendered by a client child component (AdminDashboardCharts).
 */

import { Suspense } from 'react'
import { prisma } from '@/lib/db'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Users,
  TrendingUp,
  ArrowDownToLine,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import AdminDashboardCharts from '@/components/admin/AdminDashboardCharts'
import Link from 'next/link'

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string
  value: string
  sub?: string
  icon: React.ElementType
  accent?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${accent ?? 'bg-[#0F1C3F]/10'}`}
      >
        <Icon className="w-6 h-6 text-[#0F1C3F]" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">
          {value}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING: <Clock className="w-4 h-4 text-amber-500" />,
  COMPLETED: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  FAILED: <AlertCircle className="w-4 h-4 text-red-500" />,
  PROCESSING: <Clock className="w-4 h-4 text-blue-500" />,
}

// ── Data fetching ─────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const last12Months = new Date(now)
  last12Months.setMonth(last12Months.getMonth() - 11)
  last12Months.setDate(1)
  last12Months.setHours(0, 0, 0, 0)

  try {
    const [
      totalInvestors,
      totalInvestedAgg,
    pendingWithdrawals,
    transactionsThisMonth,
    recentInvestors,
    pendingWithdrawalList,
    recentTransactions,
    systemNotifications,
    investmentsByOpportunity,
    monthlyDeposits,
  ] = await Promise.all([
    // 1. Count investors
    prisma.user.count({ where: { role: 'INVESTOR' } }),

    // 2. Sum of all active/matured investment amounts
    prisma.investment.aggregate({
      where: { status: { in: ['ACTIVE', 'MATURED'] } },
      _sum: { amount: true },
    }),

    // 3. Count pending withdrawals
    prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),

    // 4. Count transactions this month
    prisma.transaction.count({
      where: { createdAt: { gte: startOfMonth } },
    }),

    // 5. Recent investor registrations (last 10)
    prisma.user.findMany({
      where: { role: 'INVESTOR' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        identityVerified: true,
        _count: { select: { investments: true } },
      },
    }),

    // 6. Pending withdrawal requests (up to 5)
    prisma.withdrawalRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 5,
      include: {
        user: { select: { name: true, email: true } },
        investment: {
          include: { opportunity: { select: { title: true } } },
        },
      },
    }),

    // 7. Recent transactions (last 8)
    prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { user: { select: { name: true } } },
    }),

    // 8. Unread system notifications (INFO/WARNING/ALERT) – stored as admin
    //    notifications. We'll just read the most recent 5.
    prisma.notification.findMany({
      where: { type: { in: ['WARNING', 'ALERT'] }, read: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),

    // 9. Funded amount by opportunity (for pie chart)
    prisma.investmentOpportunity.findMany({
      where: { status: { not: 'DRAFT' } },
      select: {
        title: true,
        fundedAmount: true,
      },
      orderBy: { fundedAmount: 'desc' },
      take: 8,
    }),

    // 10. Monthly deposit totals for the last 12 months (line chart)
    prisma.transaction.groupBy({
      by: ['createdAt'],
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED',
        createdAt: { gte: last12Months },
      },
      _sum: { amount: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  // Build monthly time-series buckets
  const monthBuckets: Record<string, number> = {}
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthBuckets[key] = 0
  }
  for (const row of monthlyDeposits) {
    const d = new Date(row.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (key in monthBuckets) {
      monthBuckets[key] += Number(row._sum.amount ?? 0)
    }
  }
  const chartLineData = Object.entries(monthBuckets).map(([month, total]) => ({
    month,
    total,
  }))

  // Pie data
  const chartPieData = investmentsByOpportunity.map((op) => ({
    name:
      op.title.length > 24 ? op.title.slice(0, 22) + '…' : op.title,
    value: Number(op.fundedAmount),
  }))

  return {
    stats: {
      totalInvestors,
      totalInvested: Number(totalInvestedAgg._sum.amount ?? 0),
      pendingWithdrawals,
      transactionsThisMonth,
    },
    recentInvestors,
    pendingWithdrawalList,
    recentTransactions,
    systemNotifications,
    chartLineData,
    chartPieData,
  }
  } catch {
    return {
      stats: {
        totalInvestors: 0,
        totalInvested: 0,
        pendingWithdrawals: 0,
        transactionsThisMonth: 0,
      },
      recentInvestors: [],
      pendingWithdrawalList: [],
      recentTransactions: [],
      systemNotifications: [],
      chartLineData: [],
      chartPieData: [],
    }
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const data = await getDashboardData()
  const { stats, recentInvestors, pendingWithdrawalList, recentTransactions, systemNotifications, chartLineData, chartPieData } = data

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Last updated: {new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      </div>

      {/* System Notifications Banner */}
      {systemNotifications.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> System Alerts
          </p>
          {systemNotifications.map((n) => (
            <p key={n.id} className="text-xs text-amber-700 pl-6">
              {n.title}: {n.message}
            </p>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Investors"
          value={stats.totalInvestors.toLocaleString()}
          sub="Registered investor accounts"
          icon={Users}
          accent="bg-blue-50"
        />
        <StatCard
          title="Total Invested"
          value={formatCurrency(stats.totalInvested)}
          sub="Active + matured investments"
          icon={TrendingUp}
          accent="bg-emerald-50"
        />
        <StatCard
          title="Pending Withdrawals"
          value={stats.pendingWithdrawals.toLocaleString()}
          sub="Awaiting approval"
          icon={ArrowDownToLine}
          accent="bg-amber-50"
        />
        <StatCard
          title="Transactions (Month)"
          value={stats.transactionsThisMonth.toLocaleString()}
          sub="All types this calendar month"
          icon={CreditCard}
          accent="bg-purple-50"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Monthly Deposits (12 months)
          </h2>
          <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded-lg" />}>
            <AdminDashboardCharts lineData={chartLineData} pieData={chartPieData} />
          </Suspense>
        </div>

        {/* Pending Withdrawals quick-action */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Pending Withdrawals
            </h2>
            <Link
              href="/admin/withdrawals"
              className="text-xs text-[#C9A84C] font-medium hover:underline"
            >
              View all →
            </Link>
          </div>
          {pendingWithdrawalList.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No pending withdrawals 🎉
            </p>
          ) : (
            <ul className="space-y-3">
              {pendingWithdrawalList.map((w) => (
                <li
                  key={w.id}
                  className="flex items-start justify-between gap-2 pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {w.user.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {w.investment.opportunity.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(w.createdAt)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                    {formatCurrency(Number(w.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Bottom grids */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent registrations */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Recent Registrations
            </h2>
            <Link
              href="/admin/investors"
              className="text-xs text-[#C9A84C] font-medium hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-2 font-medium text-gray-500 text-xs">Name</th>
                  <th className="pb-2 font-medium text-gray-500 text-xs">Email</th>
                  <th className="pb-2 font-medium text-gray-500 text-xs">KYC</th>
                  <th className="pb-2 font-medium text-gray-500 text-xs">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentInvestors.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="py-2.5 font-medium text-gray-900 pr-4">
                      <Link
                        href={`/admin/investors?id=${inv.id}`}
                        className="hover:text-[#C9A84C] hover:underline"
                      >
                        {inv.name}
                      </Link>
                    </td>
                    <td className="py-2.5 text-gray-500 pr-4 truncate max-w-[140px]">
                      {inv.email}
                    </td>
                    <td className="py-2.5">
                      {inv.identityVerified ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-medium">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(inv.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Recent Transactions
            </h2>
            <Link
              href="/admin/transactions"
              className="text-xs text-[#C9A84C] font-medium hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {STATUS_ICON[tx.status] ?? <Clock className="w-4 h-4 text-gray-400" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {tx.user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {tx.type} · {tx.reference}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className={`text-sm font-semibold ${tx.type === 'WITHDRAWAL' ? 'text-red-600' : 'text-emerald-600'}`}
                  >
                    {tx.type === 'WITHDRAWAL' ? '-' : '+'}
                    {formatCurrency(Number(tx.amount))}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(tx.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
