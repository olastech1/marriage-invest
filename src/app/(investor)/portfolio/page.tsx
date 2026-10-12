import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  Download,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PortfolioPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/portfolio')
  }

  const userId = session.user.id

  const investments = await prisma.investment.findMany({
    where: { userId },
    include: {
      opportunity: true,
      distributions: {
        orderBy: { scheduledDate: 'desc' },
      },
      transactions: {
        where: { status: 'COMPLETED' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalInvested = investments
    .filter((inv) => inv.status === 'ACTIVE' || inv.status === 'MATURED')
    .reduce((sum, inv) => sum + Number(inv.amount), 0)

  const activeCount = investments.filter((inv) => inv.status === 'ACTIVE').length
  const maturedCount = investments.filter((inv) => inv.status === 'MATURED').length

  const totalDistributions = investments.reduce((sum, inv) => {
    const distSum = inv.distributions
      .filter((d) => d.status === 'COMPLETED')
      .reduce((dSub, d) => dSub + Number(d.amount), 0)
    return sum + distSum
  }, 0)

  return (
    <div className="space-y-8">
      {/* Page Title & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1C3F]">Investment Portfolio</h1>
          <p className="text-xs text-gray-500 mt-1">
            Verified joint holdings, contractual maturity schedules, and cumulative distribution returns.
          </p>
        </div>
        <Link
          href="/deposits"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A84C] text-[#0F1C3F] font-bold text-xs hover:bg-[#d4b460] shadow-sm transition-all"
        >
          Explore New Opportunities →
        </Link>
      </div>

      {/* Portfolio Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
            Total Active Capital
          </span>
          <span className="text-2xl font-bold text-[#0F1C3F]">
            {formatCurrency(totalInvested)}
          </span>
          <span className="text-[11px] text-gray-500 block mt-1">USD-Denominated Principal</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
            Active Holdings
          </span>
          <span className="text-2xl font-bold text-emerald-600">
            {activeCount}
          </span>
          <span className="text-[11px] text-gray-500 block mt-1">Currently Earning Returns</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
            Matured Vehicles
          </span>
          <span className="text-2xl font-bold text-blue-600">
            {maturedCount}
          </span>
          <span className="text-[11px] text-gray-500 block mt-1">Completed Contract Terms</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
            Total Distributions
          </span>
          <span className="text-2xl font-bold text-[#C9A84C]">
            {formatCurrency(totalDistributions)}
          </span>
          <span className="text-[11px] text-gray-500 block mt-1">Cumulative Contract Payouts</span>
        </div>
      </div>

      {/* Detailed Holdings Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0F1C3F]">Individual Investment Ledger</h2>
            <p className="text-xs text-gray-500">Traceable records connected to verified financial transactions.</p>
          </div>
        </div>

        {investments.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-gray-700 mb-1">No Active Investments Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
              You have not yet committed capital to any marriage investment vehicles.
            </p>
            <Link
              href="/investments"
              className="px-6 py-2.5 rounded-xl bg-[#0F1C3F] text-white text-xs font-semibold hover:bg-[#162c5e]"
            >
              Browse Available Offerings
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-6">Reference No.</th>
                  <th className="py-3.5 px-6">Opportunity Name</th>
                  <th className="py-3.5 px-6">Capital Contributed</th>
                  <th className="py-3.5 px-6">Confirmed Date</th>
                  <th className="py-3.5 px-6">Tenure / Maturity</th>
                  <th className="py-3.5 px-6">Distributions</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {investments.map((inv) => {
                  const distSum = inv.distributions
                    .filter((d) => d.status === 'COMPLETED')
                    .reduce((sum, d) => sum + Number(d.amount), 0)

                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-mono font-medium text-gray-900">
                        {inv.referenceNumber}
                      </td>
                      <td className="py-4 px-6">
                        <Link
                          href={`/investments/${inv.opportunity.slug}`}
                          className="font-semibold text-[#0F1C3F] hover:underline"
                        >
                          {inv.opportunity.title}
                        </Link>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {(Number(inv.opportunity.annualReturnRate) * 100).toFixed(1)}% p.a. Projected • {inv.opportunity.distributionType.toLowerCase()}
                        </p>
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-900">
                        {formatCurrency(Number(inv.amount))}
                      </td>
                      <td className="py-4 px-6 text-gray-500">
                        {inv.confirmedAt ? formatDate(inv.confirmedAt) : 'Pending Settlement'}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        <span>{inv.opportunity.termMonths} Mo</span>
                        <p className="text-[11px] text-gray-400 font-mono">
                          Due: {inv.maturityDate ? formatDate(inv.maturityDate) : 'TBD'}
                        </p>
                      </td>
                      <td className="py-4 px-6 font-semibold text-emerald-600">
                        {formatCurrency(distSum)}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            inv.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : inv.status === 'MATURED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {inv.status === 'ACTIVE' && (
                          <Link
                            href={`/withdrawals?investmentId=${inv.id}`}
                            className="inline-block px-3 py-1 rounded-lg border border-gray-200 text-gray-700 text-[11px] font-medium hover:bg-gray-50"
                          >
                            Withdraw
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
