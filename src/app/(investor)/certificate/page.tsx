'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Award, CreditCard, Printer, RefreshCw, AlertTriangle } from 'lucide-react'

interface Registration {
  id: string
  docketNumber: string
  partner1Name: string
  partner2Name: string
  registeredAt: string
  registrationPaid: boolean
  certificatePaid: boolean
  certificateNumber: string | null
  unionType: string
  weddingDate: string
}

export default function CertificatePage() {
  const [loading, setLoading] = useState(true)
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [fee, setFee] = useState(0)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/certificate')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRegistration(data.registration)
          setFee(data.certificateFee)
        }
      })
      .catch(() => setError('Could not load your registration.'))
      .finally(() => setLoading(false))
  }, [])

  const handlePay = async () => {
    setPaying(true)
    setError('')
    try {
      const res = await fetch('/api/certificate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.checkoutUrl) throw new Error(data.error || 'Could not start the payment.')
      window.location.href = data.checkoutUrl
    } catch (err: any) {
      setError(err.message)
      setPaying(false)
    }
  }

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>

  if (!registration) {
    return (
      <div className="max-w-xl rounded-2xl border border-gray-200 bg-white p-6 space-y-3">
        <h1 className="text-xl font-bold text-[#0F1C3F]">Certificate</h1>
        <p className="text-sm text-gray-600">
          You haven&apos;t registered your union with Union Verify yet. Register first, and your certificate will appear here.
        </p>
        <Link href="/get-married" className="inline-block px-5 py-2.5 rounded-xl bg-[#0F1C3F] text-white text-sm font-bold">
          Register your union
        </Link>
      </div>
    )
  }

  const registeredOn = new Date(registration.registeredAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  if (!registration.certificatePaid) {
    return (
      <div className="max-w-xl rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h1 className="text-xl font-bold text-[#0F1C3F]">Certificate</h1>
        <p className="text-sm text-gray-600">
          Your union is registered (docket <strong>{registration.docketNumber}</strong>, {registeredOn}). The certificate
          fee is ${fee.toLocaleString()}.
        </p>
        {error && (
          <p className="text-xs text-rose-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> {error}
          </p>
        )}
        <button
          onClick={handlePay}
          disabled={paying}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F1C3F] text-white text-sm font-bold disabled:opacity-50 cursor-pointer"
        >
          {paying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {paying ? 'Opening secure payment…' : `Pay $${fee.toLocaleString()} by card`}
        </button>
        <p className="text-[11px] text-gray-400">Payments are processed by Stripe.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <h1 className="text-xl font-bold text-[#0F1C3F]">Certificate</h1>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Print / save as PDF
        </button>
      </div>

      <div className="rounded-3xl border-4 border-[#C9A84C] bg-white p-8 sm:p-12 text-center space-y-5">
        <Award className="w-12 h-12 text-[#C9A84C] mx-auto" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#C9A84C]">Union Verify</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0F1C3F]">Certificate of Registration</h2>
        <p className="text-sm text-gray-600">This certifies that</p>
        <p className="text-xl sm:text-2xl font-bold text-[#0F1C3F]">
          {registration.partner1Name} &amp; {registration.partner2Name}
        </p>
        <p className="text-sm text-gray-600">
          registered their union with Union Verify on {registeredOn}
          {registration.weddingDate ? `, with a wedding date of ${new Date(registration.weddingDate).toLocaleDateString()}` : ''}.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-xs text-gray-500 pt-4 border-t border-gray-100">
          <p>
            Docket <span className="font-mono font-semibold text-gray-700">{registration.docketNumber}</span>
          </p>
          <p>
            Certificate <span className="font-mono font-semibold text-gray-700">{registration.certificateNumber}</span>
          </p>
        </div>
        <p className="text-[11px] text-gray-400 pt-2">
          This is a Union Verify platform record. It is not a government-issued marriage certificate.
        </p>
      </div>
    </div>
  )
}
