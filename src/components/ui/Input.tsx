'use client'

import React, { forwardRef, useId } from 'react'

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type InputVariant = 'default' | 'filled'

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: InputVariant
  /** Wrapped in a div for layout; this class goes on the outer wrapper */
  wrapperClassName?: string
  /** Optional size for the input field */
  inputSize?: 'sm' | 'md' | 'lg'
}

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  variant?: InputVariant
  wrapperClassName?: string
  resize?: 'none' | 'y' | 'x' | 'both'
}

// ---------------------------------------------------------------------------
// Shared label
// ---------------------------------------------------------------------------
function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-[#0F1C3F] mb-1"
    >
      {children}
      {required && (
        <span className="ml-0.5 text-red-500" aria-hidden="true">
          *
        </span>
      )}
    </label>
  )
}

// ---------------------------------------------------------------------------
// Base input classes
// ---------------------------------------------------------------------------
const baseInputClasses = [
  'w-full rounded-lg border transition-colors duration-150 outline-none',
  'text-[#0F1C3F] placeholder:text-slate-400',
  'focus:ring-2 focus:ring-[#0F1C3F]/20 focus:border-[#0F1C3F]',
  'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ')

const variantClasses: Record<InputVariant, string> = {
  default: 'bg-white border-slate-300',
  filled: 'bg-slate-50 border-slate-200 focus:bg-white',
}

const errorClasses = 'border-red-400 focus:border-red-500 focus:ring-red-200'

const sizeClasses = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-3.5 text-sm',
  lg: 'h-12 px-4 text-base',
}

// ---------------------------------------------------------------------------
// Input component
// ---------------------------------------------------------------------------
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      wrapperClassName,
      inputSize = 'md',
      className,
      id: idProp,
      required,
      ...rest
    },
    ref
  ) => {
    const autoId = useId()
    const id = idProp ?? autoId
    const errorId = `${id}-error`
    const helperId = `${id}-helper`

    const inputClasses = cn(
      baseInputClasses,
      variantClasses[variant],
      error ? errorClasses : '',
      leftIcon ? 'pl-10' : '',
      rightIcon ? 'pr-10' : '',
      sizeClasses[inputSize],
      className
    )

    return (
      <div className={cn('flex flex-col', wrapperClassName)}>
        {label && (
          <FieldLabel htmlFor={id} required={required}>
            {label}
          </FieldLabel>
        )}

        <div className="relative">
          {leftIcon && (
            <span
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            required={required}
            className={inputClasses}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            {...rest}
          />

          {rightIcon && (
            <span
              className="absolute inset-y-0 right-3 flex items-center text-slate-400"
              aria-hidden="true"
            >
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p id={errorId} className="mt-1 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={helperId} className="mt-1 text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// ---------------------------------------------------------------------------
// Textarea component
// ---------------------------------------------------------------------------
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'default',
      wrapperClassName,
      resize = 'y',
      className,
      id: idProp,
      required,
      rows = 4,
      ...rest
    },
    ref
  ) => {
    const autoId = useId()
    const id = idProp ?? autoId
    const errorId = `${id}-error`
    const helperId = `${id}-helper`

    const resizeClass = {
      none: 'resize-none',
      y: 'resize-y',
      x: 'resize-x',
      both: 'resize',
    }[resize]

    const textareaClasses = cn(
      baseInputClasses,
      variantClasses[variant],
      error ? errorClasses : '',
      'px-3.5 py-2.5 text-sm',
      resizeClass,
      'min-h-[80px]',
      className
    )

    return (
      <div className={cn('flex flex-col', wrapperClassName)}>
        {label && (
          <FieldLabel htmlFor={id} required={required}>
            {label}
          </FieldLabel>
        )}

        <textarea
          ref={ref}
          id={id}
          rows={rows}
          required={required}
          className={textareaClasses}
          aria-invalid={!!error}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          {...rest}
        />

        {error && (
          <p id={errorId} className="mt-1 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={helperId} className="mt-1 text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { Input, Textarea, cn }
export default Input
