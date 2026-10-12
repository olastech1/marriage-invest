import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import {
  Shield,
  Lock,
  ArrowRight,
  CheckCircle2,
  FileText,
  HelpCircle,
  TrendingUp,
  Users,
  Award,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Union Invest — Marriage Investment Platform',
  description:
    'Secure your financial future together with USD-denominated investments tailored for couples and marriage.',
}

export const dynamic = 'force-dynamic'

const FALLBACK_OPPORTUNITIES = [
  {
    id: 'f1',
    slug: 'matrimonial-prime-yield-fund-i',
    title: 'Matrimonial Prime Yield Fund I',
    shortDescription: 'Senior-secured credit portfolio supporting verified wedding event venues & prime hospitality assets.',
    status: 'ACTIVE',
    annualReturnRate: 0.108,
    fundedAmount: 320000,
    targetAmount: 500000,
    minAmount: 1000,
    termMonths: 24,
    distributionType: 'QUARTERLY',
  },
  {
    id: 'f2',
    slug: 'marital-homestead-growth-notes-v',
    title: 'Marital Homestead Growth Notes V',
    shortDescription: 'First-lien residential acquisition notes tailored for married couples entering long-term property ownership.',
    status: 'ACTIVE',
    annualReturnRate: 0.084,
    fundedAmount: 512000,
    targetAmount: 800000,
    minAmount: 2500,
    termMonths: 36,
    distributionType: 'MONTHLY',
  },
  {
    id: 'f3',
    slug: 'enduring-union-balanced-portfolio',
    title: 'Enduring Union Balanced Portfolio',
    shortDescription: 'Multi-asset liquidity fund providing capital preservation with balanced dividend yields.',
    status: 'ACTIVE',
    annualReturnRate: 0.069,
    fundedAmount: 195000,
    targetAmount: 300000,
    minAmount: 500,
    termMonths: 12,
    distributionType: 'ANNUAL',
  },
]

export default async function HomePage() {
  let opportunities: any[] = []
  try {
    opportunities = await prisma.investmentOpportunity.findMany({
      where: {
        status: { not: 'DRAFT' },
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    // Database offline or build-time prerendering
  }

  if (!opportunities || opportunities.length === 0) {
    opportunities = FALLBACK_OPPORTUNITIES
  }

  return (
    <div className="bg-white min-h-screen">
      {/* ── HERO SECTION ── */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-24 bg-white relative overflow-hidden">
        {/* Subtle decorative radial background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-[#0F1C3F]/[0.02] to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#0F1C3F] tracking-tight leading-[1.15] mb-6">
            Invest in Your Shared Future
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Secure your financial future together with USD-denominated investments tailored for couples and marriage.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-[#0F1C3F] bg-[#C9A84C] rounded-xl hover:bg-[#d4b460] active:scale-95 transition-all shadow-md shadow-[#C9A84C]/25"
            >
              Start Investing
            </Link>
            <Link
              href="/investments"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-[#0F1C3F] bg-white border border-[#0F1C3F] rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
            >
              Explore Opportunities
            </Link>
          </div>

          {/* Regulatory Disclosure Banner */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700 max-w-xl text-left">
            <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span>
              <strong>Regulatory Disclosure:</strong> Capital at risk. All investments carry risk including potential loss. Offer documents disclose full terms.
            </span>
          </div>
        </div>
      </section>

      {/* ── METRICS BAR ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="flex flex-col items-center justify-center pt-4 md:pt-0">
              <span className="text-3xl sm:text-4xl font-bold text-[#0F1C3F] tracking-tight mb-1">
                $2.4M+
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-500">
                Total Capital Funded
              </span>
            </div>

            <div className="flex flex-col items-center justify-center pt-4 md:pt-0">
              <span className="text-3xl sm:text-4xl font-bold text-[#0F1C3F] tracking-tight mb-1">
                500+
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-500">
                Couple Investors
              </span>
            </div>

            <div className="col-span-2 md:col-span-1 flex flex-col items-center justify-center pt-4 md:pt-0">
              <span className="text-3xl sm:text-4xl font-bold text-[#0F1C3F] tracking-tight mb-1">
                94%
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-500">
                On-Time Distributions
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── INVESTMENT OPPORTUNITIES PREVIEW ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider block mb-1">
              Curated Offerings
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F1C3F]">
              Current Investment Opportunities
            </h2>
          </div>
          <Link
            href="/investments"
            className="text-sm font-semibold text-[#C9A84C] hover:text-[#b08b3a] flex items-center gap-1.5"
          >
            View all opportunities <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opp) => {
            const funded = Number(opp.fundedAmount)
            const target = Number(opp.targetAmount)
            const pct = Math.min(100, Math.round((funded / target) * 100))
            const returnPct = (Number(opp.annualReturnRate) * 100).toFixed(1)

            return (
              <div
                key={opp.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-bold text-[#0F1C3F] leading-snug">
                      {opp.title}
                    </h3>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#C9A84C]/15 text-[#C9A84C] whitespace-nowrap">
                      {opp.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                    {opp.shortDescription}
                  </p>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-[#0F1C3F]">
                      {returnPct}%
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      Projected Return (p.a.)
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 mb-5">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Funding Progress</span>
                      <span className="font-semibold text-gray-900">{pct}% funded</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[#C9A84C] h-2.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 pb-5 border-b border-gray-100 mb-5">
                    <div>
                      <span className="text-gray-400 block">Min. Entry</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(Number(opp.minAmount))}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Tenure</span>
                      <span className="font-semibold text-gray-900">
                        {opp.termMonths} Months
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Distributions</span>
                      <span className="font-semibold text-gray-900 capitalize">
                        {opp.distributionType.toLowerCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Target Size</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(target)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/investments/${opp.slug}`}
                    className="flex-1 py-2.5 text-center text-xs font-semibold text-gray-700 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Fund Details
                  </Link>
                  <Link
                    href={`/register?redirect=/investments/${opp.slug}`}
                    className="flex-1 py-2.5 text-center text-xs font-bold text-[#0F1C3F] bg-[#C9A84C] hover:bg-[#d4b460] rounded-xl transition-colors shadow-sm"
                  >
                    Invest Now
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-gray-50 py-20 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider block mb-2">
              Step-by-Step Pathway
            </span>
            <h2 className="text-3xl font-bold text-[#0F1C3F] mb-4">
              How the Investment Process Works
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Designed specifically for joint couple accounts, our four-step onboarding provides complete regulatory transparency and security.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Register Joint Account',
                description:
                  'Create your couple investor account in minutes with dual partner email & mobile verification.',
              },
              {
                step: '02',
                title: 'Review Offer Documents',
                description:
                  'Access official offer documents, contractual terms, risk factors, and fee schedules.',
              },
              {
                step: '03',
                title: 'Fund USD Investment',
                description:
                  'Commit capital via secure USD bank transfer or payment checkout with verified settlement references.',
              },
              {
                step: '04',
                title: 'Earn & Track Portfolio',
                description:
                  'Receive contractual distributions into your linked account and access real-time ledger statements.',
              },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative group hover:border-[#C9A84C] transition-colors"
              >
                <span className="text-3xl font-bold text-gray-200 block mb-3 group-hover:text-[#C9A84C] transition-colors">
                  {s.step}
                </span>
                <h3 className="text-base font-bold text-[#0F1C3F] mb-2">
                  {s.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OFFICIAL OFFER DOCUMENTS ACCESS ── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0F1C3F] rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider block mb-2">
              Fiduciary Transparency
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Official Offer Documents & Disclosures
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed mb-6">
              In accordance with financial compliance standards, prospective investors have unhindered access to the official offer document for each fund before committing funds.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/documents"
                className="px-6 py-3 rounded-xl bg-[#C9A84C] text-[#0F1C3F] font-bold text-sm hover:bg-[#d4b460] transition-colors"
              >
                Explore Offer Document Library
              </Link>
              <Link
                href="/about"
                className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm border border-white/20 hover:bg-white/15 transition-colors"
              >
                About Company Governance
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ACCORDION ── */}
      <section className="bg-gray-50 py-20 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider block mb-2">
              Investor Clarity
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F1C3F] mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Clear answers regarding USD operations, distributions, eligibility, and legal protections.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'What currency does Union Invest operate in?',
                a: 'All platform transactions, investments, distributions, and financial ledger statements are strictly denominated and accounted in United States Dollars (USD $).',
              },
              {
                q: 'Are projected returns guaranteed?',
                a: 'No. Projected return rates (e.g., 8.5% p.a.) represent calculated asset yields and are not guaranteed outcomes. Full risk scenarios and stress-tests are detailed in each official offer document.',
              },
              {
                q: 'How are distributions paid to investor couples?',
                a: 'Distributions are credited directly to your verified investor cash ledger according to the fund schedule (monthly, quarterly, or at maturity), and can be withdrawn to your verified bank account.',
              },
              {
                q: 'What are the withdrawal and early exit terms?',
                a: 'Capital maturity dates are established contractually upon confirmation. Where permitted by fund terms, early withdrawal requests are processed through administrative review subject to applicable liquidity conditions and documented exit charges.',
              },
              {
                q: 'Who is eligible to open a joint account?',
                a: 'Married couples and civil partners who satisfy standard AML/KYC identity verification in approved operating jurisdictions are eligible to register and participate.',
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer text-sm font-semibold text-[#0F1C3F] hover:text-[#C9A84C] select-none list-none">
                  <span>{faq.q}</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">
                    ▾
                  </span>
                </summary>
                <div className="px-5 pb-5 text-xs text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/faq"
              className="text-xs font-semibold text-[#C9A84C] hover:underline"
            >
              View complete FAQ documentation →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0F1C3F] text-white pt-16 pb-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <span className="text-xl font-bold text-white tracking-tight">
                Union <span className="text-[#C9A84C]">Invest</span>
              </span>
              <p className="text-xs text-gray-400 leading-relaxed">
                Institutional-grade marriage investment platform facilitating transparent, USD-denominated wealth creation for couples.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#C9A84C] uppercase tracking-wider mb-4">
                Platform
              </h4>
              <ul className="space-y-2 text-xs text-gray-300">
                <li><Link href="/investments" className="hover:text-white">Investment Opportunities</Link></li>
                <li><Link href="/#how-it-works" className="hover:text-white">How It Works</Link></li>
                <li><Link href="/documents" className="hover:text-white">Official Offer Documents</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQs</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#C9A84C] uppercase tracking-wider mb-4">
                Governance
              </h4>
              <ul className="space-y-2 text-xs text-gray-300">
                <li><Link href="/about" className="hover:text-white">About the Company</Link></li>
                <li><Link href="/contact" className="hover:text-white">Customer Support Desk</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy & Data Notice</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#C9A84C] uppercase tracking-wider mb-4">
                Investor Access
              </h4>
              <div className="space-y-2.5">
                <Link
                  href="/login"
                  className="block w-full py-2 text-center text-xs font-semibold text-white border border-white/20 rounded-lg hover:bg-white/10"
                >
                  Investor Login
                </Link>
                <Link
                  href="/register"
                  className="block w-full py-2 text-center text-xs font-bold text-[#0F1C3F] bg-[#C9A84C] rounded-lg hover:bg-[#d4b460]"
                >
                  Create Joint Account
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-center text-[11px] text-gray-400 leading-relaxed">
            <p className="max-w-4xl mx-auto mb-2">
              <strong>Compliance Notice:</strong> All investment figures and transaction records are denominated in United States Dollars (USD $). Past performance or projected return rates are not guarantees of future outcomes. Read the relevant offer document prior to submitting funds.
            </p>
            <p>© {new Date().getFullYear()} Union Invest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
