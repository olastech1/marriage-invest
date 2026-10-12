import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  FileText,
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Layers,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  const session = await auth()
  if (!session?.user?.role || !['ADMIN', 'FINANCE'].includes(session.user.role)) {
    redirect('/login?callbackUrl=/admin/reports')
  }

  let opportunities: any[] = []
  let transactions: any[] = []
  let usersCount = 0

  try {
    const res = await Promise.all([
      prisma.investmentOpportunity.findMany({
        include: {
          investments: {
            where: { status: 'ACTIVE' },
          },
        },
      }),
      prisma.transaction.findMany({
        where: { status: 'COMPLETED' },
      }),
      prisma.user.count({ where: { role: 'INVESTOR' } }),
    ])
    opportunities = res[0]
    transactions = res[1]
    usersCount = res[2]
  } catch {
    // DB offline
  }

  const totalFunded = opportunities.reduce((sum, o) => sum + Number(o.fundedAmount), 0)
  const totalTarget = opportunities.reduce((sum, o) => sum + Number(o.targetAmount), 0)

  const totalDeposits = transactions
    .filter((t) => t.type === 'DEPOSIT')
    .reduce((sum, t) => sum + Number(t.netAmount), 0)

  const totalDistributions = transactions
    .filter((t) => t.type === 'DISTRIBUTION')
    .reduce((sum, t) => sum + Number(t.netAmount), 0)

  const totalWithdrawals = transactions
    .filter((t) => t.type === 'WITHDRAWAL')
    .reduce((sum, t) => sum + Number(t.netAmount), 0)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reporting & Analytics</h1>
          <p className="text-xs text-gray-500 mt-1">
            Reconciled accounting statements, fund metrics, and capital allocation performance.
          </p>
        </div>
      </div>

      {/* High-level Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
            Total Capital Inflow (USD)
          </span>
          <span className="text-2xl font-bold text-[#0F1C3F]">
            {formatCurrency(totalDeposits)}
          </span>
          <span className="text-[11px] text-gray-500 block mt-1">Settled Investor Deposits</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
            Yield Disbursements (USD)
          </span>
          <span className="text-2xl font-bold text-emerald-600">
            {formatCurrency(totalDistributions)}
          </span>
          <span className="text-[11px] text-gray-500 block mt-1">Disbursed to Investor Accounts</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
            Capital Liquidated (USD)
          </span>
          <span className="text-2xl font-bold text-orange-600">
            {formatCurrency(totalWithdrawals)}
          </span>
          <span className="text-[11px] text-gray-500 block mt-1">Completed Wire Payouts</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
            Total Investor Base
          </span>
          <span className="text-2xl font-bold text-[#C9A84C]">
            {usersCount} Couples
          </span>
          <span className="text-[11px] text-gray-500 block mt-1">Verified Joint Accounts</span>
        </div>
      </div>

      {/* Breakdown by Opportunity */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Portfolio Performance by Offering</h2>
            <p className="text-xs text-gray-500">Capital aggregation, investor count, and target ratios.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3 px-6">Opportunity Title</th>
                <th className="py-3 px-6">Active Investors</th>
                <th className="py-3 px-6">Total Funded</th>
                <th className="py-3 px-6">Funding Target</th>
                <th className="py-3 px-6">Ratio Funded</th>
                <th className="py-3 px-6">Projected Yield</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {opportunities.map((opp) => {
                const f = Number(opp.fundedAmount)
                const t = Number(opp.targetAmount)
                const pct = Math.min(100, Math.round((f / t) * 100))

                return (
                  <tr key={opp.id} className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-6 font-semibold text-gray-900">{opp.title}</td>
                    <td className="py-3.5 px-6 text-gray-700">{opp.investments.length}</td>
                    <td className="py-3.5 px-6 font-bold text-gray-900">{formatCurrency(f)}</td>
                    <td className="py-3.5 px-6 text-gray-500">{formatCurrency(t)}</td>
                    <td className="py-3.5 px-6 font-semibold text-[#0F1C3F]">{pct}%</td>
                    <td className="py-3.5 px-6 text-emerald-700 font-bold">
                      {(Number(opp.annualReturnRate) * 100).toFixed(1)}% p.a.
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#C9A84C]/15 text-[#C9A84C]">
                        {opp.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
