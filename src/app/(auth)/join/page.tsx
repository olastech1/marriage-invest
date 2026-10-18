'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Heart,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Mail,
  User,
  KeyRound,
} from 'lucide-react'

function JoinContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const inviterName = searchParams.get('partner') || 'Your Spouse'
  const prefillEmail = searchParams.get('email') || ''
  const unionType = searchParams.get('type') || 'Marriage'
  const partnerRole = searchParams.get('role') || 'Spouse / Partner'

  const [partnerName, setPartnerName] = useState('')
  const [partnerEmail, setPartnerEmail] = useState(prefillEmail)
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(true)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setTimeout(() => {
        router.push('/certificate')
      }, 1500)
    }, 1000)
  }

  return (
    <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-100 max-w-lg w-full mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[#C9A84C]/15 text-[#C9A84C] flex items-center justify-center mx-auto mb-4">
          <Heart className="w-7 h-7 fill-[#C9A84C]" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F1C3F]/5 border border-gray-200 text-[#0F1C3F] text-xs font-bold uppercase tracking-wider mb-2">
          {unionType}
        </div>
        <h1 className="text-2xl font-bold text-[#0F1C3F]">
          You&apos;ve Been Invited by {inviterName}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
          {inviterName} has initiated your official <strong>{unionType}</strong> account on Union Verify. Complete your registration as <strong>{partnerRole}</strong> to review and digitally execute your joint investment certificate.
        </p>
      </div>

      {success ? (
        <div className="p-6 rounded-2xl bg-emerald-50 text-emerald-800 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="font-bold text-base">Account Connected Successfully!</h3>
          <p className="text-xs text-emerald-700">
            Redirecting you to your joint Marriage Investment Certificate...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Your Full Legal Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="First & Last Name"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Your Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="youremail@example.com"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Create Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
              />
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-2">
            <input
              type="checkbox"
              id="covenant-agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
              className="mt-0.5 rounded text-[#C9A84C] focus:ring-[#C9A84C]"
            />
            <label htmlFor="covenant-agree" className="text-xs text-gray-600 leading-normal">
              I agree to the <strong>{unionType}</strong> Investment Terms, 50/50 shared beneficial ownership, and mutual digital certificate signing as <strong>{partnerRole}</strong>.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2c5e] text-white font-bold text-sm tracking-wide transition-all shadow-md shadow-[#0F1C3F]/25 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {loading ? 'Connecting Account...' : `Accept Invitation & Sign Certificate`}
            <ArrowRight className="w-4 h-4 text-[#C9A84C]" />
          </button>
        </form>
      )}

      <div className="text-center mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[#0F1C3F] hover:text-[#C9A84C]">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function JoinPartnerPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-sm text-gray-500">Loading invitation...</div>}>
        <JoinContent />
      </Suspense>
    </div>
  )
}
