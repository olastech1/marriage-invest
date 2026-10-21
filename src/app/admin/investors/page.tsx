import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { computeAccountRating, isDemoTransaction, isDemoInvestment } from '@/lib/rating'
import { Search, CheckCircle2, Clock } from 'lucide-react'
import LoadErrorBanner from '@/components/admin/LoadErrorBanner'

export const dynamic = 'force-dynamic'

export default async function AdminInvestorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>
}) {
  const session = await auth()
  if (!session?.user?.role || !['ADMIN', 'FINANCE', 'COMPLIANCE', 'SUPPORT'].includes(session.user.role)) {
    redirect('/login?callbackUrl=/admin/investors')
  }

  const { q } = await searchParams
  const query = (Array.isArray(q) ? q[0] : q ?? '').trim()

  let loadError = false
  let investors: any[] = []
  let allDocuments: any[] = []
  try {
    const [invs, docs] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: 'INVESTOR',
          ...(query && {
            OR: [
              { name: { contains: query, mode: 'insensitive' as const } },
              { email: { contains: query, mode: 'insensitive' as const } },
            ],
          }),
        },
        include: {
          investments: true,
          documents: true,
          transactions: {
            where: { status: 'COMPLETED' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.document.findMany({
        select: { id: true, name: true, type: true },
      }),
    ])
    investors = invs
    allDocuments = docs
  } catch (error) {
    console.error('[admin/investors]', error)
    loadError = true
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investor Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Registered investor accounts, identity verification status, and invested amounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700">
            {query ? 'Matching' : 'Total'} Investors: {investors.length}
          </span>
        </div>
      </div>

      {loadError && <LoadErrorBanner />}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <form method="get" className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search investor by name or email..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:border-[#C9A84C]"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3 px-6">Investor / Couple</th>
                <th className="py-3 px-6">Contact Email & Phone</th>
                <th className="py-3 px-6">Registration Date</th>
                <th className="py-3 px-6">Account Rating</th>
                <th className="py-3 px-6">KYC Status</th>
                <th className="py-3 px-6">Active Investments</th>
                <th className="py-3 px-6">Invested (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loadError && investors.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 px-6 text-center text-gray-400">
                    {query ? 'No investors match your search.' : 'No investors have registered yet.'}
                  </td>
                </tr>
              )}
              {investors.map((inv: any) => {
                const realInvestments = (inv.investments || []).filter((i: any) => !isDemoInvestment(i))
                const realTransactions = (inv.transactions || []).filter((t: any) => !isDemoTransaction(t))
                const totalFunded = realInvestments.reduce((sum: number, i: any) => sum + Number(i.amount), 0)
                const realDeposited = realTransactions
                  .filter((t: any) => t.type === 'DEPOSIT')
                  .reduce((sum: number, t: any) => sum + Number(t.netAmount), 0)
                const activeCount = realInvestments.filter((i: any) => i.status === 'ACTIVE').length

                const docIds = (inv.documents || []).map((d: any) => d.documentId)
                const rating = computeAccountRating({
                  acknowledgedDocIds: docIds,
                  allDocuments,
                  isIdentityVerified: Boolean(inv.identityVerified),
                  hasMarriageCovenant: realTransactions.some((t: any) => t.type === 'FEE'),
                  realDepositedAmount: realDeposited,
                  realInvestedAmount: totalFunded,
                })

                return (
                  <tr key={inv.id} className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-6 font-semibold text-gray-900">
                      {inv.name}
                    </td>
                    <td className="py-3.5 px-6 text-gray-600">
                      <div>{inv.email}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{inv.phone || 'No phone'}</div>
                    </td>
                    <td className="py-3.5 px-6 text-gray-500 font-mono">
                      {formatDate(inv.createdAt)}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-1.5">
                        <span className="font-serif font-black text-xs px-2 py-0.5 rounded-md bg-[#0F1C3F] text-[#C9A84C] border border-[#C9A84C]/40">
                          {rating.tier}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          {rating.documentCount} docs
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      {inv.identityVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-gray-800">
                      {activeCount} Active
                    </td>
                    <td className="py-3.5 px-6 font-bold text-[#0F1C3F]">
                      {formatCurrency(totalFunded)}
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
