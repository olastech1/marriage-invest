import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { formatCurrency, formatDate } from '@/lib/utils'
import { auth } from '@/lib/auth'
import {
  ShieldAlert,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

const FALLBACK_DETAIL: Record<string, any> = {
  'matrimonial-prime-yield-fund-i': {
    id: 'f1',
    title: 'Matrimonial Prime Yield Fund I',
    slug: 'matrimonial-prime-yield-fund-i',
    description: 'Senior-secured debt facility backing tier-1 wedding reception venues, banquet estates, and luxury event production providers across high-demand metropolitan markets. Structured with first-position asset liens, corporate parent guarantees, and rigorous monthly cash flow covenant monitoring.',
    shortDescription: 'Senior-secured credit portfolio supporting verified wedding event venues & prime hospitality assets.',
    minAmount: 1000,
    maxAmount: 50000,
    targetAmount: 500000,
    fundedAmount: 320000,
    termMonths: 24,
    annualReturnRate: 0.108,
    distributionType: 'QUARTERLY',
    status: 'ACTIVE',
    riskLevel: 'LOW',
    openDate: new Date('2024-01-15'),
    closeDate: new Date('2024-12-31'),
    documents: [
      {
        id: 'doc-1',
        name: 'Form 1-A Offering Circular — Matrimonial Prime Yield Fund I',
        fileUrl: '/documents/offering-circular-fund-i-v1.2.pdf',
        version: '1.2',
        fileSize: 2450000,
        createdAt: new Date('2024-01-15'),
      },
    ],
  },
  'marital-homestead-growth-notes-v': {
    id: 'f2',
    title: 'Marital Homestead Growth Notes V',
    slug: 'marital-homestead-growth-notes-v',
    description: 'First-lien residential acquisition notes tailored for married couples entering long-term property ownership. Secured against verified single-family residential equity with conservative loan-to-value underwriting.',
    shortDescription: 'First-lien residential acquisition notes tailored for married couples entering long-term property ownership.',
    minAmount: 2500,
    maxAmount: 100000,
    targetAmount: 800000,
    fundedAmount: 512000,
    termMonths: 36,
    annualReturnRate: 0.084,
    distributionType: 'MONTHLY',
    status: 'ACTIVE',
    riskLevel: 'MEDIUM',
    openDate: new Date('2024-02-01'),
    closeDate: new Date('2025-06-30'),
    documents: [],
  },
  'enduring-union-balanced-portfolio': {
    id: 'f3',
    title: 'Enduring Union Balanced Portfolio',
    slug: 'enduring-union-balanced-portfolio',
    description: 'Multi-asset liquidity fund providing capital preservation with balanced dividend yields for joint couple accounts.',
    shortDescription: 'Multi-asset liquidity fund providing capital preservation with balanced dividend yields.',
    minAmount: 500,
    maxAmount: 25000,
    targetAmount: 300000,
    fundedAmount: 195000,
    termMonths: 12,
    annualReturnRate: 0.069,
    distributionType: 'ANNUAL',
    status: 'ACTIVE',
    riskLevel: 'LOW',
    openDate: new Date('2024-03-01'),
    closeDate: new Date('2024-11-30'),
    documents: [],
  },
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()

  let opportunity: any = null
  try {
    opportunity = await prisma.investmentOpportunity.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        documents: {
          where: { isPublic: true },
        },
      },
    })
  } catch {
    // Database offline
  }

  if (!opportunity) {
    opportunity = FALLBACK_DETAIL[id] || Object.values(FALLBACK_DETAIL)[0]
  }

  if (!opportunity) {
    notFound()
  }

  const fundedAmount = Number(opportunity.fundedAmount)
  const targetAmount = Number(opportunity.targetAmount)
  const percentFunded = Math.min(100, Math.round((fundedAmount / targetAmount) * 100))
  const returnRatePercent = (Number(opportunity.annualReturnRate) * 100).toFixed(2)

  return (
    <div className="bg-white min-h-screen">
      {/* Top Banner with Risk Warning */}
      <div className="bg-amber-50 border-b border-amber-200 py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>
              <strong>Regulatory Risk Disclosure:</strong> Projected return of {returnRatePercent}% p.a. is an estimate and not guaranteed. Your capital is at risk.
            </span>
          </div>
          <Link href="/documents" className="text-amber-800 underline hover:text-amber-950 font-medium hidden sm:inline">
            Review Offer Document
          </Link>
        </div>
      </div>

      {/* Hero & Title Header */}
      <div className="bg-[#0F1C3F] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30">
              {opportunity.riskLevel} Risk • {opportunity.status}
            </span>
            <span className="text-xs text-gray-300 font-mono">
              Offer Ref: {opportunity.slug}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            {opportunity.title}
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl leading-relaxed">
            {opportunity.shortDescription}
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left 2 Cols: Details & Legal Terms */}
          <div className="lg:col-span-2 space-y-10">
            {/* Project Overview */}
            <section className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
              <h2 className="text-xl font-bold text-[#0F1C3F] mb-4">Project Overview & Objectives</h2>
              <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                {opportunity.description}
              </p>
            </section>

            {/* Key Contractual Terms Grid */}
            <section className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
              <h2 className="text-xl font-bold text-[#0F1C3F] mb-6">Contractual Terms & Specifications</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div className="border border-gray-100 p-4 rounded-lg bg-gray-50/50">
                  <span className="text-xs text-gray-500 block mb-1">Currency & Denomination</span>
                  <span className="font-semibold text-gray-900">United States Dollars (USD $)</span>
                </div>
                <div className="border border-gray-100 p-4 rounded-lg bg-gray-50/50">
                  <span className="text-xs text-gray-500 block mb-1">Projected Annual Return</span>
                  <span className="font-semibold text-[#C9A84C] text-base">{returnRatePercent}% p.a. (Projected)</span>
                </div>
                <div className="border border-gray-100 p-4 rounded-lg bg-gray-50/50">
                  <span className="text-xs text-gray-500 block mb-1">Minimum Contribution</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(Number(opportunity.minAmount))}</span>
                </div>
                <div className="border border-gray-100 p-4 rounded-lg bg-gray-50/50">
                  <span className="text-xs text-gray-500 block mb-1">Maximum Contribution</span>
                  <span className="font-semibold text-gray-900">
                    {opportunity.maxAmount ? formatCurrency(Number(opportunity.maxAmount)) : 'No individual ceiling'}
                  </span>
                </div>
                <div className="border border-gray-100 p-4 rounded-lg bg-gray-50/50">
                  <span className="text-xs text-gray-500 block mb-1">Contract Term & Maturity</span>
                  <span className="font-semibold text-gray-900">{opportunity.termMonths} Months ({Math.round(opportunity.termMonths / 12 * 10) / 10} Years)</span>
                </div>
                <div className="border border-gray-100 p-4 rounded-lg bg-gray-50/50">
                  <span className="text-xs text-gray-500 block mb-1">Distribution Schedule</span>
                  <span className="font-semibold text-gray-900 uppercase">{opportunity.distributionType} Distributions</span>
                </div>
                <div className="border border-gray-100 p-4 rounded-lg bg-gray-50/50">
                  <span className="text-xs text-gray-500 block mb-1">Funding Target</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(targetAmount)}</span>
                </div>
                <div className="border border-gray-100 p-4 rounded-lg bg-gray-50/50">
                  <span className="text-xs text-gray-500 block mb-1">Maturity Date</span>
                  <span className="font-semibold text-gray-900">{opportunity.maturityDate ? formatDate(opportunity.maturityDate) : 'Calculated at closing'}</span>
                </div>
              </div>
            </section>

            {/* Risk Factors & Disclosures */}
            <section className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
              <h2 className="text-xl font-bold text-[#0F1C3F] mb-4">Risk Factors & Capital Considerations</h2>
              <div className="space-y-4 text-sm text-gray-600">
                <p>
                  <strong>No Guarantee of Yield:</strong> The stated return rate of {returnRatePercent}% p.a. reflects projected underlying asset cash-flows. Macroeconomic disruptions, interest rate fluctuations, or contractual counterparties may impact final yields.
                </p>
                <p>
                  <strong>Liquidity and Lockup:</strong> Capital committed to this opportunity is subject to a {opportunity.termMonths}-month contractual tenure. Early redemption requests are evaluated per platform liquidity policies and may incur redemption charges.
                </p>
                <p>
                  <strong>Regulatory Status:</strong> This offering is conducted pursuant to applicable private syndication standards. Prospective investors must satisfy verification and onboarding criteria.
                </p>
              </div>
            </section>

            {/* Official Offer Documents */}
            <section className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
              <h2 className="text-xl font-bold text-[#0F1C3F] mb-4">Official Offer Documents</h2>
              {opportunity.documents.length === 0 ? (
                <p className="text-sm text-gray-500">Official offer document is generated and archived in our compliance library.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {opportunity.documents.map((doc: any) => (
                    <div key={doc.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#C9A84C]" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
                          <p className="text-xs text-gray-500">Version {doc.version} • PDF Document</p>
                        </div>
                      </div>
                      <Link
                        href={doc.fileUrl || '/documents'}
                        className="px-4 py-2 text-xs font-semibold text-[#0F1C3F] border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        Download PDF
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Col: Investment Action Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 sticky top-24">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Verified Progress
              </span>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold text-[#0F1C3F]">
                  {formatCurrency(fundedAmount)}
                </span>
                <span className="text-sm font-semibold text-gray-500">
                  of {formatCurrency(targetAmount)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
                <div
                  className="bg-[#C9A84C] h-3 rounded-full transition-all duration-500"
                  style={{ width: `${percentFunded}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-500 mb-6 pb-6 border-b border-gray-100">
                <span>{percentFunded}% Funded</span>
                <span>Target: {formatCurrency(targetAmount)}</span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Min. Entry</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(Number(opportunity.minAmount))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tenure</span>
                  <span className="font-semibold text-gray-900">{opportunity.termMonths} Months</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Distributions</span>
                  <span className="font-semibold text-gray-900 capitalize">{opportunity.distributionType.toLowerCase()}</span>
                </div>
              </div>

              {session?.user ? (
                <Link
                  href={`/deposits?opportunityId=${opportunity.id}`}
                  className="w-full py-3.5 px-4 bg-[#0F1C3F] hover:bg-[#162c5e] text-white text-center font-semibold rounded-xl block transition shadow-sm text-sm"
                >
                  Proceed to Invest →
                </Link>
              ) : (
                <div className="space-y-2">
                  <Link
                    href={`/register?redirect=/investments/${opportunity.slug}`}
                    className="w-full py-3.5 px-4 bg-[#C9A84C] hover:bg-[#b08b3a] text-[#0F1C3F] font-bold text-center rounded-xl block transition shadow-sm text-sm"
                  >
                    Register Joint Account to Invest
                  </Link>
                  <Link
                    href={`/login?redirect=/investments/${opportunity.slug}`}
                    className="w-full py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-center text-xs font-semibold rounded-xl block transition"
                  >
                    Existing Investor? Log In
                  </Link>
                </div>
              )}

              <p className="text-[11px] text-gray-400 text-center mt-4">
                🔒 Bank-grade 256-bit SSL encryption. Funds secured in designated custody accounts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
