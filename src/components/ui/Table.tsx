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
export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode
  /** Wrap in a scrollable container */
  scroll?: boolean
  /** Show outer border */
  bordered?: boolean
}

export interface TableHeadProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode
}

export interface TableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode
}

export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode
  /** Manually mark a row as selected */
  selected?: boolean
}

export interface TableHeaderProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode
  /** Sort indicator */
  sorted?: 'asc' | 'desc' | false
  /** Make the column sticky */
  sticky?: boolean
}

export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode
  /** Numeric columns right-align */
  numeric?: boolean
  /** Make the column sticky */
  sticky?: boolean
}

export interface TableFooterProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode
}

// ---------------------------------------------------------------------------
// Sort icon
// ---------------------------------------------------------------------------
function SortIcon({ direction }: { direction: 'asc' | 'desc' | false }) {
  if (!direction) {
    return (
      <svg
        className="ml-1 h-3.5 w-3.5 text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
      </svg>
    )
  }
  return (
    <svg
      className="ml-1 h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      {direction === 'asc' ? (
        <path d="M7 9l5-5 5 5" />
      ) : (
        <path d="M7 15l5 5 5-5" />
      )}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------
function Table({
  children,
  scroll = true,
  bordered = false,
  className,
  ...rest
}: TableProps) {
  const table = (
    <table
      className={cn(
        'w-full text-sm text-left border-collapse',
        bordered ? 'border border-slate-200' : '',
        className
      )}
      {...rest}
    >
      {children}
    </table>
  )

  if (scroll) {
    return (
      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        {table}
      </div>
    )
  }
  return table
}

// ---------------------------------------------------------------------------
// TableHead
// ---------------------------------------------------------------------------
function TableHead({ children, className, ...rest }: TableHeadProps) {
  return (
    <thead
      className={cn('bg-slate-50 border-b border-slate-200', className)}
      {...rest}
    >
      {children}
    </thead>
  )
}

// ---------------------------------------------------------------------------
// TableBody
// ---------------------------------------------------------------------------
function TableBody({ children, className, ...rest }: TableBodyProps) {
  return (
    <tbody
      className={cn(
        'divide-y divide-slate-100',
        '[&>tr:nth-child(even)]:bg-slate-50/50',
        className
      )}
      {...rest}
    >
      {children}
    </tbody>
  )
}

// ---------------------------------------------------------------------------
// TableRow
// ---------------------------------------------------------------------------
function TableRow({ children, selected, className, ...rest }: TableRowProps) {
  return (
    <tr
      className={cn(
        'transition-colors duration-100',
        'hover:bg-[#0F1C3F]/[0.03]',
        selected ? 'bg-[#C9A84C]/10 ring-1 ring-inset ring-[#C9A84C]/30' : '',
        className
      )}
      aria-selected={selected}
      {...rest}
    >
      {children}
    </tr>
  )
}

// ---------------------------------------------------------------------------
// TableHeader (th)
// ---------------------------------------------------------------------------
function TableHeader({
  children,
  sorted,
  sticky = false,
  className,
  ...rest
}: TableHeaderProps) {
  const hasSortProp = sorted !== undefined

  return (
    <th
      scope="col"
      className={cn(
        'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500',
        'whitespace-nowrap select-none',
        hasSortProp ? 'cursor-pointer hover:text-[#0F1C3F]' : '',
        sticky ? 'sticky left-0 z-10 bg-slate-50' : '',
        className
      )}
      aria-sort={
        sorted === 'asc'
          ? 'ascending'
          : sorted === 'desc'
          ? 'descending'
          : undefined
      }
      {...rest}
    >
      <span className="inline-flex items-center">
        {children}
        {hasSortProp && <SortIcon direction={sorted as 'asc' | 'desc' | false} />}
      </span>
    </th>
  )
}

// ---------------------------------------------------------------------------
// TableCell (td)
// ---------------------------------------------------------------------------
function TableCell({
  children,
  numeric = false,
  sticky = false,
  className,
  ...rest
}: TableCellProps) {
  return (
    <td
      className={cn(
        'px-4 py-3 text-slate-700 whitespace-nowrap',
        numeric ? 'text-right font-mono tabular-nums' : '',
        sticky ? 'sticky left-0 z-10 bg-inherit' : '',
        className
      )}
      {...rest}
    >
      {children}
    </td>
  )
}

// ---------------------------------------------------------------------------
// TableFooter
// ---------------------------------------------------------------------------
function TableFooter({ children, className, ...rest }: TableFooterProps) {
  return (
    <tfoot
      className={cn(
        'border-t-2 border-slate-200 bg-slate-50 font-semibold text-[#0F1C3F]',
        className
      )}
      {...rest}
    >
      {children}
    </tfoot>
  )
}

export {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  TableFooter,
  cn,
}
export default Table
