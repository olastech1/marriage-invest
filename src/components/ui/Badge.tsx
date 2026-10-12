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
export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'gold'

export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  /** Render a small status dot before the label */
  dot?: boolean
  children: React.ReactNode
}

// ---------------------------------------------------------------------------
// Variant styles
// ---------------------------------------------------------------------------
const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-50 text-green-700 ring-1 ring-green-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-500/25',
  danger:  'bg-red-50  text-red-700  ring-1 ring-red-600/20',
  info:    'bg-blue-50 text-blue-700 ring-1 ring-blue-700/20',
  neutral: 'bg-slate-100 text-slate-600 ring-1 ring-slate-500/20',
  gold:    'text-amber-900 ring-1 ring-[#C9A84C]/40',
}

const goldBg: React.CSSProperties = { backgroundColor: '#C9A84C22' }

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  info:    'bg-blue-500',
  neutral: 'bg-slate-400',
  gold:    '',
}

const goldDotStyle: React.CSSProperties = { backgroundColor: '#C9A84C' }

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs rounded-full',
  md: 'px-2.5 py-1 text-xs rounded-full',
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------
function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  className,
  style,
  ...rest
}: BadgeProps) {
  const isGold = variant === 'gold'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      style={isGold ? { ...goldBg, ...style } : style}
      {...rest}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full shrink-0',
            isGold ? '' : dotColors[variant]
          )}
          style={isGold ? goldDotStyle : undefined}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}

export { Badge, cn }
export default Badge
