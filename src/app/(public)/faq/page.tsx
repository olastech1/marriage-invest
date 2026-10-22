import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Union Verify',
  description:
    'Answers about Union Verify: joint accounts, returns, fees, security, deposits and withdrawals.',
}

const categories = [
  {
    category: '1. The Platform',
    items: [
      {
        q: 'What is Union Verify?',
        a: 'Union Verify is a joint savings and investment platform for couples. Partners can save into shared vaults, see each other’s contributions, sign a Union Verify certificate together, and invest in the opportunities listed on the platform.',
      },
      {
        q: 'Why use a joint account instead of saving individually?',
        a: 'If you are saving towards shared goals, a joint view means both partners can see the same balance and every contribution, and joint withdrawals need the other partner’s approval.',
      },
      {
        q: 'Is Union Verify a bank?',
        a: 'No. Union Verify is not a bank, and money on the platform is not covered by any government deposit insurance scheme.',
      },
    ],
  },
  {
    category: '2. Currency & Returns',
    items: [
      {
        q: 'What currency is used for investments and payouts?',
        a: 'All platform investments, distributions, fees and withdrawals are in United States Dollars (USD).',
      },
      {
        q: 'Are returns guaranteed?',
        a: 'No. Projected returns and the vault rate are estimates, and the vault rate is variable. They are not guaranteed. All investments carry risk, including the loss of the money you put in.',
      },
      {
        q: 'How often are distributions paid?',
        a: 'It depends on the opportunity: monthly, quarterly, annually or at maturity, as shown on each opportunity’s page. Distributions, if any, are credited to your account balance.',
      },
      {
        q: 'Are there any fees?',
        a: 'Any fee is shown in your account before you confirm a payment or withdrawal, so you always see the amount first.',
      },
    ],
  },
  {
    category: '3. Accounts & Security',
    items: [
      {
        q: 'Does my partner need their own account?',
        a: 'Yes. Each partner signs in with their own email and password. You can invite your partner with a link from the certificate page.',
      },
      {
        q: 'How are passwords stored?',
        a: 'Passwords are stored as bcrypt hashes, never in plain text. Never share your password, including with anyone claiming to be from Union Verify.',
      },
    ],
  },
  {
    category: '4. Deposits & Withdrawals',
    items: [
      {
        q: 'How do I deposit money?',
        a: 'Deposits are made by card through our payment processor from your dashboard.',
      },
      {
        q: 'How do withdrawal requests work?',
        a: 'You request a withdrawal from your dashboard. For joint accounts, your partner needs to approve it, and any deposit your partner is waiting for you to match must be matched first. Requests are then reviewed before payout.',
      },
      {
        q: 'Can I withdraw before an investment matures?',
        a: 'Early withdrawals depend on the terms of each opportunity and may not always be possible.',
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
            How the platform works, what it costs, and the risks involved.
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
            <p className="text-xs text-gray-300">Send us a message and we&apos;ll reply by email.</p>
          </div>
          <Link
            href="/contact"
            className="px-6 py-2.5 rounded-xl bg-[#C9A84C] text-[#0F1C3F] text-xs font-bold hover:bg-[#d4b460] transition-colors whitespace-nowrap"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}
