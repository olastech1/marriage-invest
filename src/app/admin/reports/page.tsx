import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { formatAnnualRate, formatCurrency } from '@/lib/utils'
import LoadErrorBanner from '@/components/admin/LoadErrorBanner'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  const session = await auth()
  if (!session?.user?.role || !['ADMIN', 'FINANCE'].includes(session.user.role)) {
    redirect('/login?callbackUrl=/admin/reports')
  }

  let loadError = false
  let opportunities: any[] = []
  let totals: { type: string; _sum: { netAmount: unknown } }[] = []
  let usersCount = 0

  try {
    const res = await Promise.all([
      prisma.investmentOpportunity.findMany({
        include: {
          _count: { select: { investments: { where: { status: 'ACTIVE' } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.groupBy({
        by: ['type'],
        where: { status: 'COMPLETED' },
        _sum: { netAmount: true },
      }),
      prisma.user.count({ where: { role: 'INVESTOR' } }),
    ])
    opportunities = res[0]
    totals = res[1]
    usersCount = res[2]
  } catch (error) {
    console.error('[admin/reports]', error)
    loadError = true
  }

  const totalFor = (type: string) => Number(totals.find((t) => t.type === type)?._sum.netAmount ?? 0)
  const totalDeposits = totalFor('DEPOSIT')
  const totalDistributions = totalFor('DISTRIBUTION')
  const totalWithdrawals = totalFor('WITHDRAWAL')

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-xs text-gray-500 mt-1">
            Totals of completed transactions and funding by opportunity.
          </p>
        </div>
      </div>

      {loadError && <LoadErrorBanner />}

      {/* High-level Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
            Total Deposits (USD)
          </span>
          <span className="text-2xl font-bold text-[#0F1C3F]">
            {formatCurrency(totalDeposits)}
          </span>
          <span className="text-[11px] text-gray-500 block mt-1">Completed deposits, net of fees</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
            Distributions Paid (USD)
          </span>
          <span className="text-2xl font-bold text-emerald-600">
            {formatCurrency(totalDistributions)}
          </span>
          <span className="text-[11px] text-gray-500 block mt-1">Completed distributions</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
            Withdrawals Paid (USD)
          </span>
          <span className="text-2xl font-bold text-orange-600">
            {formatCurrency(totalWithdrawals)}
          </span>
          <span className="text-[11px] text-gray-500 block mt-1">Completed withdrawals, net of fees</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
            Investor Accounts
          </span>
          <span className="text-2xl font-bold text-[#C9A84C]">
            {usersCount.toLocaleString()}
          </span>
          <span className="text-[11px] text-gray-500 block mt-1">Registered investor accounts</span>
        </div>
      </div>

      {/* Breakdown by Opportunity */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Funding by Opportunity</h2>
            <p className="text-xs text-gray-500">Amount funded against target, and number of active investments.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3 px-6">Opportunity Title</th>
                <th className="py-3 px-6">Active Investments</th>
                <th className="py-3 px-6">Total Funded</th>
                <th className="py-3 px-6">Funding Target</th>
                <th className="py-3 px-6">Ratio Funded</th>
                <th className="py-3 px-6">Projected Return</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loadError && opportunities.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 px-6 text-center text-gray-400">
                    No investment opportunities yet.
                  </td>
                </tr>
              )}
              {opportunities.map((opp) => {
                const f = Number(opp.fundedAmount)
                const t = Number(opp.targetAmount)
                const pct = t > 0 ? Math.min(100, Math.round((f / t) * 100)) : 0

                return (
                  <tr key={opp.id} className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-6 font-semibold text-gray-900">{opp.title}</td>
                    <td className="py-3.5 px-6 text-gray-700">{opp._count.investments}</td>
                    <td className="py-3.5 px-6 font-bold text-gray-900">{formatCurrency(f)}</td>
                    <td className="py-3.5 px-6 text-gray-500">{formatCurrency(t)}</td>
                    <td className="py-3.5 px-6 font-semibold text-[#0F1C3F]">{pct}%</td>
                    <td className="py-3.5 px-6 text-emerald-700 font-bold">
                      {formatAnnualRate(opp.annualReturnRate)} p.a.
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
