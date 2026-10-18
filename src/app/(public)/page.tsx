import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import {
  Shield,
  Lock,
  ArrowRight,
  CheckCircle2,
  FileText,
  HelpCircle,
  TrendingUp,
  Users,
  Award,
  Heart,
  Mail,
  FileCheck,
  CreditCard,
  Download,
  Sparkles,
  Check,
  PiggyBank,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Union Verify — Marriage Investment Platform',
  description:
    'The premier Marriage Investment Platform. One partner registers, invites their spouse, signs the digital Marriage Certificate, and unlocks shared high-yield USD investments.',
}

export const dynamic = 'force-dynamic'

const FALLBACK_OPPORTUNITIES = [
  {
    id: 'f1',
    slug: 'matrimonial-prime-yield-fund-i',
    title: 'Matrimonial Prime Yield Fund I',
    shortDescription: 'Senior-secured credit portfolio supporting verified wedding event venues & prime hospitality assets.',
    status: 'ACTIVE',
    annualReturnRate: 0.108,
    fundedAmount: 320000,
    targetAmount: 500000,
    minAmount: 1000,
    termMonths: 24,
    distributionType: 'QUARTERLY',
  },
  {
    id: 'f2',
    slug: 'marital-homestead-growth-notes-v',
    title: 'Marital Homestead Growth Notes V',
    shortDescription: 'First-lien residential acquisition notes tailored for married couples entering long-term property ownership.',
    status: 'ACTIVE',
    annualReturnRate: 0.084,
    fundedAmount: 512000,
    targetAmount: 800000,
    minAmount: 2500,
    termMonths: 36,
    distributionType: 'MONTHLY',
  },
  {
    id: 'f3',
    slug: 'enduring-union-balanced-portfolio',
    title: 'Enduring Union Balanced Portfolio',
    shortDescription: 'Multi-asset liquidity fund providing capital preservation with balanced dividend yields.',
    status: 'ACTIVE',
    annualReturnRate: 0.069,
    fundedAmount: 195000,
    targetAmount: 300000,
    minAmount: 500,
    termMonths: 12,
    distributionType: 'ANNUAL',
  },
]

export default async function HomePage() {
  let opportunities: any[] = []
  try {
    opportunities = await prisma.investmentOpportunity.findMany({
      where: {
        status: { not: 'DRAFT' },
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    // Database offline or build-time prerendering fallback
  }

  if (!opportunities || opportunities.length === 0) {
    opportunities = FALLBACK_OPPORTUNITIES
  }

  return (
    <div className="bg-white min-h-screen">
      {/* ── HERO SECTION ── */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-24 bg-white relative overflow-hidden">
        {/* Subtle decorative radial background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-[#0F1C3F]/[0.03] to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#0F1C3F] text-xs font-bold uppercase tracking-wider mb-6">
            <Heart className="w-3.5 h-3.5 text-[#C9A84C] fill-[#C9A84C]" />
            The World&apos;s First Marriage Investment Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#0F1C3F] tracking-tight leading-[1.15] mb-6">
            Invest in Your Marriage. <br className="hidden sm:inline" />
            <span className="text-[#C9A84C]">Build Generational Wealth As One.</span>
          </h1>

          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            One partner registers and invites their spouse. Together, both partners digitally sign your official <strong>Marriage Investment Certificate</strong>. Settle your registration fee to unlock and download your certified legal bond, then deploy shared capital into high-yield USD funds.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link
              href="/register"
              className="w-full sm:w-auto px-7 py-3.5 text-sm sm:text-base font-bold text-[#0F1C3F] bg-[#C9A84C] rounded-xl hover:bg-[#d4b460] active:scale-95 transition-all shadow-lg shadow-[#C9A84C]/25"
            >
              Start Marriage Account
            </Link>
            <Link
              href="#certificate"
              className="w-full sm:w-auto px-7 py-3.5 text-sm sm:text-base font-semibold text-[#0F1C3F] bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
            >
              View Certificate
            </Link>
          </div>

          {/* Workflow Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left text-xs text-gray-700 pt-4">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">1. Register Account</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
              <Mail className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
              <span className="font-medium">2. Invite Spouse</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
              <Award className="w-4 h-4 text-[#0F1C3F] flex-shrink-0" />
              <span className="font-medium">3. Sign Certificate</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
              <Lock className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
              <span className="font-medium">4. Pay & Download</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS BAR ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="flex flex-col items-center justify-center pt-4 md:pt-0">
              <span className="text-3xl sm:text-4xl font-bold text-[#0F1C3F] tracking-tight mb-1">
                $2.4M+
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-500">
                Couples Capital Funded
              </span>
            </div>

            <div className="flex flex-col items-center justify-center pt-4 md:pt-0">
              <span className="text-3xl sm:text-4xl font-bold text-[#0F1C3F] tracking-tight mb-1">
                680+
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-500">
                Certificates Issued
              </span>
            </div>

            <div className="flex flex-col items-center justify-center pt-4 md:pt-0">
              <span className="text-3xl sm:text-4xl font-bold text-[#0F1C3F] tracking-tight mb-1">
                50/50
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-500">
                Joint Beneficial Rights
              </span>
            </div>

            <div className="flex flex-col items-center justify-center pt-4 md:pt-0">
              <span className="text-3xl sm:text-4xl font-bold text-[#0F1C3F] tracking-tight mb-1">
                94%
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-500">
                On-Time Distributions
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE 5-STEP PARTNER JOURNEY ── */}
      <section id="how-it-works" className="bg-gray-50 py-20 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider block mb-2">
              The Couple Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F1C3F] mb-4">
              How Marriage Investment Works
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Designed from the ground up for marital unity. Our seamless five-step process guarantees dual legal consent, mutual asset protection, and financial prosperity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: '01',
                title: 'First Partner Registers',
                description:
                  'One spouse opens the marriage account with email, name, and basic contact verification in under two minutes.',
                icon: Users,
              },
              {
                step: '02',
                title: 'Invite Your Spouse',
                description:
                  'Send a direct, encrypted digital invite to your partner to connect their identity to the joint investment bond.',
                icon: Mail,
              },
              {
                step: '03',
                title: 'Sign Joint Certificate',
                description:
                  'Both spouses review the legal matrimonial investment agreement and record their verified digital signatures.',
                icon: FileCheck,
              },
              {
                step: '04',
                title: 'Pay Fiduciary Fees',
                description:
                  'Complete the $500 marriage registration fee and $500 official certificate fee to legally docket and download your certified gold-trimmed document.',
                icon: Lock,
              },
              {
                step: '05',
                title: 'Deploy & Earn Together',
                description:
                  'Deposit joint capital into institutional USD yield funds with contractual monthly or quarterly distributions.',
                icon: TrendingUp,
              },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative group hover:border-[#C9A84C] hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-serif font-bold text-gray-300 group-hover:text-[#C9A84C] transition-colors">
                        {s.step}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-[#0F1C3F]/5 flex items-center justify-center text-[#0F1C3F] group-hover:bg-[#C9A84C]/15 group-hover:text-[#C9A84C] transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-[#0F1C3F] mb-2 leading-snug">
                      {s.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── THE OFFICIAL MARRIAGE INVESTMENT CERTIFICATE SHOWCASE ── */}
      <section id="certificate" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider block mb-2">
            Matrimonial Fiduciary Seal
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0F1C3F] mb-4">
            The Official Marriage Investment Certificate
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Your physical and digital proof of joint commitment. Both partners sign digitally, and payment of the $500 registration fee and $500 certificate fee seals your legal status, unlocks full PDF downloads, and activates joint portfolio funding.
          </p>
        </div>

        {/* Certificate Display Mockup with Paywall Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Certificate Visual (8 cols) */}
          <div className="lg:col-span-8 relative">
            <div className="relative bg-[#FCFBF7] rounded-3xl p-6 sm:p-12 border-4 border-double border-[#C9A84C] shadow-2xl overflow-hidden text-center">
              {/* Corner Ornaments */}
              <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#C9A84C]" />
              <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#C9A84C]" />
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[#C9A84C]" />
              <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[#C9A84C]" />

              {/* Watermark Ribbon */}
              <div className="absolute inset-0 bg-white/20 backdrop-blur-[0.5px] pointer-events-none z-10 flex items-center justify-center">
                <div className="transform -rotate-12 px-6 py-3 border-2 border-dashed border-red-500/70 rounded-xl bg-white/95 shadow-xl text-center">
                  <span className="text-red-600 font-extrabold text-sm sm:text-base tracking-widest uppercase block">
                    $500 REGISTRATION / $500 CERTIFICATE
                  </span>
                  <span className="text-[10px] text-gray-600 font-medium">
                    PAY FEES TO UNLOCK HIGH-RES PDF & GOLD SEAL
                  </span>
                </div>
              </div>

              {/* Emblem */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-9 flex items-center justify-center">
                  <svg width="48" height="36" viewBox="0 0 38 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="14" cy="14" rx="10" ry="10" stroke="#C9A84C" strokeWidth="2.5" />
                    <polygon points="14,2 17,6 14,9 11,6" fill="#C9A84C" />
                    <ellipse cx="24" cy="14" rx="10" ry="10" stroke="#C9A84C" strokeWidth="2.5" />
                  </svg>
                </div>
              </div>

              <span className="text-[10px] font-serif font-bold uppercase tracking-[0.25em] text-[#0F1C3F]/70 block mb-1">
                International Matrimonial Capital Registry · Zurich & London
              </span>

              <h3 className="text-xl sm:text-3xl font-serif font-bold text-[#0F1C3F] tracking-tight mb-2">
                Certificate of Marriage Investment
              </h3>

              <p className="text-xs font-serif italic text-gray-600 mb-6">
                Official Covenant of Shared Wealth & Mutual Survivorship
              </p>

              {/* Names Mockup */}
              <div className="my-6 py-4 border-y border-[#C9A84C]/30 max-w-lg mx-auto">
                <div className="flex items-center justify-center gap-4 text-center">
                  <div className="flex-1">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">First Spouse</span>
                    <span className="text-base sm:text-xl font-serif font-bold text-[#0F1C3F]">Amélie Laurent</span>
                  </div>
                  <span className="text-[#C9A84C] font-serif text-lg font-bold">&</span>
                  <div className="flex-1">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Second Spouse</span>
                    <span className="text-base sm:text-xl font-serif font-bold text-[#0F1C3F]">Sebastian Laurent</span>
                  </div>
                </div>
              </div>

              {/* Dual Signature Stems */}
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto items-end pt-2 text-[10px]">
                <div className="border-t border-gray-400 pt-1">
                  <p className="font-serif italic text-sm text-[#0F1C3F]">Amélie Laurent</p>
                  <span className="text-gray-500 font-bold uppercase">Partner 1</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full border-2 border-[#C9A84C] bg-gradient-to-tr from-[#C9A84C] to-[#edd998] flex items-center justify-center text-[#0F1C3F] shadow-sm">
                    <Award className="w-6 h-6" />
                  </div>
                  <span className="text-[8px] font-mono text-gray-500 mt-1">SEAL #CH-98420</span>
                </div>

                <div className="border-t border-gray-400 pt-1">
                  <p className="font-serif italic text-sm text-[#0F1C3F]">Sebastian Laurent</p>
                  <span className="text-gray-500 font-bold uppercase">Partner 2</span>
                </div>
              </div>
            </div>
          </div>

          {/* Paywall & Features Explanation (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0F1C3F] rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-4">
                <Lock className="w-3.5 h-3.5" />
                $500 Reg · $500 Cert
              </div>

              <h4 className="text-xl font-bold mb-3">
                Why Pay Registration & Certificate Fees?
              </h4>

              <p className="text-xs text-gray-300 leading-relaxed mb-6">
                The $500 registration fee covers legal filing and statutory affidavit check, while the $500 certificate fee permanently certifies your 50/50 joint ownership rights on the Union Verify registry.
              </p>

              <div className="space-y-3 mb-6">
                {[
                  'Removes all watermarks instantly',
                  'Unlocks high-resolution printable PDF',
                  'Permanent blockchain/ledger registration',
                  'Enables mutual fund deposit & withdrawals',
                  'Dual survivorship beneficial rights',
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-200">
                    <Check className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/get-married"
                className="w-full py-3.5 px-4 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 text-center"
              >
                Get Married & Register ($500)
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── UNION & PARTNERSHIP DIVERSITY RECOGNITION ── */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#C9A84C] block mb-1">
                Equal Legal & Fiduciary Protection
              </span>
              <h3 className="text-xl font-bold text-[#0F1C3F]">
                Full Recognition for All Marriages & Partnership Types
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 max-w-lg leading-relaxed">
              Union Verify provides full statutory survivorship entitlement and 50/50 capital custody across all recognized international unions, filed under Zurich & London fiduciary standards.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Gay Marriage', sub: 'Husband & Husband', badge: 'Same-Sex', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
              { label: 'Lesbian Marriage', sub: 'Wife & Wife', badge: 'Same-Sex', color: 'text-rose-600 bg-rose-50 border-rose-100' },
              { label: 'Civil Marriage', sub: 'Husband & Wife', badge: 'Opposite-Sex', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
              { label: 'Civil Union', sub: 'Partner & Partner', badge: 'Registered', color: 'text-blue-600 bg-blue-50 border-blue-100' },
              { label: 'Domestic Union', sub: 'Partner & Partner', badge: 'Cohabitation', color: 'text-amber-600 bg-amber-50 border-amber-100' },
              { label: 'Life Covenant', sub: 'Spouse & Spouse', badge: 'Universal', color: 'text-purple-600 bg-purple-50 border-purple-100' },
            ].map((u, i) => (
              <div key={i} className={`p-3.5 rounded-xl border transition-all hover:shadow-sm ${u.color}`}>
                <span className="text-[10px] font-extrabold uppercase tracking-wider block mb-1 opacity-80">
                  {u.badge}
                </span>
                <span className="text-xs font-bold text-[#0F1C3F] block leading-snug">
                  {u.label}
                </span>
                <span className="text-[11px] text-gray-500 block mt-0.5">
                  {u.sub}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── GET MARRIED SPOTLIGHT FOR UNMARRIED COUPLES ── */}
        <div className="mt-8 bg-gradient-to-r from-[#0F1C3F] via-[#162752] to-[#0F1C3F] rounded-3xl p-6 sm:p-10 text-white shadow-xl border border-white/10 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-3">
                <Heart className="w-3.5 h-3.5 fill-[#C9A84C]" />
                For Couples Who Have Never Married
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-3">
                Get Married Online & Solemnize Your Legal Union
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-6">
                Never been married before? Complete your first-time matrimonial application entirely online. File your legal single-status affidavit, receive statutory officiant solemnization, and get your certified marriage certificate with 50/50 joint wealth rights.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0 text-[#C9A84C] font-bold text-xs">
                    $500
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white">Marriage Registration Fee</span>
                    <span className="text-[11px] text-gray-400">Affidavit check, registry docketing & officiant assignment</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0 text-[#C9A84C] font-bold text-xs">
                    $500
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white">Certified Certificate Fee</span>
                    <span className="text-[11px] text-gray-400">24K gold embossed seal, lifetime PDF & physical archival print</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 flex-shrink-0">
              <Link
                href="/get-married"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-sm tracking-wide transition-all shadow-lg shadow-[#C9A84C]/20 text-center"
              >
                Get Married Online ($500)
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-[11px] text-gray-400 text-center">
                All-inclusive package available for $1,000
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── INVESTMENT OPPORTUNITIES PREVIEW ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider block mb-1">
              Joint Capital Opportunities
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F1C3F]">
              Current Marriage Investment Funds
            </h2>
          </div>
          <Link
            href="/investments"
            className="text-sm font-semibold text-[#C9A84C] hover:text-[#b08b3a] flex items-center gap-1.5"
          >
            View all opportunities <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opp) => {
            const funded = Number(opp.fundedAmount)
            const target = Number(opp.targetAmount)
            const pct = Math.min(100, Math.round((funded / target) * 100))
            const returnPct = (Number(opp.annualReturnRate) * 100).toFixed(1)

            return (
              <div
                key={opp.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-bold text-[#0F1C3F] leading-snug">
                      {opp.title}
                    </h3>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#C9A84C]/15 text-[#C9A84C] whitespace-nowrap">
                      {opp.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                    {opp.shortDescription}
                  </p>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-[#0F1C3F]">
                      {returnPct}%
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      Projected Return (p.a.)
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 mb-5">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Funding Progress</span>
                      <span className="font-semibold text-gray-900">{pct}% funded</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[#C9A84C] h-2.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 pb-5 border-b border-gray-100 mb-5">
                    <div>
                      <span className="text-gray-400 block">Min. Entry</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(Number(opp.minAmount))}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Tenure</span>
                      <span className="font-semibold text-gray-900">
                        {opp.termMonths} Months
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Distributions</span>
                      <span className="font-semibold text-gray-900 capitalize">
                        {opp.distributionType.toLowerCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Target Size</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(target)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/investments/${opp.slug}`}
                    className="flex-1 py-2.5 text-center text-xs font-semibold text-gray-700 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Fund Details
                  </Link>
                  <Link
                    href={`/register?redirect=/investments/${opp.slug}`}
                    className="flex-1 py-2.5 text-center text-xs font-bold text-[#0F1C3F] bg-[#C9A84C] hover:bg-[#d4b460] rounded-xl transition-colors shadow-sm"
                  >
                    Invest Now
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── MARRIAGE SAVINGS VAULT SHOWCASE ── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-[#0F1C3F] via-[#142654] to-[#0F1C3F] p-8 sm:p-14 text-white shadow-2xl border border-[#C9A84C]/30 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-bold uppercase tracking-wider">
                <PiggyBank className="w-3.5 h-3.5" />
                New: Marriage Savings Vaults · 6.8% APY
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
                Save Together for Life Milestones. <br />
                <span className="text-[#C9A84C]">Both Spouses Contribute. 100% Shared.</span>
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed max-w-xl">
                Whether you’re saving for a home down payment, family education fund, or an anniversary dream vacation, Union Verify lets both spouses deposit separately or split 50/50 while earning daily compounding 6.8% APY.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-[#C9A84C] block">Dual Contributions</span>
                  <span className="text-xs font-semibold text-white">Both Partners Save</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-[#C9A84C] block">High-Yield Interest</span>
                  <span className="text-xs font-semibold text-white">6.8% APY Compounding</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-[#C9A84C] block">Shared Milestones</span>
                  <span className="text-xs font-semibold text-white">Equal 50/50 Rights</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className="px-6 py-3.5 rounded-xl bg-[#C9A84C] text-[#0F1C3F] font-bold text-sm text-center hover:bg-[#d4b460] transition-colors shadow-md shadow-[#C9A84C]/25"
                >
                  Start Marriage Savings
                </Link>
                <Link
                  href="/certificate"
                  className="px-6 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm text-center hover:bg-white/15 transition-colors"
                >
                  View Certificate & Vaults
                </Link>
              </div>
            </div>

            {/* Savings Mockup Card */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 text-gray-900 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase">
                  Real Estate Vault
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> 6.8% APY
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-[#0F1C3F]">Family Home Down Payment</h4>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-[#0F1C3F]">$22,000</span>
                  <span className="text-xs text-gray-400">of $50,000 goal</span>
                  <span className="ml-auto text-xs font-bold text-[#C9A84C]">44% Funded</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
                  <div className="bg-indigo-600 h-full w-[23%]" title="Spouse 1" />
                  <div className="bg-[#C9A84C] h-full w-[21%]" title="Spouse 2" />
                </div>
                <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                  <span>Partner 1: $11,400</span>
                  <span>Partner 2: $10,600</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 text-xs text-gray-600 flex items-center justify-between">
                <span>Recent Deposit:</span>
                <span className="font-semibold text-emerald-700">+$400 (50/50 Joint Match)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ACCORDION ── */}
      <section className="bg-gray-50 py-20 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider block mb-2">
              Couples Clarity
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F1C3F] mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Clear answers regarding partner invitations, certificate signing, marriage registration and certificate fees, and joint investments.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'How does one partner invite their spouse?',
                a: 'Once the primary partner creates an account, they can enter their spouse’s name and email in their dashboard or share a secure invitation link. The partner clicks the link, connects their login credentials, and is immediately directed to review and co-sign the Marriage Investment Certificate.',
              },
              {
                q: 'What are the fees for marriage registration and certificates?',
                a: 'The $500 marriage registration fee covers formal registry filing, identity verification, background check, and international docket recording under Zurich and London Fiduciary Registry standards. The $500 certificate issuance fee validates your authenticated digital seal, removes all watermarks, unlocks high-resolution PDF downloads, and authorizes 50/50 mutual investment access. Couples can also select the $1,000 all-inclusive package at checkout.',
              },
              {
                q: 'Do both partners need to sign the certificate before investing?',
                a: 'Yes. To protect both spouses and maintain complete legal transparency, both digital signatures are required along with certificate payment before capital can be deposited into active marriage investment funds.',
              },
              {
                q: 'What currency does Union Verify operate in?',
                a: 'All platform transactions, investments, distributions, and certificate registry fees are denominated strictly in United States Dollars (USD $).',
              },
              {
                q: 'How are returns and distributions distributed between spouses?',
                a: 'Distributions are credited to the joint account ledger according to the fund schedule (monthly or quarterly). Both partners enjoy equal 50/50 beneficial entitlement and complete ledger visibility.',
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer text-sm font-semibold text-[#0F1C3F] hover:text-[#C9A84C] select-none list-none">
                  <span>{faq.q}</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">
                    ▾
                  </span>
                </summary>
                <div className="px-5 pb-5 text-xs text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0F1C3F] text-white pt-16 pb-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <span className="text-xl font-bold text-white tracking-tight">
                Union <span className="text-[#C9A84C]">Invest</span>
              </span>
              <p className="text-xs text-gray-400 leading-relaxed">
                The institutional-grade marriage investment platform facilitating transparent, joint wealth creation for couples.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#C9A84C] uppercase tracking-wider mb-4">
                Marriage Platform
              </h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>
                  <Link href="#certificate" className="hover:text-white transition-colors">
                    Marriage Certificate
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="hover:text-white transition-colors">
                    Partner Invite Process
                  </Link>
                </li>
                <li>
                  <Link href="/investments" className="hover:text-white transition-colors">
                    Investment Opportunities
                  </Link>
                </li>
                <li>
                  <Link href="/documents" className="hover:text-white transition-colors">
                    Offer Document Library
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#C9A84C] uppercase tracking-wider mb-4">
                Corporate & Legal
              </h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms & Joint Covenant
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Compliance Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#C9A84C] uppercase tracking-wider mb-4">
                Fiduciary Compliance
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Union Verify operates in compliance with relevant US financial registry and joint asset ownership guidelines. Capital at risk.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Union Verify. All rights reserved. Marriage Investment Platform.
          </div>
        </div>
      </footer>
    </div>
  )
}
