'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setResult({ ok: !!data.success, text: data.message || data.error || 'Something went wrong.' })
    } catch {
      setResult({ ok: false, text: 'Something went wrong. Try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F1C3F]">Forgot your password?</h1>
        <p className="mt-1.5 text-sm text-slate-500">Enter your account email and we&apos;ll send you a link to choose a new one.</p>
      </div>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0F1C3F] focus:ring-2 focus:ring-[#0F1C3F]/10"
          />
        </div>
        {result && (
          <p className={`rounded-lg px-4 py-3 text-sm ${result.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {result.text}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-[#0F1C3F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2f6e] disabled:opacity-70"
        >
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Remembered it?{' '}
        <Link href="/login" className="font-medium text-[#C9A84C] hover:text-[#b8943f]">
          Sign in
        </Link>
      </p>
    </>
  )
}
