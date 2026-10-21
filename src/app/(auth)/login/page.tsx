'use client'

/**
 * Login page for Union Verify.
 *
 * Features:
 * - Zod-based client-side validation
 * - Password show/hide toggle
 * - Server error surfaced from NextAuth
 * - Loading / submitting state
 */

import { useState, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { z } from 'zod'
import {
  AlertCircle as AlertCircleIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Loader2 as LoaderCircleIcon,
  ShieldCheck as ShieldCheckIcon,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFields = z.infer<typeof loginSchema>
type FieldErrors = Partial<Record<keyof LoginFields, string>>

// ---------------------------------------------------------------------------
// Error code → human-readable message map
// ---------------------------------------------------------------------------
const AUTH_ERRORS: Record<string, string> = {
  CredentialsSignin: 'Incorrect email or password. Please try again.',
  EMAIL_NOT_VERIFIED:
    'Your email address has not been verified. Check your inbox for a verification link.',
  OAuthAccountNotLinked:
    'An account already exists with this email using a different sign-in method.',
  Default: 'Something went wrong. Please try again.',
}

function resolveError(code: string | null): string | null {
  if (!code) return null
  return AUTH_ERRORS[code] ?? AUTH_ERRORS.Default
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Pre-fill error from URL query param (NextAuth redirects here on error)
  const urlError = resolveError(searchParams.get('error'))

  const [fields, setFields] = useState<LoginFields>({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(urlError)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      setFields((prev: LoginFields) => ({ ...prev, [name]: value }))
      // Clear per-field error on change
      setFieldErrors((prev: FieldErrors) => ({ ...prev, [name]: undefined }))
      setServerError(null)
    },
    [],
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setServerError(null)

    // Client-side validation
    const result = loginSchema.safeParse(fields)
    if (!result.success) {
      const errors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof LoginFields
        errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await signIn('credentials', {
        email: fields.email.toLowerCase().trim(),
        password: fields.password,
        redirect: false,
      })

      if (response?.error) {
        setServerError(resolveError(response.error) ?? AUTH_ERRORS.Default)
        return
      }

      // Successful login – redirect to the originally requested page or dashboard
      const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
      router.push(callbackUrl)
      router.refresh()
    } catch {
      setServerError(AUTH_ERRORS.Default)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F1C3F]">Welcome back</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Sign in to your Union Verify account to continue.
        </p>
      </div>

      {/* Server / URL error banner */}
      {serverError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{serverError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
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
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            className={`
              w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400
              outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60
              ${
                fieldErrors.email
                  ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                  : 'border-slate-300 focus:border-[#0F1C3F] focus:ring-[#0F1C3F]/10'
              }
            `}
          />
          {fieldErrors.email && (
            <p id="email-error" className="mt-1.5 text-xs text-red-600">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={fields.password}
              onChange={handleChange}
              placeholder="Enter your password"
              disabled={isSubmitting}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              className={`
                w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400
                outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60
                ${
                  fieldErrors.password
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                    : 'border-slate-300 focus:border-[#0F1C3F] focus:ring-[#0F1C3F]/10'
                }
              `}
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
          {fieldErrors.password && (
            <p id="password-error" className="mt-1.5 text-xs text-red-600">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="
            relative w-full flex items-center justify-center gap-2
            rounded-lg bg-[#0F1C3F] px-4 py-2.5 text-sm font-semibold text-white
            transition hover:bg-[#1a2f6e] focus-visible:outline focus-visible:outline-2
            focus-visible:outline-offset-2 focus-visible:outline-[#0F1C3F]
            disabled:cursor-not-allowed disabled:opacity-70
          "
        >
          {isSubmitting && (
            <LoaderCircleIcon className="h-4 w-4 animate-spin" aria-hidden />
          )}
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>

        {/* Security / Encryption Note */}
        <div className="pt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheckIcon className="w-3.5 h-3.5 text-[#C9A84C]" />
          <span>Secured with HTTPS</span>
        </div>
      </form>

      {/* Register link */}
      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-[#C9A84C] hover:text-[#b8943f] transition-colors"
        >
          Create an account
        </Link>
      </p>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <LoaderCircleIcon className="h-8 w-8 animate-spin text-[#0F1C3F]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
