'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Heart, ArrowRight } from 'lucide-react'

function JoinContent() {
  const searchParams = useSearchParams()
  const inviterName = searchParams.get('partner')?.trim() || ''
  const invitedEmail = (searchParams.get('email') || searchParams.get('partnerEmail') || '').trim()

  const registerHref = invitedEmail
    ? `/register?email=${encodeURIComponent(invitedEmail)}`
    : '/register'

  return (
    <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-100 max-w-lg w-full mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[#C9A84C]/15 text-[#C9A84C] flex items-center justify-center mx-auto mb-4">
          <Heart className="w-7 h-7 fill-[#C9A84C]" />
        </div>
        <h1 className="text-2xl font-bold text-[#0F1C3F]">
          {inviterName ? `${inviterName} invited you to Union Verify` : 'You’ve been invited to Union Verify'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
          Create your own account to get started. Once you&apos;re signed in, you and your partner
          can connect your accounts and save together.
        </p>
      </div>

      <Link
        href={registerHref}
        className="w-full py-3.5 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2c5e] text-white font-bold text-sm tracking-wide transition-all shadow-md shadow-[#0F1C3F]/25 flex items-center justify-center gap-2"
      >
        Create your account
        <ArrowRight className="w-4 h-4 text-[#C9A84C]" />
      </Link>

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
