import React from 'react'

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type StatFormat = 'currency' | 'number' | 'percent' | 'raw'

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: number | string
  /** How to format the numeric value */
  format?: StatFormat
  /** Currency code when format is 'currency' */
  currency?: string
  /** Locale for number formatting */
  locale?: string
  /** Positive number = increase, negative = decrease */
  change?: number
  /** Label for the change period, e.g. "vs last month" */
  changePeriod?: string
  /** Icon rendered in the top-right corner */
  icon?: React.ReactNode
  /** Loading skeleton state */
  loading?: boolean
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------
function formatValue(
  value: number | string,
  format: StatFormat,
  currency: string,
  locale: string
): string {
  if (typeof value === 'string') return value

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value)

    case 'number':
      return new Intl.NumberFormat(locale, {
        notation: Math.abs(value) >= 1_000_000 ? 'compact' : 'standard',
        maximumFractionDigits: 1,
      }).format(value)

    case 'percent':
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      }).format(value / 100)

    case 'raw':
    default:
      return String(value)
  }
}

// ---------------------------------------------------------------------------
// Arrow icons
// ---------------------------------------------------------------------------
function ArrowUp({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-3.5 w-3.5 shrink-0', className)}
      aria-hidden="true"
    >
      <path d="M18 15l-6-6-6 6" />
    </svg>
  )
}

function ArrowDown({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-3.5 w-3.5 shrink-0', className)}
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Stat
// ---------------------------------------------------------------------------
function Stat({
  label,
  value,
  format = 'number',
  currency = 'USD',
  locale = 'en-US',
  change,
  changePeriod,
  icon,
  loading = false,
  className,
  ...rest
}: StatProps) {
  const formattedValue = loading
    ? '—'
    : formatValue(value, format, currency, locale)

  const hasChange = change !== undefined && change !== null
  const isPositive = hasChange && change! > 0
  const isNegative = hasChange && change! < 0
  const changeAbs = hasChange ? Math.abs(change!) : 0

  return (
    <div
      className={cn(
        'relative bg-white rounded-xl border border-slate-200 shadow-sm',
        'px-5 py-4 flex flex-col gap-3',
        className
      )}
      {...rest}
    >
      {/* Top row: label + icon */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-500 truncate">{label}</p>
        {icon && (
          <div
            className="shrink-0 flex items-center justify-center h-9 w-9 rounded-lg text-white"
            style={{ backgroundColor: '#0F1C3F' }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div className="h-8 w-32 rounded-md bg-slate-200 animate-pulse" />
      ) : (
        <p
          className="text-2xl font-bold tracking-tight text-[#0F1C3F] leading-none"
          aria-label={`${label}: ${formattedValue}`}
        >
          {formattedValue}
        </p>
      )}

      {/* Change badge */}
      {hasChange && !loading && (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-semibold rounded-full px-2 py-0.5',
              isPositive
                ? 'bg-green-50 text-green-700'
                : isNegative
                ? 'bg-red-50 text-red-700'
                : 'bg-slate-100 text-slate-500'
            )}
          >
            {isPositive && <ArrowUp />}
            {isNegative && <ArrowDown />}
            {changeAbs.toFixed(1)}%
          </span>

          {changePeriod && (
            <span className="text-xs text-slate-400">{changePeriod}</span>
          )}
        </div>
      )}

      {/* Loading change placeholder */}
      {loading && (
        <div className="h-5 w-24 rounded-full bg-slate-200 animate-pulse" />
      )}
    </div>
  )
}

export { Stat, cn }
export default Stat
