import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatAnnualRate, formatCurrency } from '@/lib/utils'
import CreateOpportunityForm from '@/components/admin/CreateOpportunityForm'
import OpportunityStatusSelect from '@/components/admin/OpportunityStatusSelect'
import LoadErrorBanner from '@/components/admin/LoadErrorBanner'

export const dynamic = 'force-dynamic'

export default async function AdminInvestmentsPage() {
  const session = await auth()
  if (!session?.user?.role || !['ADMIN', 'FINANCE'].includes(session.user.role)) {
    redirect('/login?callbackUrl=/admin/investments')
  }

  const isAdmin = session.user.role === 'ADMIN'
  let loadError = false
  let opportunities: any[] = []
  try {
    opportunities = await prisma.investmentOpportunity.findMany({
      include: {
        _count: { select: { investments: true, documents: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  } catch (error) {
    console.error('[admin/investments]', error)
    loadError = true
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Opportunities</h1>
          <p className="text-xs text-gray-500 mt-1">
            Members can only invest in opportunities created here with status Active.
          </p>
        </div>
        {isAdmin && <CreateOpportunityForm />}
      </div>

      {loadError && <LoadErrorBanner />}

      {!loadError && opportunities.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-500">
          No investment opportunities yet.{isAdmin && ' Use "New Opportunity" to create one.'}
        </div>
      )}

      {/* Opportunities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {opportunities.map((opp) => {
          const funded = Number(opp.fundedAmount)
          const target = Number(opp.targetAmount)
          const pct = target > 0 ? Math.min(100, Math.round((funded / target) * 100)) : 0

          return (
            <div
              key={opp.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-bold text-[#0F1C3F] leading-snug">
                    {opp.title}
                  </h3>
                  {isAdmin ? (
                    <OpportunityStatusSelect id={opp.id} status={opp.status} />
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A84C]/15 text-[#C9A84C]">
                      {opp.status}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                  {opp.shortDescription}
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Funded: {formatCurrency(funded)}</span>
                    <span className="font-semibold text-gray-900">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-[#C9A84C] h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pb-4 border-b border-gray-100 mb-4">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Projected Return</span>
                    <span className="font-bold text-emerald-700">
                      {formatAnnualRate(opp.annualReturnRate)} p.a.
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Term</span>
                    <span className="font-semibold text-gray-900">{opp.termMonths} Months</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Min. Entry</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(Number(opp.minAmount))}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Investments</span>
                    <span className="font-semibold text-gray-900">{opp._count.investments}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2">
                <Link
                  href={`/investments/${opp.slug}`}
                  className="text-[#C9A84C] font-semibold hover:underline"
                >
                  Public View →
                </Link>
                <span className="text-[11px] text-gray-400">
                  {opp._count.documents} Docs Attached
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
