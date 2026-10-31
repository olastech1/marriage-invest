'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function ResetForm() {
  const token = useSearchParams().get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setResult({ ok: false, text: "The two passwords don't match." })
      return
    }
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      setResult({ ok: !!data.success, text: data.message || data.error || 'Something went wrong.' })
    } catch {
      setResult({ ok: false, text: 'Something went wrong. Try again.' })
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-slate-600">
        This link is incomplete.{' '}
        <Link href="/forgot-password" className="font-medium text-[#C9A84C]">
          Ask for a new reset link
        </Link>
        .
      </p>
    )
  }
  if (result?.ok) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg px-4 py-3 text-sm bg-emerald-50 text-emerald-800 border border-emerald-200">{result.text}</p>
        <Link href="/login" className="block w-full text-center rounded-lg bg-[#0F1C3F] px-4 py-2.5 text-sm font-semibold text-white">
          Sign in
        </Link>
      </div>
    )
  }
  const input = 'w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0F1C3F] focus:ring-2 focus:ring-[#0F1C3F]/10'
  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
        <input id="password" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
        <p className="mt-1.5 text-xs text-slate-400">At least 8 characters, with a capital letter and a number.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 mb-1.5">Type it again</label>
        <input id="confirm" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
      </div>
      {result && <p className="rounded-lg px-4 py-3 text-sm bg-red-50 text-red-700 border border-red-200">{result.text}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-lg bg-[#0F1C3F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2f6e] disabled:opacity-70">
        {busy ? 'Saving…' : 'Save new password'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F1C3F]">Choose a new password</h1>
        <p className="mt-1.5 text-sm text-slate-500">Pick something you haven&apos;t used before.</p>
      </div>
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </>
  )
}
