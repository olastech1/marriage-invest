/**
 * Investment Opportunities listing page — Server Component
 *
 * Route: /investments
 *
 * Fetches all active (and non-draft) investment opportunities from the DB,
 * then renders them in a responsive 2-column card grid with:
 *  - Prominent risk disclaimer banner
 *  - Filter tabs (All / Active / Closed)
 *  - InvestmentCard grid
 *  - Legal footer text
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import InvestmentCard, { type InvestmentOpportunityCard } from '@/components/public/InvestmentCard'
import type { Metadata } from 'next'
import type { OpportunityStatus } from '@prisma/client'

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Investment Opportunities | Union Verify',
  description:
    'Browse the investment opportunities currently listed on Union Verify. Projected returns are not guaranteed.',
}

// ---------------------------------------------------------------------------
// Page-level revalidation (ISR): revalidate every 5 minutes
// ---------------------------------------------------------------------------
export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getOpportunities(
  statusFilter?: OpportunityStatus,
): Promise<InvestmentOpportunityCard[]> {
  try {
    const where =
      statusFilter
        ? { status: statusFilter }
        : { status: { not: 'DRAFT' as OpportunityStatus } }

    const rows = await prisma.investmentOpportunity.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        minAmount: true,
        maxAmount: true,
        targetAmount: true,
        fundedAmount: true,
        termMonths: true,
        annualReturnRate: true,
        distributionType: true,
        status: true,
        openDate: true,
        closeDate: true,
        riskLevel: true,
      },
    })

    // Serialise Decimal → string so the client-safe boundary is crossed cleanly
    return rows.map((r) => ({
      ...r,
      minAmount: r.minAmount.toString(),
      maxAmount: r.maxAmount?.toString() ?? null,
      targetAmount: r.targetAmount.toString(),
      fundedAmount: r.fundedAmount.toString(),
      annualReturnRate: r.annualReturnRate.toString(),
      openDate: r.openDate?.toISOString() ?? null,
      closeDate: r.closeDate?.toISOString() ?? null,
    }))
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Filter tabs definition
// ---------------------------------------------------------------------------

interface FilterTab {
  label: string
  value: OpportunityStatus | 'ALL'
  href: string
}

const TABS: FilterTab[] = [
  { label: 'All', value: 'ALL', href: '/investments' },
  { label: 'Active', value: 'ACTIVE', href: '/investments?status=ACTIVE' },
  { label: 'Closed', value: 'CLOSED', href: '/investments?status=CLOSED' },
]

// ---------------------------------------------------------------------------
// Server helpers
// ---------------------------------------------------------------------------

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

// ---------------------------------------------------------------------------
// Sub-components (pure, server-renderable)
// ---------------------------------------------------------------------------

function DisclaimerBanner() {
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <svg
        className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
      <p>
        <strong>Important:</strong> Projected returns are not guaranteed. All investments carry risk,
        including the potential loss of principal. Past performance does not predict future results.
        Please read the full offer document and consult a qualified financial advisor before investing.
      </p>
    </div>
  )
}

function FilterTabs({
  currentStatus,
}: {
  currentStatus: OpportunityStatus | 'ALL'
}) {
  return (
    <div
      className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1"
      role="tablist"
      aria-label="Filter opportunities by status"
    >
      {TABS.map((tab) => {
        const active = tab.value === currentStatus
        return (
          <Link
            key={tab.value}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150',
              active
                ? 'bg-white text-[#0F1C3F] shadow-sm'
                : 'text-gray-500 hover:text-[#0F1C3F]',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
          />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-gray-700">No open investments right now</p>
        <p className="mt-1 text-sm text-gray-500">
          There are no opportunities listed in this category at the moment.
        </p>
      </div>
      <Link
        href="/investments"
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#0F1C3F] px-4 py-2 text-sm font-semibold text-[#0F1C3F] hover:bg-[#0F1C3F] hover:text-white transition-colors"
      >
        View all opportunities
      </Link>
    </div>
  )
}

function LegalFooter() {
  return (
    <section
      aria-label="Legal disclaimer"
      className="mt-16 rounded-2xl bg-gray-50 border border-gray-200 p-6 text-xs text-gray-500 leading-relaxed space-y-3"
    >
      <h2 className="text-sm font-semibold text-gray-700">Investment Risk Disclosure</h2>
      <p>
        All investments made through the Union Verify platform are subject to investment risk,
        including the possible loss of the principal amount invested. The projected annual return
        rates displayed on this page are estimates. They are <strong>not guaranteed</strong>.
      </p>
      <p>
        Union Verify is not a registered broker-dealer, investment adviser, or financial planner.
        Nothing on this website constitutes an offer to sell, a solicitation of an offer to buy,
        or a recommendation of any security or any other product or service.
      </p>
      <p>
        Before investing, you should carefully consider the investment objectives, risks, charges,
        and expenses of each opportunity. This information is contained in the applicable offer
        documents, which you should read carefully before investing.
      </p>
      <p>
        Union Verify does not provide legal, tax, or investment advice. You should consult with a
        licensed professional for advice concerning your specific situation.
      </p>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function InvestmentsPage({ searchParams }: PageProps) {
  const { status: rawStatus } = await searchParams

  // Drafts are never shown publicly
  const validStatuses: OpportunityStatus[] = ['ACTIVE', 'FUNDED', 'CLOSED', 'CANCELLED']
  const statusFilter =
    rawStatus && validStatuses.includes(rawStatus as OpportunityStatus)
      ? (rawStatus as OpportunityStatus)
      : undefined

  const currentTab: OpportunityStatus | 'ALL' = statusFilter ?? 'ALL'

  const opportunities = await getOpportunities(statusFilter)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ------------------------------------------------------------------ */}
      {/* Page header */}
      {/* ------------------------------------------------------------------ */}
      <header className="bg-[#0F1C3F]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#C9A84C]">
              Union Verify Platform
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Investment Opportunities
            </h1>
            <p className="mt-4 text-base text-blue-200 leading-relaxed">
              The investment opportunities currently listed on Union Verify. Read each
              opportunity&apos;s details and risks before investing.
            </p>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Main content */}
      {/* ------------------------------------------------------------------ */}
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={null}>
          {/* Disclaimer */}
          <DisclaimerBanner />

          {/* Controls: filter tabs + result count */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <FilterTabs currentStatus={currentTab} />
            <p className="text-sm text-gray-500">
              {opportunities.length}{' '}
              {opportunities.length === 1 ? 'opportunity' : 'opportunities'} found
            </p>
          </div>

          {/* Grid */}
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {opportunities.length === 0 ? (
              <EmptyState />
            ) : (
              opportunities.map((opp) => (
                <InvestmentCard key={opp.id} opportunity={opp} />
              ))
            )}
          </div>

          {/* Register CTA */}
          {opportunities.length > 0 && (
            <div className="mt-10 rounded-2xl bg-[#0F1C3F] p-8 text-center text-white">
              <h2 className="text-xl font-bold">Ready to invest?</h2>
              <p className="mt-2 text-blue-200 text-sm">
                Create an account to see full opportunity details, submit investments,
                and track your portfolio.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#C9A84C] px-6 py-3 text-sm font-bold text-[#0F1C3F] hover:bg-[#d9b95c] transition-colors"
                >
                  Create Investor Account
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </Suspense>

        {/* Legal footer */}
        <LegalFooter />
      </main>
    </div>
  )
}
