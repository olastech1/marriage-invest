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
export type CardVariant = 'default' | 'elevated' | 'highlighted'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  /** Render a title directly in the Card (shorthand for CardHeader) */
  title?: string
  /** Render a description below the title (shorthand for CardHeader) */
  description?: string
  /** Optional footer content (shorthand for CardFooter) */
  footer?: React.ReactNode
  children?: React.ReactNode
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  action?: React.ReactNode
  children?: React.ReactNode
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  /** Remove default padding */
  noPadding?: boolean
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  /** Align footer content */
  align?: 'left' | 'center' | 'right' | 'between'
}

// ---------------------------------------------------------------------------
// Variant styles
// ---------------------------------------------------------------------------
const variantClasses: Record<CardVariant, string> = {
  default:
    'bg-white border border-slate-200 shadow-sm',
  elevated:
    'bg-white border border-slate-200 shadow-lg',
  highlighted:
    'bg-white border border-slate-200 shadow-sm border-l-4',
}

const highlightedStyle: React.CSSProperties = {
  borderLeftColor: '#C9A84C',
}

// ---------------------------------------------------------------------------
// Card (composite)
// ---------------------------------------------------------------------------
function Card({
  variant = 'default',
  title,
  description,
  footer,
  children,
  className,
  style,
  ...rest
}: CardProps) {
  const combinedStyle =
    variant === 'highlighted'
      ? { ...highlightedStyle, ...style }
      : style

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden',
        variantClasses[variant],
        className
      )}
      style={combinedStyle}
      {...rest}
    >
      {/* Shorthand header */}
      {(title || description) && (
        <CardHeader title={title} description={description} />
      )}

      {/* Main slot */}
      {children}

      {/* Shorthand footer */}
      {footer && <CardFooter>{footer}</CardFooter>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CardHeader
// ---------------------------------------------------------------------------
function CardHeader({
  title,
  description,
  action,
  children,
  className,
  ...rest
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4',
        className
      )}
      {...rest}
    >
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-base font-semibold text-[#0F1C3F] leading-snug">
            {title}
          </h3>
        )}
        {description && (
          <p className="mt-0.5 text-sm text-slate-500 leading-relaxed">
            {description}
          </p>
        )}
        {children}
      </div>

      {action && (
        <div className="shrink-0 flex items-center gap-2">{action}</div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CardContent
// ---------------------------------------------------------------------------
function CardContent({
  children,
  noPadding = false,
  className,
  ...rest
}: CardContentProps) {
  return (
    <div
      className={cn(noPadding ? '' : 'px-6 py-5', className)}
      {...rest}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CardFooter
// ---------------------------------------------------------------------------
function CardFooter({
  children,
  align = 'right',
  className,
  ...rest
}: CardFooterProps) {
  const alignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  }[align]

  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-slate-100 flex flex-wrap items-center gap-3',
        alignClass,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

export { Card, CardHeader, CardContent, CardFooter, cn }
export default Card
