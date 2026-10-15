/**
 * Auth group layout – split-screen design.
 *
 * Left  → Navy panel with Union Invest logo + tagline (hidden on mobile)
 * Right → White card area that renders the child page (login / register / etc.)
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon, TrendingUpIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: {
    template: '%s | Union Invest',
    default: 'Union Invest',
  },
  description: 'The smart way to invest in your future together.',
}

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col relative overflow-hidden bg-[#0F1C3F]">
        {/* Decorative rings */}
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full border border-[#C9A84C]/10" />
        <div className="absolute -top-16 -left-16 w-[380px] h-[380px] rounded-full border border-[#C9A84C]/10" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full border border-[#C9A84C]/10" />
        <div className="absolute bottom-10 right-10 w-[320px] h-[320px] rounded-full border border-[#C9A84C]/10" />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(90deg, #C9A84C 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group w-fit">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#C9A84C]/20 border border-[#C9A84C]/40 group-hover:bg-[#C9A84C]/30 transition-colors">
              <TrendingUpIcon className="w-5 h-5 text-[#C9A84C]" />
            </div>
            <span className="text-xl font-semibold tracking-wide text-white">
              Union<span className="text-[#C9A84C]">Invest</span>
            </span>
          </Link>

          {/* Hero text */}
          <div className="mt-auto mb-auto pt-20">
            <p className="text-[#C9A84C] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              Grow Together
            </p>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Invest in your
              <br />
              <span className="text-[#C9A84C]">shared future.</span>
            </h1>
            <p className="mt-6 text-slate-400 text-lg leading-relaxed max-w-sm">
              Union Invest helps couples build wealth together — with joint
              portfolios, transparent returns, and goals that matter.
            </p>

            {/* Stats row */}
            <div className="mt-12 grid grid-cols-3 gap-6">
              {[
                { value: '$240M+', label: 'Assets under custody' },
                { value: '14,500+', label: 'Global partner portfolios' },
                { value: '18.4%', label: 'Avg. annualized return' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-[#C9A84C]">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-500 leading-snug">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer line */}
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} Union Invest Fiduciary AG · Zurich & London
          </p>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Mobile-only top bar */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0F1C3F]">
              <TrendingUpIcon className="w-4 h-4 text-[#C9A84C]" />
            </div>
            <span className="text-base font-semibold text-[#0F1C3F]">
              Union<span className="text-[#C9A84C]">Invest</span>
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0F1C3F] transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </Link>
        </div>

        {/* Page content */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Right-panel footer */}
        <div className="hidden lg:flex items-center justify-between px-10 py-4 border-t border-slate-100">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#0F1C3F] transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Back to home
          </Link>
          <p className="text-xs text-slate-400">
            Need help?{' '}
            <a
              href="mailto:support@unioninvest.ng"
              className="text-[#0F1C3F] hover:underline font-medium"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
