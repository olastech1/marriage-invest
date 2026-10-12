/**
 * InvestmentCard — Server Component
 *
 * Displays a single investment opportunity in a card format for use in the
 * opportunities listing grid. Includes:
 *  - Risk-level colour gradient top bar
 *  - Title + truncated description
 *  - Key metrics (term, min investment, projected annual rate)
 *  - Funding progress bar
 *  - Status & risk-level badges
 *  - "View & Invest" CTA
 */

import Link from 'next/link'
import type { InvestmentOpportunity, RiskLevel, OpportunityStatus, DistributionType } from '@prisma/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Serialised opportunity (Decimal fields stringified by JSON round-trip). */
export interface InvestmentOpportunityCard {
  id: string
  title: string
  slug: string
  shortDescription: string
  minAmount: string        // Decimal serialised as string
  maxAmount: string | null
  targetAmount: string
  fundedAmount: string
  termMonths: number
  annualReturnRate: string // Decimal serialised as string
  distributionType: DistributionType
  status: OpportunityStatus
  openDate: string | null
  closeDate: string | null
  riskLevel: RiskLevel
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

function fmtCurrency(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtPercent(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return `${n.toFixed(2)}%`
}

function fundingPercent(funded: string, target: string): number {
  const f = parseFloat(funded)
  const t = parseFloat(target)
  if (t === 0) return 0
  return Math.min(100, Math.round((f / t) * 100))
}

// ---------------------------------------------------------------------------
// Risk-level config
// ---------------------------------------------------------------------------

const riskConfig: Record<
  RiskLevel,
  { gradient: string; badgeBg: string; badgeText: string; label: string }
> = {
  LOW: {
    gradient: 'from-emerald-500 to-teal-400',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    label: 'Low Risk',
  },
  MEDIUM: {
    gradient: 'from-amber-400 to-orange-400',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    label: 'Medium Risk',
  },
  HIGH: {
    gradient: 'from-rose-500 to-pink-500',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    label: 'High Risk',
  },
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const statusConfig: Record<
  OpportunityStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  DRAFT: {
    label: 'Draft',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  },
  ACTIVE: {
    label: 'Open',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  FUNDED: {
    label: 'Fully Funded',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  CLOSED: {
    label: 'Closed',
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    dot: 'bg-gray-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-red-50',
    text: 'text-red-600',
    dot: 'bg-red-400',
  },
}

// ---------------------------------------------------------------------------
// Metric cell
// ---------------------------------------------------------------------------

function MetricCell({
  label,
  value,
  sublabel,
  highlight,
}: {
  label: string
  value: string
  sublabel?: string
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500 leading-none">{label}</span>
      <span
        className={cn(
          'text-sm font-bold leading-none',
          highlight ? 'text-[#C9A84C]' : 'text-[#0F1C3F]',
        )}
      >
        {value}
      </span>
      {sublabel && (
        <span className="text-[10px] text-gray-400 leading-none">{sublabel}</span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface InvestmentCardProps {
  opportunity: InvestmentOpportunityCard
}

export default function InvestmentCard({ opportunity }: InvestmentCardProps) {
  const risk = riskConfig[opportunity.riskLevel]
  const status = statusConfig[opportunity.status]
  const progress = fundingPercent(opportunity.fundedAmount, opportunity.targetAmount)
  const isClosed =
    opportunity.status === 'CLOSED' ||
    opportunity.status === 'CANCELLED' ||
    opportunity.status === 'FUNDED'

  return (
    <article className="group flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Risk gradient top bar */}
      <div className={cn('h-1.5 w-full bg-gradient-to-r', risk.gradient)} aria-hidden="true" />

      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* Header row: title + status badge */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold text-[#0F1C3F] leading-snug line-clamp-2 flex-1">
            {opportunity.title}
          </h3>
          {/* Status badge */}
          <span
            className={cn(
              'inline-flex items-center gap-1.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold',
              status.bg,
              status.text,
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} aria-hidden="true" />
            {status.label}
          </span>
        </div>

        {/* Short description */}
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 flex-1">
          {opportunity.shortDescription}
        </p>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-3">
          <MetricCell
            label="Term"
            value={`${opportunity.termMonths} mo`}
          />
          <MetricCell
            label="Min. Investment"
            value={fmtCurrency(opportunity.minAmount)}
          />
          <MetricCell
            label="Proj. Annual Rate"
            value={fmtPercent(opportunity.annualReturnRate)}
            sublabel="Projected"
            highlight
          />
        </div>

        {/* Funding progress */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Funding progress</span>
            <span className="font-semibold text-[#0F1C3F]">{progress}%</span>
          </div>
          <div
            className="h-2 w-full rounded-full bg-gray-200 overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progress}% funded`}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isClosed
                  ? 'bg-gray-400'
                  : 'bg-gradient-to-r from-[#C9A84C] to-[#e8c76a]',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{fmtCurrency(opportunity.fundedAmount)} raised</span>
            <span>of {fmtCurrency(opportunity.targetAmount)}</span>
          </div>
        </div>

        {/* Footer: risk badge + CTA */}
        <div className="flex items-center justify-between pt-1 gap-3 mt-auto">
          {/* Risk level badge */}
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
              risk.badgeBg,
              risk.badgeText,
            )}
          >
            {risk.label}
          </span>

          {/* CTA */}
          <Link
            href={`/investments/${opportunity.slug}`}
            className={cn(
              'inline-flex items-center justify-center gap-1.5',
              'rounded-lg px-4 py-2 text-sm font-semibold',
              'transition-all duration-150',
              isClosed
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                : 'bg-[#0F1C3F] text-white hover:bg-[#1a2d5a] active:scale-[0.97]',
            )}
            aria-label={`View details for ${opportunity.title}`}
            tabIndex={isClosed ? -1 : undefined}
          >
            {isClosed ? 'View Details' : 'View & Invest'}
            {!isClosed && (
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            )}
          </Link>
        </div>
      </div>
    </article>
  )
}
