import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Union Invest',
  description: 'Legal terms and conditions governing the use of the Union Invest platform.',
}

export default function TermsPage() {
  return (
    <div className="bg-white min-h-screen pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-serif font-bold text-[#0F1C3F] mb-4">
          Terms and Conditions of Service
        </h1>
        <p className="text-xs text-gray-400 mb-8 font-mono">Last Updated: October 2024 • Version 2.1</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6 text-xs leading-relaxed">
          <section>
            <h2 className="text-sm font-bold text-[#0F1C3F] uppercase tracking-wider mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing, browsing, registering an account on, or submitting capital to Union Invest (&quot;the Platform&quot;, &quot;Company&quot;, &quot;we&quot;, &quot;us&quot;), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions, our Privacy Policy, and any applicable fund Offer Documents.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#0F1C3F] uppercase tracking-wider mb-2">2. Nature of Platform & Financial Risks</h2>
            <p>
              Union Invest is an investment syndication and private asset platform. We are not a commercial banking institution, and capital deposited is not insured by FDIC, FSCS, or equivalent governmental deposit insurance schemes. All investment opportunities carry inherent risk, including the possible loss of principal. Projected return rates (e.g., 8.5% p.a.) represent underwritten financial projections and do not constitute a performance guarantee.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#0F1C3F] uppercase tracking-wider mb-2">3. Joint Account Structure & Authority</h2>
            <p>
              Accounts registered on Union Invest are established as joint couple accounts. Both registered partners warrant that they possess legal capacity to enter binding agreements. Any withdrawal request, capital redeployment, or formal amendment initiated by one partner may require mutual confirmation per platform safety rules.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#0F1C3F] uppercase tracking-wider mb-2">4. Currency Denomination & Payments</h2>
            <p>
              All platform commitments, ledger balances, distributions, fees, and withdrawals are accounted strictly in United States Dollars (USD $). Investors bear responsibility for any foreign currency conversion fees charged by their originating banking institutions.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#0F1C3F] uppercase tracking-wider mb-2">5. Withdrawals, Lockup & Liquidity</h2>
            <p>
              Each investment opportunity specifies a defined maturity term. Investors agree to honor the contractual tenure. Where early exit requests are permitted, they remain subject to administrative evaluation, available fund liquidity, and applicable exit processing deductions as set forth in the pertinent Offer Document.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#0F1C3F] uppercase tracking-wider mb-2">6. Governing Law & Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of New York and applicable federal laws of the United States, without regard to conflict of law principles. Any dispute arising under these terms shall be settled through binding commercial arbitration in New York, NY.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
