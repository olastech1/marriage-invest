import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy & Data Protection Notice | Union Invest',
  description: 'How Union Invest collects, uses, and safeguards personal investor data.',
}

export default function PrivacyPage() {
  return (
    <div className="bg-white min-h-screen pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-serif font-bold text-[#0F1C3F] mb-4">
          Privacy & Data Protection Notice
        </h1>
        <p className="text-xs text-gray-400 mb-8 font-mono">Effective Date: October 2024 • Version 1.5</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6 text-xs leading-relaxed">
          <section>
            <h2 className="text-sm font-bold text-[#0F1C3F] uppercase tracking-wider mb-2">1. Data Minimization Principle</h2>
            <p>
              Union Invest collects only personal information strictly necessary for fulfilling regulatory compliance (AML/KYC), executing contractual investment agreements, administering USD payment transactions, and securing your investor portal account.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#0F1C3F] uppercase tracking-wider mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Identity Information:</strong> Full legal names, government identification numbers, and residential addresses of both partners.</li>
              <li><strong>Contact Information:</strong> Verified email addresses and telephone numbers.</li>
              <li><strong>Financial & Payment Data:</strong> Bank account routing numbers, payment transaction IDs, and settlement ledger histories.</li>
              <li><strong>Technical Metadata:</strong> IP addresses, browser agents, and cryptographic hashes of electronic document signatures.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#0F1C3F] uppercase tracking-wider mb-2">3. Data Security & Storage</h2>
            <p>
              All data transmissions are protected via Transport Layer Security (TLS 1.3 / 256-bit AES encryption). Sensitive passwords are non-reversibly salted and hashed via bcrypt. Identity verification assets are stored in isolated, access-controlled private cloud storage.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#0F1C3F] uppercase tracking-wider mb-2">4. Non-Disclosure & Third Parties</h2>
            <p>
              We do not sell, rent, or monetize your personal or financial data. Information is disclosed solely to regulated payment processors, banking partners, and statutory authorities as legally compelled under applicable anti-money laundering legislation.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
