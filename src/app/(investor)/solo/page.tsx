import Link from 'next/link'
import { prisma } from '@/lib/db'
import { formatAnnualRate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

// Individual investing: the same admin-created opportunities, invested in your own name
export default async function SoloInvestmentPage() {
  const opportunities = await prisma.investmentOpportunity.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1C3F]">Invest on your own</h1>
        <p className="text-sm text-gray-500">
          Investments made here are in your name only and don&apos;t need your spouse&apos;s approval. Returns are projections,
          not guarantees, and your capital is at risk.
        </p>
      </div>

      {opportunities.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">No open investments right now.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {opportunities.map((o) => {
            const funded = Number(o.fundedAmount)
            const target = Number(o.targetAmount)
            return (
              <Link
                key={o.id}
                href={`/investments/${o.slug}`}
                className="rounded-2xl border border-gray-200 bg-white p-5 hover:border-[#C9A84C] transition-colors space-y-2"
              >
                <h2 className="font-bold text-[#0F1C3F]">{o.title}</h2>
                <p className="text-xs text-gray-500">{o.shortDescription}</p>
                <dl className="grid grid-cols-3 gap-2 text-xs pt-2">
                  <div>
                    <dt className="text-gray-400">Projected</dt>
                    <dd className="font-semibold text-gray-800">{formatAnnualRate(o.annualReturnRate)} / yr</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">Term</dt>
                    <dd className="font-semibold text-gray-800">{o.termMonths} months</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">Minimum</dt>
                    <dd className="font-semibold text-gray-800">{usd(Number(o.minAmount))}</dd>
                  </div>
                </dl>
                <p className="text-[11px] text-gray-400">
                  {usd(funded)} of {usd(target)} raised · risk {o.riskLevel.toLowerCase()}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
