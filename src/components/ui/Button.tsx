'use client'

import React, { forwardRef } from 'react'

// ---------------------------------------------------------------------------
// Utility: cn() - lightweight class-name merger (no external dep needed)
// ---------------------------------------------------------------------------
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  /** Render the button's inner markup but forward props to a child element */
  asChild?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children?: React.ReactNode
}

// ---------------------------------------------------------------------------
// Variant & size maps
// ---------------------------------------------------------------------------
const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'text-white font-semibold shadow-sm',
    'hover:opacity-90 active:scale-[0.98]',
    'focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),

  secondary: [
    'bg-white text-[#0F1C3F] font-semibold border border-[#0F1C3F]',
    'hover:bg-[#0F1C3F] hover:text-white active:scale-[0.98]',
    'focus-visible:ring-2 focus-visible:ring-[#0F1C3F] focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),

  outline: [
    'bg-transparent text-[#0F1C3F] font-semibold border border-[#0F1C3F]',
    'hover:bg-[#0F1C3F]/5 active:scale-[0.98]',
    'focus-visible:ring-2 focus-visible:ring-[#0F1C3F] focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),

  ghost: [
    'bg-transparent text-[#0F1C3F] font-semibold',
    'hover:bg-[#0F1C3F]/8 active:scale-[0.98]',
    'focus-visible:ring-2 focus-visible:ring-[#0F1C3F] focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),

  danger: [
    'bg-red-600 text-white font-semibold shadow-sm',
    'hover:bg-red-700 active:scale-[0.98]',
    'focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm rounded-md gap-1.5',
  md: 'h-10 px-4 text-sm rounded-lg gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2.5',
}

const primaryBg = '#0F1C3F'

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------
function Spinner({ size }: { size: ButtonSize }) {
  const dim = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
  return (
    <svg
      className={cn(dim, 'animate-spin')}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      asChild = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      style,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    const baseClasses = cn(
      'inline-flex items-center justify-center',
      'transition-all duration-150 ease-in-out',
      'select-none outline-none',
      sizeClasses[size],
      variantClasses[variant],
      fullWidth ? 'w-full' : '',
      className
    )

    const inlineStyle: React.CSSProperties =
      variant === 'primary'
        ? { backgroundColor: primaryBg, ...style }
        : variant === 'ghost'
        ? { ...style }
        : { ...style }

    const content = (
      <>
        {loading && <Spinner size={size} />}
        {!loading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children && <span>{children}</span>}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </>
    )

    if (asChild && React.isValidElement(children)) {
      // Forward props to single child element (slot pattern)
      return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
        className: cn(baseClasses, (children as React.ReactElement<React.HTMLAttributes<HTMLElement>>).props.className),
        style: inlineStyle,
        ...(isDisabled ? { 'aria-disabled': true } : {}),
      })
    }

    return (
      <button
        ref={ref}
        className={baseClasses}
        disabled={isDisabled}
        style={inlineStyle}
        aria-busy={loading}
        {...rest}
      >
        {content}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, cn }
export default Button
