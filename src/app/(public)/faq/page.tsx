import type { Metadata } from 'next'
import Link from 'next/link'
import { HelpCircle, ChevronRight, MessageSquare } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Union Verify',
  description:
    'Comprehensive answers regarding our marriage investment platform, USD operations, distributions, KYC onboarding, security, and withdrawals.',
}

const categories = [
  {
    category: '1. Platform & Business Model',
    items: [
      {
        q: 'What is Union Verify?',
        a: 'Union Verify is a secure, institutional investment platform designed specifically for married couples. It allows partners to pool financial resources into structured, USD-denominated investment vehicles with transparent distribution schedules and shared governance.',
      },
      {
        q: 'Why invest as a married couple rather than individually?',
        a: 'Couples frequently manage life milestones together—from home ownership to generational wealth. Union Verify provides joint account ownership, dual-approval controls for withdrawals, synchronized tax statements, and consolidated portfolio tracking.',
      },
      {
        q: 'Is Union Verify a bank or an investment platform?',
        a: 'Union Verify operates as an investment syndication and private placement platform. We are not a commercial depository bank. Funds committed are allocated into real asset-backed and structured yield vehicles pursuant to official offer documents.',
      },
    ],
  },
  {
    category: '2. Currency & Financial Terms',
    items: [
      {
        q: 'What currency is used for investments and payouts?',
        a: 'All platform investments, interest calculations, distributions, accounting ledgers, and withdrawals are strictly denominated in United States Dollars (USD $).',
      },
      {
        q: 'Are returns guaranteed?',
        a: 'No. All stated rates (e.g. 8.5% p.a.) are projections based on historical asset underwriting and cash flow modeling. They are not guaranteed outcomes unless specifically backed by an explicit and disclosed commercial surety. All investments carry risk of loss.',
      },
      {
        q: 'How frequently are distributions calculated and disbursed?',
        a: 'Distribution frequency depends on the chosen fund: Monthly, Quarterly, Annual, or at Maturity. Approved distributions are credited to your investor cash ledger, from where you can initiate a bank withdrawal.',
      },
      {
        q: 'What fees does the platform charge?',
        a: 'Platform management fees, custody charges, and standard withdrawal processing deductions (e.g., 2% on capital liquidations) are fully disclosed in each official offer document. There are zero hidden fees.',
      },
    ],
  },
  {
    category: '3. Registration, Verification & Onboarding',
    items: [
      {
        q: 'Do both spouses need to verify their identity?',
        a: 'Yes. In adherence to Anti-Money Laundering (AML) and Know-Your-Customer (KYC) regulatory standards, both partners must complete digital identity verification before private investment allocations can be funded.',
      },
      {
        q: 'What documentation is required for onboarding?',
        a: 'A government-issued photo ID (passport, national ID, or driver’s license), proof of residential address, and optional confirmation of civil union or marriage status.',
      },
      {
        q: 'How is account access secured?',
        a: 'We implement 256-bit SSL encryption, bcrypt password hashing, session activity logging, and optional Two-Factor Authentication (2FA) via authenticator apps.',
      },
    ],
  },
  {
    category: '4. Deposits, Payments & Withdrawals',
    items: [
      {
        q: 'What payment methods are supported for funding?',
        a: 'We support international USD wire transfers (ACH / SWIFT) and verified debit/credit card checkout via licensed payment processors with secure webhook verification.',
      },
      {
        q: 'How do withdrawal requests work?',
        a: 'Investors submit withdrawal requests through their dashboard. The platform verifies available settled balance, applies contractual fee deductions, and routes the request through a dual-officer administrative review before payout execution.',
      },
      {
        q: 'Can capital be withdrawn before the fund maturity date?',
        a: 'Early withdrawals are governed by each fund’s specific contractual terms. Where liquidity permits, early exits are evaluated under administrative review and may incur an early redemption fee to protect fund stability.',
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <div className="bg-white min-h-screen pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider block mb-2">
            Knowledge Base
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F1C3F] mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Detailed information regarding platform operations, USD transactions, contractual terms, and regulatory safeguards.
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-12">
          {categories.map((cat, idx) => (
            <div key={idx} className="space-y-4">
              <h2 className="text-lg font-bold text-[#0F1C3F] border-b border-gray-100 pb-2">
                {cat.category}
              </h2>
              <div className="space-y-3">
                {cat.items.map((item, i) => (
                  <details
                    key={i}
                    className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <summary className="flex items-center justify-between p-5 cursor-pointer text-sm font-semibold text-[#0F1C3F] hover:text-[#C9A84C] list-none select-none">
                      <span>{item.q}</span>
                      <span className="text-gray-400 group-open:rotate-180 transition-transform">
                        ▾
                      </span>
                    </summary>
                    <div className="px-5 pb-5 text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 bg-[#0F1C3F] rounded-2xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-base font-bold mb-1">Have a specific question not covered here?</h3>
            <p className="text-xs text-gray-300">Our investor relations and compliance officers respond within 24 business hours.</p>
          </div>
          <Link
            href="/contact"
            className="px-6 py-2.5 rounded-xl bg-[#C9A84C] text-[#0F1C3F] text-xs font-bold hover:bg-[#d4b460] transition-colors whitespace-nowrap"
          >
            Contact Support Desk
          </Link>
        </div>
      </div>
    </div>
  )
}
