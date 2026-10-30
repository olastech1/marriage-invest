'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'

type State =
  | { kind: 'loading' }
  | { kind: 'done'; message: string; nextUrl: string }
  | { kind: 'error'; message: string }

const NEXT_LABEL: Record<string, string> = {
  '/chat?thread=spouse': 'Go to couple chat',
  '/portfolio': 'View portfolio',
  '/certificate': 'View certificate',
  '/dashboard': 'Go to dashboard',
}

function PaymentComplete() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    if (!sessionId) return
    fetch('/api/payments/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setState({ kind: 'done', message: data.message || 'Payment received.', nextUrl: data.nextUrl || '/dashboard' })
        } else {
          setState({ kind: 'error', message: data.error || 'We could not confirm your payment.' })
        }
      })
      .catch(() => setState({ kind: 'error', message: 'We could not confirm your payment.' }))
  }, [sessionId])

  if (!sessionId) {
    return <Card icon="error" title="No payment found" message="This link is missing its payment reference." nextUrl="/dashboard" />
  }
  if (state.kind === 'loading') {
    return <Card icon="loading" title="Confirming your payment…" message="This takes a few seconds." />
  }
  if (state.kind === 'error') {
    return (
      <Card
        icon="error"
        title="Payment not confirmed"
        message={`${state.message} If you were charged, contact support with your Stripe receipt.`}
        nextUrl="/dashboard"
      />
    )
  }
  return <Card icon="done" title="Payment received" message={state.message} nextUrl={state.nextUrl} />
}

function Card({ icon, title, message, nextUrl }: { icon: 'loading' | 'done' | 'error'; title: string; message: string; nextUrl?: string }) {
  return (
    <div className="max-w-md mx-auto mt-10 rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm space-y-3">
      <div className="flex justify-center">
        {icon === 'loading' && <RefreshCw className="w-8 h-8 text-[#C9A84C] animate-spin" />}
        {icon === 'done' && <CheckCircle2 className="w-8 h-8 text-emerald-600" />}
        {icon === 'error' && <AlertTriangle className="w-8 h-8 text-amber-600" />}
      </div>
      <h1 className="text-lg font-bold text-[#0F1C3F]">{title}</h1>
      <p className="text-sm text-gray-600">{message}</p>
      {nextUrl && (
        <Link
          href={nextUrl}
          className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-[#0F1C3F] text-white text-sm font-bold hover:bg-[#1a2f64]"
        >
          {NEXT_LABEL[nextUrl] || 'Continue'}
        </Link>
      )}
    </div>
  )
}

export default function PaymentCompletePage() {
  return (
    <Suspense fallback={<Card icon="loading" title="Confirming your payment…" message="This takes a few seconds." />}>
      <PaymentComplete />
    </Suspense>
  )
}
