import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy & Data Protection Notice | Union Verify',
  description: 'How Union Verify collects, uses, and safeguards personal investor data.',
}

export default function PrivacyPage() {
  return (
    <div className="bg-white min-h-screen pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-serif font-bold text-[#0F1C3F] mb-8">
          Privacy & Data Protection Notice
        </h1>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6 text-xs leading-relaxed">
          <section>
            <h2 className="text-sm font-bold text-[#0F1C3F] uppercase tracking-wider mb-2">1. Why We Collect Information</h2>
            <p>
              Union Verify uses your personal information to run your account, connect you with your partner, process payments and withdrawals, and reply to your messages.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#0F1C3F] uppercase tracking-wider mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Information:</strong> Your name, email address, phone number and password (stored as a hash).</li>
              <li><strong>Information You Add:</strong> Details you enter on the platform, such as your partner&apos;s name and email, certificate details, profile information and messages.</li>
              <li><strong>Transaction Records:</strong> Records of your deposits, investments, payments and withdrawals. Card payments are handled by a third-party payment processor.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#0F1C3F] uppercase tracking-wider mb-2">3. Data Security & Storage</h2>
            <p>
              Passwords are salted and hashed with bcrypt and are never stored in plain text.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#0F1C3F] uppercase tracking-wider mb-2">4. Non-Disclosure & Third Parties</h2>
            <p>
              We do not sell or rent your personal data. We share it only where needed to run the service (for example, with our payment processor) or where required by law.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
