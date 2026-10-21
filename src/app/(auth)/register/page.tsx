'use client'

/**
 * Registration page for Union Verify.
 *
 * Features:
 * - Full name, email, phone, password, confirm-password fields
 * - Phone number formatting (International standard)
 * - Zod inline schema validation
 * - Terms + Privacy Policy agreement checkbox
 * - POST /api/auth/register
 * - Success state with email verification notice
 */

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { z } from 'zod'
import {
  EyeIcon,
  EyeOffIcon,
  LoaderCircleIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(80, 'Full name must be 80 characters or fewer')
      .regex(/^[a-zA-Z\s'-]+$/, 'Full name may only contain letters, spaces, hyphens, and apostrophes'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    phone: z
      .string()
      .min(7, 'Please enter a valid phone number')
      .max(25, 'Phone number is too long'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the Terms and Privacy Policy to continue',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterFields = {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  agreeTerms: boolean
}

type FieldErrors = Partial<Record<keyof RegisterFields, string>>

// ---------------------------------------------------------------------------
// Phone formatter – formats international and standard phone numbers
// ---------------------------------------------------------------------------
function formatPhone(raw: string): string {
  if (!raw) return ''
  const cleaned = raw.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+')) {
    const countryPlus = cleaned.slice(0, 3)
    const rest = cleaned.slice(3)
    if (rest.length <= 3) return `${countryPlus} ${rest}`.trim()
    if (rest.length <= 6) return `${countryPlus} ${rest.slice(0, 3)} ${rest.slice(3)}`.trim()
    return `${countryPlus} ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 11)}`.trim()
  }
  const digits = cleaned.replace(/\D/g, '')
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

// Password strength helper
function passwordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-400' }
  if (score === 3) return { score, label: 'Fair', color: 'bg-amber-400' }
  if (score === 4) return { score, label: 'Good', color: 'bg-blue-400' }
  return { score, label: 'Strong', color: 'bg-emerald-500' }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function RegisterPage() {
  const router = useRouter()
  const [fields, setFields] = useState<RegisterFields>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const strength = passwordStrength(fields.password)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFields((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    setServerError(null)
  }, [])

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Store raw value for validation, display formatted
    const raw = e.target.value.replace(/\s/g, '')
    setFields((prev) => ({ ...prev, phone: raw }))
    setFieldErrors((prev) => ({ ...prev, phone: undefined }))
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setServerError(null)

    // Client-side validation
    const result = registerSchema.safeParse(fields)
    if (!result.success) {
      const errors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof RegisterFields
        if (!errors[key]) errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name.trim(),
          email: fields.email.toLowerCase().trim(),
          phone: fields.phone.trim(),
          password: fields.password,
        }),
      })

      const data: { error?: string; message?: string } = await response.json()

      if (!response.ok) {
        setServerError(data.error ?? 'Registration failed. Please try again.')
        return
      }

      // Account exists now: sign straight in
      const signInResult = await signIn('credentials', {
        email: fields.email.toLowerCase().trim(),
        password: fields.password,
        redirect: false,
      })
      if (signInResult?.error) {
        setSuccess(true)
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setServerError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
          <CheckCircle2Icon className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-[#0F1C3F]">Account created</h2>
        <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
          Your account for <strong className="text-slate-700">{fields.email}</strong> is ready. Sign in to continue.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-[#0F1C3F] hover:underline"
        >
          Sign in →
        </Link>
      </div>
    )
  }

  // ── Registration form ─────────────────────────────────────────────────────
  const inputBase =
    'w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60'
  const inputNormal = 'border-slate-300 focus:border-[#0F1C3F] focus:ring-[#0F1C3F]/10'
  const inputError = 'border-red-400 focus:border-red-400 focus:ring-red-100'

  function cls(field: keyof RegisterFields) {
    return `${inputBase} ${fieldErrors[field] ? inputError : inputNormal}`
  }

  return (
    <>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-[#0F1C3F]">Create your account</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Join thousands of couples growing wealth with Union Verify.
        </p>
      </div>

      {serverError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Full name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={fields.name}
            onChange={handleChange}
            placeholder="Eleanor Sterling"
            disabled={isSubmitting}
            className={cls('name')}
          />
          {fieldErrors.name && (
            <p className="mt-1.5 text-xs text-red-600">{fieldErrors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={handleChange}
            placeholder="you@example.com"
            disabled={isSubmitting}
            className={cls('email')}
          />
          {fieldErrors.email && (
            <p className="mt-1.5 text-xs text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={formatPhone(fields.phone)}
            onChange={handlePhoneChange}
            placeholder="+1 (555) 234-5678"
            disabled={isSubmitting}
            className={cls('phone')}
          />
          {fieldErrors.phone ? (
            <p className="mt-1.5 text-xs text-red-600">{fieldErrors.phone}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">
              International format (e.g. +1 555 234 5678 or +41 44 234 5678)
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={fields.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              disabled={isSubmitting}
              className={`${cls('password')} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? (
                <EyeOffIcon className="h-4 w-4" aria-hidden />
              ) : (
                <EyeIcon className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>

          {/* Strength meter */}
          {fields.password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      i <= strength.score ? strength.color : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Strength:{' '}
                <span
                  className={`font-medium ${
                    strength.score <= 2
                      ? 'text-red-500'
                      : strength.score === 3
                        ? 'text-amber-500'
                        : strength.score === 4
                          ? 'text-blue-500'
                          : 'text-emerald-600'
                  }`}
                >
                  {strength.label}
                </span>
              </p>
            </div>
          )}

          {fieldErrors.password && (
            <p className="mt-1.5 text-xs text-red-600">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              value={fields.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              disabled={isSubmitting}
              className={`${cls('confirmPassword')} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              tabIndex={-1}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showConfirm ? (
                <EyeOffIcon className="h-4 w-4" aria-hidden />
              ) : (
                <EyeIcon className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        {/* Terms */}
        <div className="pt-1">
          <div className="flex items-start gap-3">
            <input
              id="agreeTerms"
              name="agreeTerms"
              type="checkbox"
              checked={fields.agreeTerms}
              onChange={handleChange}
              disabled={isSubmitting}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0F1C3F] accent-[#0F1C3F] cursor-pointer disabled:cursor-not-allowed"
            />
            <label htmlFor="agreeTerms" className="text-sm text-slate-600 cursor-pointer leading-snug">
              I agree to Union Verify&apos;s{' '}
              <Link
                href="/terms"
                target="_blank"
                className="font-medium text-[#0F1C3F] hover:text-[#C9A84C] transition-colors underline underline-offset-2"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                target="_blank"
                className="font-medium text-[#0F1C3F] hover:text-[#C9A84C] transition-colors underline underline-offset-2"
              >
                Privacy Policy
              </Link>
            </label>
          </div>
          {fieldErrors.agreeTerms && (
            <p className="mt-1.5 text-xs text-red-600 pl-7">{fieldErrors.agreeTerms}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="
            mt-2 w-full flex items-center justify-center gap-2
            rounded-lg bg-[#0F1C3F] px-4 py-2.5 text-sm font-semibold text-white
            transition hover:bg-[#1a2f6e] focus-visible:outline focus-visible:outline-2
            focus-visible:outline-offset-2 focus-visible:outline-[#0F1C3F]
            disabled:cursor-not-allowed disabled:opacity-70
          "
        >
          {isSubmitting && <LoaderCircleIcon className="h-4 w-4 animate-spin" aria-hidden />}
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-[#C9A84C] hover:text-[#b8943f] transition-colors"
        >
          Sign in
        </Link>
      </p>
    </>
  )
}
