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
export type ProgressBarColor = 'navy' | 'gold' | 'success' | 'warning' | 'danger' | 'info'
export type ProgressBarSize = 'xs' | 'sm' | 'md' | 'lg'

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Progress value 0–100 */
  value: number
  /** Label displayed above the bar */
  label?: string
  /** Show percentage text */
  showPercentage?: boolean
  /** Color variant */
  color?: ProgressBarColor
  /** Bar height */
  size?: ProgressBarSize
  /** Show animated shimmer on the fill */
  animated?: boolean
  /** Show a milestone marker (0-100) */
  milestone?: number
  /** Secondary value for a stacked/segmented bar (0-100) */
  secondaryValue?: number
}

// ---------------------------------------------------------------------------
// Color maps
// ---------------------------------------------------------------------------
const fillColors: Record<ProgressBarColor, React.CSSProperties> = {
  navy:    { backgroundColor: '#0F1C3F' },
  gold:    { backgroundColor: '#C9A84C' },
  success: { backgroundColor: '#16a34a' },
  warning: { backgroundColor: '#d97706' },
  danger:  { backgroundColor: '#dc2626' },
  info:    { backgroundColor: '#2563eb' },
}

const trackClasses: Record<ProgressBarColor, string> = {
  navy:    'bg-[#0F1C3F]/10',
  gold:    'bg-[#C9A84C]/15',
  success: 'bg-green-100',
  warning: 'bg-amber-100',
  danger:  'bg-red-100',
  info:    'bg-blue-100',
}

const sizeClasses: Record<ProgressBarSize, string> = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
}

// ---------------------------------------------------------------------------
// ProgressBar
// ---------------------------------------------------------------------------
function ProgressBar({
  value,
  label,
  showPercentage = false,
  color = 'navy',
  size = 'md',
  animated = false,
  milestone,
  secondaryValue,
  className,
  ...rest
}: ProgressBarProps) {
  // Clamp 0–100
  const clamped = Math.min(100, Math.max(0, value))
  const secondary = secondaryValue !== undefined
    ? Math.min(100 - clamped, Math.max(0, secondaryValue))
    : undefined

  const showMilestone =
    milestone !== undefined && milestone > 0 && milestone < 100

  return (
    <div className={cn('w-full', className)} {...rest}>
      {/* Label row */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-sm font-medium text-[#0F1C3F]">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-semibold tabular-nums" style={fillColors[color]}>
              {clamped.toFixed(0)}%
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        className={cn(
          'relative w-full rounded-full overflow-hidden',
          sizeClasses[size],
          trackClasses[color]
        )}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        {/* Primary fill */}
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            animated
              ? 'after:absolute after:inset-0 after:bg-white/20 after:animate-[shimmer_1.5s_infinite]'
              : ''
          )}
          style={{
            ...fillColors[color],
            width: `${clamped}%`,
          }}
        />

        {/* Secondary fill (stacked) */}
        {secondary !== undefined && secondary > 0 && (
          <div
            className="absolute top-0 h-full rounded-r-full"
            style={{
              left: `${clamped}%`,
              width: `${secondary}%`,
              backgroundColor: '#C9A84C',
              opacity: 0.5,
            }}
          />
        )}

        {/* Milestone marker */}
        {showMilestone && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/80"
            style={{ left: `${milestone}%` }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Milestone label */}
      {showMilestone && (
        <div className="relative mt-1" aria-hidden="true">
          <span
            className="absolute text-[10px] text-slate-400 -translate-x-1/2"
            style={{ left: `${milestone}%` }}
          >
            {milestone}%
          </span>
        </div>
      )}
    </div>
  )
}

export { ProgressBar, cn }
export default ProgressBar
