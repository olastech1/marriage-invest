'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

interface NavItem {
  label: string
  href: string
  badge?: string
}

const primaryNavLinks: NavItem[] = [
  { label: 'Get Married', href: '/get-married', badge: 'New' },
  { label: 'Certificate', href: '/#certificate' },
  { label: 'Wedding Registry', href: '/registry', badge: 'Gifts' },
  { label: 'Opportunities', href: '/investments' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Community', href: '/community', badge: 'Impact' },
]

const moreNavLinks: NavItem[] = [
  { label: 'Offer Documents', href: '/documents' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact Support', href: '/contact' },
  { label: 'Frequently Asked Questions', href: '/faq' },
]

const allMobileLinks: NavItem[] = [
  { label: 'Get Married', href: '/get-married', badge: 'New' },
  { label: 'Union Certificate', href: '/#certificate' },
  { label: 'Wedding Registry', href: '/registry', badge: 'Gifts' },
  { label: 'Investment Opportunities', href: '/investments' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Community Fund', href: '/community', badge: 'Impact' },
  { label: 'Offer Documents', href: '/documents' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact Support', href: '/contact' },
  { label: 'FAQ', href: '/faq' },
]

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setDrawerOpen(false)
    setMoreOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
          <div className="flex items-center justify-between h-16 lg:h-20 gap-2">
            {/* Logo with Interlocking Rings */}
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group flex-shrink-0 mr-2 xl:mr-6">
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
              <span className="text-white font-bold text-xl lg:text-2xl tracking-tight whitespace-nowrap">
                Union <span className="font-semibold text-[#C9A84C]">Verify</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-3 xl:gap-5 flex-shrink-0">
              {primaryNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs xl:text-sm font-medium transition-colors duration-200 inline-flex items-center whitespace-nowrap py-1 ${
                    isActive(link.href)
                      ? 'text-[#C9A84C]'
                      : 'text-gray-200 hover:text-white'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#C9A84C] text-[#0F1C3F] uppercase tracking-wide flex-shrink-0">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}

              {/* More Dropdown */}
              <div className="relative" ref={moreRef}>
                <button
                  type="button"
                  onClick={() => setMoreOpen(!moreOpen)}
                  className="text-xs xl:text-sm font-medium text-gray-200 hover:text-white transition-colors duration-200 inline-flex items-center gap-1 py-1 whitespace-nowrap"
                >
                  <span>More</span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {moreOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0F1C3F] border border-white/15 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {moreNavLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={`block px-4 py-2.5 text-xs font-semibold transition-colors ${
                          isActive(item.href)
                            ? 'text-[#C9A84C] bg-white/5'
                            : 'text-gray-200 hover:text-[#C9A84C] hover:bg-white/5'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Desktop Auth Buttons */}
            {session?.user ? (
              <div className="hidden lg:flex items-center gap-3 flex-shrink-0 ml-2">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-xs xl:text-sm font-bold text-[#0F1C3F] bg-[#C9A84C] rounded-lg hover:bg-[#d4b460] active:scale-95 transition-all duration-200 shadow-md shadow-[#C9A84C]/20 flex items-center gap-2 whitespace-nowrap"
                >
                  <div className="w-5 h-5 rounded-full bg-[#0F1C3F] text-[#C9A84C] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {(session.user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span>Dashboard</span>
                </Link>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2 xl:gap-3 flex-shrink-0 ml-2">
                <Link
                  href="/login"
                  className="px-3 xl:px-4 py-2 text-xs xl:text-sm font-medium text-white border border-white/30 rounded-lg hover:bg-white/10 hover:border-white transition-all duration-200 whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 xl:px-5 py-2 text-xs xl:text-sm font-semibold text-[#0F1C3F] bg-[#C9A84C] rounded-lg hover:bg-[#d4b460] active:scale-95 transition-all duration-200 shadow-md shadow-[#C9A84C]/20 whitespace-nowrap"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Actions: Hamburger + Action Button */}
            <div className="lg:hidden flex items-center gap-2.5">
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-2 rounded-md text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Open navigation menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {session?.user ? (
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 text-xs font-bold text-[#0F1C3F] bg-[#C9A84C] rounded-lg hover:bg-[#d4b460] shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-white border border-white/30 rounded-lg hover:bg-white/10 whitespace-nowrap"
                >
                  Sign In
                </Link>
              )}
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
          <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-[#0F1C3F] shadow-2xl z-10 flex flex-col p-6 animate-slide-up overflow-y-auto">
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-lg tracking-tight">
                  Union <span className="text-[#C9A84C]">Verify</span>
                </span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 text-gray-400 hover:text-white"
                aria-label="Close navigation menu"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 py-6 space-y-3">
              {allMobileLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between text-sm font-medium text-gray-200 hover:text-[#C9A84C] py-2 transition-colors"
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#C9A84C] text-[#0F1C3F] uppercase tracking-wide">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            <div className="pt-6 border-t border-white/10 space-y-3">
              {session?.user ? (
                <>
                  <div className="px-1 text-xs text-gray-300">
                    Signed in as <strong className="text-white">{session.user.name || 'Investor'}</strong>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block w-full py-2.5 text-center text-sm font-bold text-[#0F1C3F] bg-[#C9A84C] rounded-xl hover:bg-[#d4b460]"
                  >
                    Go to Dashboard
                  </Link>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
