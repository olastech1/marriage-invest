'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const navLinks = [
  { label: 'Investment Opportunities', href: '/investments' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Offer Documents', href: '/documents' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : href.startsWith('/#') ? false : pathname.startsWith(href)

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0F1C3F]/98 backdrop-blur-md shadow-lg shadow-black/25'
            : 'bg-[#0F1C3F]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo with Interlocking Rings */}
            <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
              <div className="relative w-9 h-7 flex-shrink-0 flex items-center justify-center">
                <svg
                  width="36"
                  height="28"
                  viewBox="0 0 38 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-9 h-7 block"
                  style={{ width: 36, height: 28, maxWidth: 36, maxHeight: 28 }}
                >
                  {/* Left Ring */}
                  <ellipse
                    cx="14"
                    cy="14"
                    rx="10"
                    ry="10"
                    stroke="#C9A84C"
                    strokeWidth="2.5"
                  />
                  {/* Small Diamond Accent on left ring */}
                  <polygon
                    points="14,2 17,6 14,9 11,6"
                    fill="#C9A84C"
                  />
                  {/* Right Overlapping Ring */}
                  <ellipse
                    cx="24"
                    cy="14"
                    rx="10"
                    ry="10"
                    stroke="#C9A84C"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
              <span className="text-white font-bold text-xl lg:text-2xl tracking-tight">
                Union <span className="font-semibold text-white">Invest</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive(link.href)
                      ? 'text-[#C9A84C]'
                      : 'text-gray-200 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white border border-white/30 rounded-lg hover:bg-white/10 hover:border-white transition-all duration-200"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 text-sm font-semibold text-[#0F1C3F] bg-[#C9A84C] rounded-lg hover:bg-[#d4b460] active:scale-95 transition-all duration-200 shadow-md shadow-[#C9A84C]/20"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Actions: Hamburger + Sign In */}
            <div className="lg:hidden flex items-center gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-2 rounded-md text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Open navigation menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-semibold text-white border border-white/30 rounded-lg hover:bg-white/10"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-[#0F1C3F] shadow-2xl z-10 flex flex-col p-6 animate-slide-up">
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <span className="text-white font-bold text-lg">Union Invest</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-base font-medium text-gray-200 hover:text-[#C9A84C] py-2 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="pt-6 border-t border-white/10 space-y-3">
              <Link
                href="/login"
                className="block w-full py-2.5 text-center text-sm font-semibold text-white border border-white/20 rounded-xl hover:bg-white/5"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="block w-full py-2.5 text-center text-sm font-bold text-[#0F1C3F] bg-[#C9A84C] rounded-xl hover:bg-[#d4b460]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
