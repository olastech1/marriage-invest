import type { Metadata } from 'next'
import Link from 'next/link'
import { Target, Users, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us | Union Verify',
  description:
    'What Union Verify is and what it does: a joint savings and investment platform for couples.',
}

const features = [
  'Joint savings vaults both partners can deposit into',
  'Partner invitations and a co-signed Union Verify certificate',
  'Investment opportunities listed on the platform',
  'Wedding cash registry for gifts from family and friends',
]

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-[#0F1C3F] py-20 lg:py-28 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#C9A84C_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-semibold tracking-wider uppercase mb-6">
            About Union Verify
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Saving and Investing <span className="text-[#C9A84C]">as a Couple</span>
          </h1>
          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-gray-300 leading-relaxed font-light">
            Union Verify is a platform for couples who want to manage shared money in one place:
            saving towards joint goals, seeing each other&apos;s contributions, and investing together.
          </p>
        </div>
      </section>

      {/* Mission & Principles */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[#C9A84C] text-sm font-semibold tracking-wider uppercase block mb-3">What We Do</span>
            <h2 className="text-3xl font-bold text-[#0F1C3F] mb-6 leading-snug">
              One Account View for Two People
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Most financial tools are built for individuals. Union Verify is built around a couple:
              both partners have their own login and can see the same joint savings and investments.
              All amounts are in US dollars.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              {features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-gray-800">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0F1C3F]/5 p-8 sm:p-12 rounded-2xl border border-[#0F1C3F]/10">
            <h3 className="text-xl font-bold text-[#0F1C3F] mb-6">How We Present Information</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#0F1C3F] text-[#C9A84C] flex items-center justify-center flex-shrink-0 font-bold">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Projections Are Not Guarantees</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Projected returns and the vault rate are estimates and can change. Investing
                    carries risk, including the loss of the money you put in.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#0F1C3F] text-[#C9A84C] flex items-center justify-center flex-shrink-0 font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Both Partners Can See Everything</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Deposits into a joint vault are shown to both partners, including who contributed what.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Links */}
      <section className="bg-gray-100 py-12 border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-gray-500 leading-relaxed">
            Union Verify does not provide legal, tax or investment advice. If you have a question
            about the platform, please get in touch.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-gray-600 font-medium">
            <Link href="/documents" className="text-[#0F1C3F] hover:underline">Documents</Link>
            <span>•</span>
            <Link href="/investments" className="text-[#0F1C3F] hover:underline">Available Opportunities</Link>
            <span>•</span>
            <Link href="/contact" className="text-[#0F1C3F] hover:underline">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
