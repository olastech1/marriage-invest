'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function Verify() {
  const token = useSearchParams().get('token') || ''
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)
  const sent = useRef(false)

  useEffect(() => {
    if (!token || sent.current) return
    sent.current = true
    fetch('/api/auth/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      .then((res) => res.json())
      .then((data) => setResult({ ok: !!data.success, text: data.message || data.error || 'Something went wrong.' }))
      .catch(() => setResult({ ok: false, text: 'Something went wrong. Try the link again.' }))
  }, [token])

  if (!token) return <p className="text-sm text-slate-600">This link is incomplete. Send a new one from your dashboard.</p>
  if (!result) return <p className="text-sm text-slate-500">Checking your link…</p>
  return (
    <div className="space-y-4">
      <p className={`rounded-lg px-4 py-3 text-sm border ${result.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
        {result.text}
      </p>
      <Link href="/dashboard" className="block w-full text-center rounded-lg bg-[#0F1C3F] px-4 py-2.5 text-sm font-semibold text-white">
        Go to my dashboard
      </Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F1C3F]">Verify your email</h1>
      </div>
      <Suspense fallback={null}>
        <Verify />
      </Suspense>
    </>
  )
}
