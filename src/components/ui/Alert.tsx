'use client'

import React, { useState } from 'react'

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type AlertVariant = 'info' | 'success' | 'warning' | 'error'

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: AlertVariant
  title?: string
  message?: React.ReactNode
  /** Show a close (dismiss) button */
  closable?: boolean
  /** Called when the user dismisses the alert */
  onClose?: () => void
  /** Provide a custom icon to override the default */
  icon?: React.ReactNode
  /** Hide the left icon entirely */
  noIcon?: boolean
}

// ---------------------------------------------------------------------------
// Variant config
// ---------------------------------------------------------------------------
interface VariantConfig {
  wrapper: string
  iconColor: string
  titleColor: string
  messageColor: string
  closeHover: string
}

const variantConfig: Record<AlertVariant, VariantConfig> = {
  info: {
    wrapper:      'bg-blue-50 border border-blue-200',
    iconColor:    'text-blue-500',
    titleColor:   'text-blue-800',
    messageColor: 'text-blue-700',
    closeHover:   'hover:bg-blue-100 text-blue-500',
  },
  success: {
    wrapper:      'bg-green-50 border border-green-200',
    iconColor:    'text-green-500',
    titleColor:   'text-green-800',
    messageColor: 'text-green-700',
    closeHover:   'hover:bg-green-100 text-green-500',
  },
  warning: {
    wrapper:      'bg-amber-50 border border-amber-200',
    iconColor:    'text-amber-500',
    titleColor:   'text-amber-800',
    messageColor: 'text-amber-700',
    closeHover:   'hover:bg-amber-100 text-amber-500',
  },
  error: {
    wrapper:      'bg-red-50 border border-red-200',
    iconColor:    'text-red-500',
    titleColor:   'text-red-800',
    messageColor: 'text-red-700',
    closeHover:   'hover:bg-red-100 text-red-500',
  },
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
function InfoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn('h-5 w-5', className)} aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 9a1 1 0 00-1 1v4a1 1 0 102 0v-4a1 1 0 00-1-1zm0-4a1.25 1.25 0 100 2.5A1.25 1.25 0 0012 7z"
      />
    </svg>
  )
}

function SuccessIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn('h-5 w-5', className)} aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M12 2a10 10 0 110 20A10 10 0 0112 2zm4.707 7.293a1 1 0 00-1.414 0L11 13.586l-2.293-2.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l5-5a1 1 0 000-1.414z"
      />
    </svg>
  )
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn('h-5 w-5', className)} aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1zm1.25 8a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z"
      />
    </svg>
  )
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn('h-5 w-5', className)} aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M12 2a10 10 0 110 20A10 10 0 0112 2zm-1 5a1 1 0 112 0v5a1 1 0 11-2 0V7zm1 9.25a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z"
      />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round"
      className={cn('h-4 w-4', className)} aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

const variantIcons: Record<AlertVariant, React.FC<{ className?: string }>> = {
  info:    InfoIcon,
  success: SuccessIcon,
  warning: WarningIcon,
  error:   ErrorIcon,
}

// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------
function Alert({
  variant = 'info',
  title,
  message,
  closable = false,
  onClose,
  icon,
  noIcon = false,
  className,
  children,
  ...rest
}: AlertProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const config = variantConfig[variant]
  const DefaultIcon = variantIcons[variant]

  function handleClose() {
    setDismissed(true)
    onClose?.()
  }

  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status'

  return (
    <div
      role={role}
      aria-live={role === 'alert' ? 'assertive' : 'polite'}
      className={cn(
        'flex gap-3 rounded-xl p-4',
        config.wrapper,
        className
      )}
      {...rest}
    >
      {/* Icon */}
      {!noIcon && (
        <div className={cn('shrink-0 mt-0.5', config.iconColor)}>
          {icon ?? <DefaultIcon />}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn('text-sm font-semibold leading-snug', config.titleColor)}>
            {title}
          </p>
        )}
        {(message || children) && (
          <div className={cn('text-sm mt-0.5 leading-relaxed', config.messageColor)}>
            {message ?? children}
          </div>
        )}
      </div>

      {/* Close button */}
      {closable && (
        <button
          type="button"
          onClick={handleClose}
          className={cn(
            'shrink-0 -mt-0.5 -mr-1 rounded-md p-1 transition-colors duration-150',
            config.closeHover,
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current'
          )}
          aria-label="Dismiss alert"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  )
}

export { Alert, cn }
export default Alert
