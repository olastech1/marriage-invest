/**
 * General-purpose utility functions for the Marriage Investment platform.
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ---------------------------------------------------------------------------
// Tailwind / className helpers
// ---------------------------------------------------------------------------

/**
 * Merge Tailwind CSS class names, resolving conflicts correctly.
 * Accepts any value accepted by `clsx`.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ---------------------------------------------------------------------------
// Currency formatting
// ---------------------------------------------------------------------------

type Decimal = { toNumber(): number } // compatible with Prisma Decimal

/**
 * Format a numeric amount as a USD currency string.
 *
 * @example
 * formatCurrency(1234.5)          // "$1,234.50"
 * formatCurrency('5000', { symbol: false }) // "5,000.00"
 */
export function formatCurrency(
  amount: number | string | Decimal,
  opts: {
    /** Include the dollar sign. Defaults to `true`. */
    symbol?: boolean
    /** Number of decimal places. Defaults to `2`. */
    decimals?: number
    /** Locale string passed to `Intl.NumberFormat`. Defaults to `'en-US'`. */
    locale?: string
  } = {},
): string {
  const { symbol = true, decimals = 2, locale = 'en-US' } = opts

  const numeric =
    typeof amount === 'object' && 'toNumber' in amount
      ? amount.toNumber()
      : Number(amount)

  if (isNaN(numeric)) return symbol ? '$0.00' : '0.00'

  return new Intl.NumberFormat(locale, {
    style: symbol ? 'currency' : 'decimal',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numeric)
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

type DateFormat = 'short' | 'long' | 'datetime'

/**
 * Format a `Date` object or ISO string into a human-readable string.
 *
 * - `'short'`    → "Jan 1, 2024"
 * - `'long'`     → "January 1, 2024"
 * - `'datetime'` → "Jan 1, 2024, 12:00 PM"
 */
export function formatDate(
  date: Date | string,
  format: DateFormat = 'short',
  locale = 'en-US',
): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return 'Invalid date'

  const optionMap: Record<DateFormat, Intl.DateTimeFormatOptions> = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    datetime: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
  }

  return new Intl.DateTimeFormat(locale, optionMap[format]).format(d)
}

// ---------------------------------------------------------------------------
// Reference generation
// ---------------------------------------------------------------------------

/**
 * Generate a unique investment reference string.
 *
 * Format: `MI-<YEAR>-<6 uppercase alphanumeric chars>`
 * @example "MI-2024-A3K9PQ"
 */
export function generateReference(): string {
  const year = new Date().getFullYear()
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const suffix = Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('')
  return `MI-${year}-${suffix}`
}

// ---------------------------------------------------------------------------
// String utilities
// ---------------------------------------------------------------------------

/**
 * Truncate a string to `maxLength` characters, appending an ellipsis if cut.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength - 1)}…`
}

/**
 * Convert arbitrary text into a URL-safe slug.
 * @example slugify("Hello World!") → "hello-world"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFKD')                        // decompose accented characters
    .replace(/[\u0300-\u036f]/g, '')          // strip combining diacritical marks
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')            // remove non-alphanumeric chars
    .replace(/\s+/g, '-')                     // spaces → hyphens
    .replace(/-{2,}/g, '-')                   // collapse consecutive hyphens
}

// ---------------------------------------------------------------------------
// Date arithmetic
// ---------------------------------------------------------------------------

/**
 * Add `termMonths` calendar months to `startDate` and return the resulting date.
 * The day-of-month is preserved where possible (e.g. Jan 31 + 1 month → Feb 28/29).
 */
export function calculateMaturityDate(
  startDate: Date,
  termMonths: number,
): Date {
  const result = new Date(startDate)
  result.setMonth(result.getMonth() + termMonths)
  return result
}

// ---------------------------------------------------------------------------
// Role / permission helpers
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the given role is the platform administrator role.
 */
export function isAdmin(role: string): boolean {
  return role === 'ADMIN'
}

/**
 * Returns `true` if the given role has finance-level access
 * (i.e. ADMIN or FINANCE).
 */
export function hasFinanceAccess(role: string): boolean {
  return role === 'ADMIN' || role === 'FINANCE'
}

/** Escape user-supplied text before putting it into HTML (e.g. emails). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Investment opportunity rates are stored as a fraction (0.068 = 6.8% a year).
 * Formats one for display, e.g. "6.8%".
 */
export function formatAnnualRate(rate: number | string | { toString(): string }): string {
  const value = Number(rate)
  if (!Number.isFinite(value)) return '—'
  return `${(value * 100).toFixed(2).replace(/\.?0+$/, '')}%`
}
