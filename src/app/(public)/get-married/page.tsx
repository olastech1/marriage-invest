'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Heart, CreditCard, ArrowRight, AlertTriangle, RefreshCw, Check } from 'lucide-react'
import { MARRIAGE_TYPES } from '@/types/marriage'

// Must match FEES in src/lib/payments.ts (the server sets the real price)
const OPTIONS = [
  { id: 'both', label: 'Full package: I pay', amount: 1000, detail: 'Registration and your Union Verify certificate, paid by you.' },
  { id: 'split', label: 'Split 50-50', amount: 500, detail: 'You pay $500 now; your partner pays their $500 from their account. It unlocks when both are paid.' },
] as const

type OptionId = (typeof OPTIONS)[number]['id']

const inputClass =
  'mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-300 text-base sm:text-sm focus:outline-none focus:border-[#C9A84C]'

export default function GetMarriedPage() {
  const { data: session, status } = useSession()
  const [step, setStep] = useState(1)

  const [unionType, setUnionType] = useState(MARRIAGE_TYPES[0].id)
  const [partner1Dob, setPartner1Dob] = useState('')
  const [partner1Citizenship, setPartner1Citizenship] = useState('')
  const [partner2Name, setPartner2Name] = useState('')
  const [partner2Email, setPartner2Email] = useState('')
  const [partner2Dob, setPartner2Dob] = useState('')
  const [partner2Citizenship, setPartner2Citizenship] = useState('')
  const [weddingDate, setWeddingDate] = useState('')
  const [vows, setVows] = useState('')
  const [option, setOption] = useState<OptionId>('both')
  const [agreed, setAgreed] = useState(false)

  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const selected = OPTIONS.find((o) => o.id === option)!

  const next = () => {
    setError('')
    if (step === 2 && (!partner2Name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(partner2Email.trim()))) {
      setError("Please enter your partner's name and a valid email.")
      return
    }
    setStep((s) => s + 1)
  }

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!agreed) {
      setError('Please accept the Terms to continue.')
      return
    }
    setPaying(true)
    try {
      const res = await fetch('/api/marriage-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedTypeId: unionType,
          partner1Dob,
          partner1Citizenship,
          partner2Name,
          partner2Email,
          partner2Dob,
          partner2Citizenship,
          weddingDate,
          customVows: vows,
          paymentOption: option,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.checkoutUrl) throw new Error(data.error || 'Could not start the payment.')
      window.location.href = data.checkoutUrl
    } catch (err: any) {
      setError(err.message)
      setPaying(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <Heart className="w-8 h-8 text-[#C9A84C] mx-auto" />
          <h1 className="text-3xl font-bold text-[#0F1C3F]">Register your union</h1>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            Record your union on Union Verify, link your accounts, and save together. This is a Union Verify platform
            registration — it does not replace a legal marriage with your government.
          </p>
        </div>

        {status === 'loading' ? (
          <p className="text-center text-sm text-gray-400">Loading…</p>
        ) : !session?.user ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center space-y-3">
            <p className="text-sm text-gray-600">Sign in or create an account to register your union.</p>
            <div className="flex justify-center gap-3">
              <Link href="/login?callbackUrl=/get-married" className="px-5 py-2.5 rounded-xl border border-[#0F1C3F] text-[#0F1C3F] text-sm font-bold">
                Sign in
              </Link>
              <Link href="/register" className="px-5 py-2.5 rounded-xl bg-[#0F1C3F] text-white text-sm font-bold">
                Create account
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePay} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
            <ol className="flex gap-2 text-[11px] font-semibold text-gray-400">
              {['Union', 'Partners', 'Details', 'Payment'].map((label, i) => (
                <li key={label} className={`flex-1 border-t-2 pt-1 ${step > i ? 'border-[#C9A84C] text-[#0F1C3F]' : 'border-gray-200'}`}>
                  {i + 1}. {label}
                </li>
              ))}
            </ol>

            {step === 1 && (
              <fieldset className="space-y-2">
                <legend className="text-sm font-bold text-[#0F1C3F] mb-2">Type of union</legend>
                {MARRIAGE_TYPES.map((t) => (
                  <label
                    key={t.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer ${unionType === t.id ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-gray-200'}`}
                  >
                    <input type="radio" name="unionType" value={t.id} checked={unionType === t.id} onChange={() => setUnionType(t.id)} className="mt-1" />
                    <span>
                      <span className="block text-sm font-semibold text-gray-800">{t.label}</span>
                      <span className="block text-xs text-gray-500">{t.description}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <p className="text-sm font-bold text-[#0F1C3F]">You</p>
                  <p className="text-sm text-gray-600">
                    {session.user.name} · {session.user.email}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="text-xs font-semibold text-gray-600">
                      Date of birth (optional)
                      <input type="date" value={partner1Dob} onChange={(e) => setPartner1Dob(e.target.value)} className={inputClass} />
                    </label>
                    <label className="text-xs font-semibold text-gray-600">
                      Citizenship (optional)
                      <input type="text" value={partner1Citizenship} onChange={(e) => setPartner1Citizenship(e.target.value)} className={inputClass} />
                    </label>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-bold text-[#0F1C3F]">Your partner</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="text-xs font-semibold text-gray-600">
                      Full name
                      <input type="text" required value={partner2Name} onChange={(e) => setPartner2Name(e.target.value)} className={inputClass} />
                    </label>
                    <label className="text-xs font-semibold text-gray-600">
                      Email
                      <input type="email" required value={partner2Email} onChange={(e) => setPartner2Email(e.target.value)} className={inputClass} />
                    </label>
                    <label className="text-xs font-semibold text-gray-600">
                      Date of birth (optional)
                      <input type="date" value={partner2Dob} onChange={(e) => setPartner2Dob(e.target.value)} className={inputClass} />
                    </label>
                    <label className="text-xs font-semibold text-gray-600">
                      Citizenship (optional)
                      <input type="text" value={partner2Citizenship} onChange={(e) => setPartner2Citizenship(e.target.value)} className={inputClass} />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    If your partner already has an account with this email, your accounts are linked after payment. Otherwise we
                    email them an invitation.
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-600">
                  Wedding date (optional)
                  <input type="date" value={weddingDate} onChange={(e) => setWeddingDate(e.target.value)} className={inputClass} />
                </label>
                <label className="block text-xs font-semibold text-gray-600">
                  Vows or a message for your record (optional)
                  <textarea rows={4} maxLength={2000} value={vows} onChange={(e) => setVows(e.target.value)} className={inputClass} />
                </label>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                {OPTIONS.map((o) => (
                  <label
                    key={o.id}
                    className={`flex items-start justify-between gap-3 p-3 rounded-xl border cursor-pointer ${option === o.id ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-gray-200'}`}
                  >
                    <span className="flex items-start gap-3">
                      <input type="radio" name="option" checked={option === o.id} onChange={() => setOption(o.id)} className="mt-1" />
                      <span>
                        <span className="block text-sm font-semibold text-gray-800">{o.label}</span>
                        <span className="block text-xs text-gray-500">{o.detail}</span>
                      </span>
                    </span>
                    <span className="text-sm font-bold text-[#0F1C3F]">${o.amount.toLocaleString()}</span>
                  </label>
                ))}
                <label className="flex items-start gap-2 text-xs text-gray-600">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
                  <span>
                    I agree to the <Link href="/terms" className="underline">Terms</Link> and understand this is a platform
                    registration, not a legal marriage.
                  </span>
                </label>
              </div>
            )}

            {error && (
              <p className="text-xs text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> {error}
              </p>
            )}

            <div className="flex justify-between gap-3">
              {step > 1 ? (
                <button type="button" onClick={() => setStep((s) => s - 1)} className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 cursor-pointer">
                  Back
                </button>
              ) : (
                <span />
              )}
              {step < 4 ? (
                <button type="button" onClick={next} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F1C3F] text-white text-sm font-bold cursor-pointer">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={paying} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F1C3F] text-white text-sm font-bold disabled:opacity-50 cursor-pointer">
                  {paying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  {paying ? 'Opening secure payment…' : `Pay $${selected.amount.toLocaleString()} by card`}
                </button>
              )}
            </div>
            {step === 4 && (
              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Payments are processed by Stripe. Your registration is created once the payment succeeds.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
