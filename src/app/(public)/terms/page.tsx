import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Union Verify',
  description: 'Legal terms and conditions governing the use of the Union Verify platform.',
}

export default function TermsPage() {
  return (
    <div className="bg-white min-h-screen pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-serif font-bold text-[#0F1C3F] mb-8">
          Terms and Conditions of Service
        </h1>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6 text-xs leading-relaxed">
          <section>
            <h2 className="text-sm font-bold text-[#0F1C3F] uppercase tracking-wider mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing, browsing, registering an account on, or submitting capital to Union Verify (&quot;the Platform&quot;, &quot;Company&quot;, &quot;we&quot;, &quot;us&quot;), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions, our Privacy Policy, and the terms shown for any investment opportunity you invest in.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#0F1C3F] uppercase tracking-wider mb-2">2. Nature of Platform & Financial Risks</h2>
            <p>
              Union Verify is not a bank, and money deposited is not insured by the FDIC, FSCS or any equivalent government deposit insurance scheme. All investment opportunities carry risk, including the possible loss of principal. Projected return rates and the vault rate are estimates, can change, and are not a guarantee of performance.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#0F1C3F] uppercase tracking-wider mb-2">3. Joint Account Structure & Authority</h2>
            <p>
              Accounts registered on Union Verify are established as joint couple accounts. Both registered partners warrant that they possess legal capacity to enter binding agreements. Withdrawals from a joint account initiated by one partner require the other partner&apos;s approval.
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
              Each investment opportunity specifies a defined maturity term. Investors agree to honor the contractual tenure. Where early exit requests are permitted, they remain subject to administrative evaluation, available fund liquidity, and applicable withdrawal fees.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#0F1C3F] uppercase tracking-wider mb-2">6. Certificates</h2>
            <p>
              The Union Verify certificate is a document issued by the Platform. It is not a government-issued marriage certificate or licence.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#0F1C3F] uppercase tracking-wider mb-2">7. Questions</h2>
            <p>
              If you have a question about these terms, please <Link href="/contact" className="text-[#0F1C3F] underline">contact us</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
