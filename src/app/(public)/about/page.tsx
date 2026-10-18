import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Target, Users, Landmark, Award, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us | Union Verify',
  description:
    'Learn about Union Verify, our mission, executive leadership, governance structure, and institutional approach to marriage investments.',
}

const leadership = [
  {
    name: 'Platform Founder',
    role: 'Chief Executive Officer',
    bio: 'Visionary fintech entrepreneur with deep roots in building community-driven digital financial platforms, focused on empowering couples through structured joint investing.',
    credentials: 'Founder & Platform Architect',
  },
  {
    name: 'Head of Compliance',
    role: 'Chief Compliance & Legal Counsel',
    bio: 'Expert in digital financial services regulation, KYC/AML policy, and cross-border investment platform governance. Ensuring every investor transaction meets the highest legal standards.',
    credentials: 'Financial Services Compliance Specialist',
  },
  {
    name: 'Head of Finance',
    role: 'Chief Financial Officer',
    bio: 'Experienced financial operations leader overseeing platform treasury, risk management, investment structuring, and transparent distribution reporting for all joint investors.',
    credentials: 'Platform Financial Operations',
  },
]

const milestones = [
  { year: '2022', title: 'Platform Inception', description: 'Established as an innovative partnership vehicle bridging couple-based savings and structured investments.' },
  { year: '2023', title: 'Regulatory Compliance Framework', description: 'Implemented automated KYC/AML verification, electronic signature ledger, and independent escrow accounts.' },
  { year: '2024', title: 'Platform Growth', description: 'Expanded certificate issuance, joint savings vaults, and wedding registry gifting to hundreds of registered couples across multiple countries.' },
]

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-[#0F1C3F] py-20 lg:py-28 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#C9A84C_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-semibold tracking-wider uppercase mb-6">
            Our Purpose & Governance
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Architecting Financial Security for <span className="text-[#C9A84C]">Lifelong Unions</span>
          </h1>
          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-gray-300 leading-relaxed font-light">
            Union Verify was founded on a singular premise: marital financial stability is the cornerstone of household longevity. We deliver institutional-grade investment structures tailored for couples building generational prosperity.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[#C9A84C] text-sm font-semibold tracking-wider uppercase block mb-3">Our Mission</span>
            <h2 className="text-3xl font-bold text-[#0F1C3F] mb-6 leading-snug">
              Democratizing Structured Wealth Accumulation with Unyielding Transparency
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Traditional financial systems treat individuals in silos, ignoring that marital partnerships share liabilities, ambitions, and intergenerational dreams.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Union Verify bridges this divide by providing curated USD investment vehicles featuring verifiable asset backing, transparent distribution terms, and rigorous legal disclosure.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-gray-800">100% USD-Denominated Ledgers</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-gray-800">Audited Offer Documentation</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-gray-800">Direct Joint Investor Rights</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-gray-800">Dual-Control Withdrawal Safety</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0F1C3F]/5 p-8 sm:p-12 rounded-2xl border border-[#0F1C3F]/10">
            <h3 className="text-xl font-bold text-[#0F1C3F] mb-6">Core Operating Principles</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#0F1C3F] text-[#C9A84C] flex items-center justify-center flex-shrink-0 font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Fiduciary Rigor</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Every asset allocation undergoes underwriting verification, asset collateralization audits, and downside stress tests prior to syndication.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#0F1C3F] text-[#C9A84C] flex items-center justify-center flex-shrink-0 font-bold">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Clear Projections vs. Guarantees</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    We strictly uphold truth in financial advertising. Projected returns are clearly labeled as estimates; performance risks are documented without evasion.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#0F1C3F] text-[#C9A84C] flex items-center justify-center flex-shrink-0 font-bold">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Segregated Accounts</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Investor principal and operating capital are segregated in compliance with top-tier financial custody standards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="bg-gray-50 py-20 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#C9A84C] text-sm font-semibold tracking-wider uppercase block mb-3">Executive Team</span>
            <h2 className="text-3xl font-bold text-[#0F1C3F] mb-4">Leadership With Proven Fiduciary Pedigree</h2>
            <p className="text-gray-600">
              Our officers bring decades of combined leadership from global investment institutions, corporate securities law, and enterprise financial risk management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {leadership.map((leader, i) => (
              <div key={i} className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-full bg-[#0F1C3F] text-[#C9A84C] flex items-center justify-center text-xl font-bold mb-6">
                  {leader.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{leader.name}</h3>
                <p className="text-xs font-semibold text-[#C9A84C] mb-3">{leader.role}</p>
                <p className="text-xs text-gray-500 font-mono mb-4">{leader.credentials}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{leader.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Track Record & Milestones */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[#C9A84C] text-sm font-semibold tracking-wider uppercase block mb-3">Verified Progress</span>
          <h2 className="text-3xl font-bold text-[#0F1C3F] mb-4">Our Evolutionary Journey</h2>
          <p className="text-gray-600">Built deliberately with compliance, security, and capital preservation at each juncture.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {milestones.map((m, i) => (
            <div key={i} className="border-l-2 border-[#C9A84C] pl-6 py-2">
              <span className="text-2xl font-bold text-[#0F1C3F] block mb-2">{m.year}</span>
              <h4 className="text-base font-semibold text-gray-900 mb-2">{m.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{m.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Legal & Governance Notice */}
      <section className="bg-gray-100 py-12 border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong>Substantiation Notice:</strong> Union Verify operates in compliance with commercial registry and financial disclosure standards. All corporate filings, executive accreditations, and annual audit summaries are available upon verified investor request. Offers are subject to eligibility confirmation in approved legal jurisdictions.
          </p>
          <div className="mt-6 flex justify-center gap-6 text-xs text-gray-600 font-medium">
            <Link href="/documents" className="text-[#0F1C3F] hover:underline">Official Offer Documents</Link>
            <span>•</span>
            <Link href="/investments" className="text-[#0F1C3F] hover:underline">Available Opportunities</Link>
            <span>•</span>
            <Link href="/contact" className="text-[#0F1C3F] hover:underline">Compliance Inquiry Desk</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
