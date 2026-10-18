'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Briefcase,
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Award,
  PiggyBank,
  HeartHandshake,
  MessageSquareHeart,
  MessageSquare,
  Users,
  Heart,
  Flame,
  Gift,
  User,
} from 'lucide-react'
import { FloatingChatWidget } from '@/components/investor/FloatingChatWidget'

// ---------------------------------------------------------------------------
// Nav items
// ---------------------------------------------------------------------------
const navItems = [
  { href: '/dashboard',     label: 'Dashboard',              icon: LayoutDashboard },
  { href: '/quests',        label: 'Daily Quests',           icon: Flame, badge: 'Streak' },
  { href: '/registry',      label: 'Wedding Registry',       icon: Gift, badge: 'Gifts' },
  { href: '/chat',          label: 'Mutual Chat',            icon: MessageSquareHeart, badge: 'Live' },
  { href: '/savings',       label: 'Marriage Savings',       icon: PiggyBank },
  { href: '/certificate',   label: 'Marriage Certificate',   icon: Award },
  { href: '/get-married',   label: 'Get Married (Register)', icon: HeartHandshake },
  { href: '/friends',       label: 'Friends & Fanbase',      icon: Users, badge: 'New' },
  { href: '/community',     label: 'Community Giving',       icon: Heart, badge: 'Impact' },
  { href: '/portfolio',     label: 'Portfolio',              icon: Briefcase },
  { href: '/solo',          label: 'Solo Invest',            icon: User, badge: 'New' },
  { href: '/transactions',  label: 'Transactions',           icon: ArrowLeftRight },
  { href: '/save',          label: 'Save',                   icon: PiggyBank },
  { href: '/withdrawals',   label: 'Withdrawals',            icon: ArrowUpFromLine },
  { href: '/my-documents',  label: 'Documents',              icon: FileText },
  { href: '/settings',      label: 'Settings',               icon: Settings },
] as const


// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------
function Sidebar({
  pathname,
  user,
  onClose,
}: {
  pathname: string
  user: { name?: string | null; email?: string | null }
  onClose?: () => void
}) {
  const initials = (user.name ?? 'IN')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <aside className="flex h-full w-64 flex-col bg-[#0F1C3F] text-white">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="text-[#C9A84C] text-xl font-bold tracking-tight">Union</span>
          <span className="text-white text-xl font-light tracking-tight">Invest</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded p-1 text-white/60 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const { href, label, icon: Icon } = item
          const badge = 'badge' in item ? (item as unknown as { badge?: string }).badge : undefined
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#C9A84C]/20 text-[#C9A84C]'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} className={active ? 'text-[#C9A84C]' : 'text-white/50 group-hover:text-white'} />
              <span className="truncate">{label}</span>
              {badge && !active && (
                <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#C9A84C] text-[#0F1C3F] uppercase tracking-wide">
                  {badge}
                </span>
              )}
              {active && <ChevronRight size={14} className="ml-auto text-[#C9A84C]" />}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#C9A84C] text-sm font-bold text-[#0F1C3F]">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user.name ?? 'Investor'}</p>
            <p className="truncate text-xs text-white/50">{user.email ?? ''}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
export default function InvestorLayout({ children }: { children: React.ReactNode }) {
  const sessionContext = useSession()
  const session = sessionContext?.data
  const status = sessionContext?.status ?? 'loading'
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const user = session?.user || {
    name: 'Jane Doe',
    email: 'jane.doe@unionverify.com',
    role: 'INVESTOR' as const,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar pathname={pathname} user={user} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="relative z-50 flex h-full w-64 shadow-2xl">
            <Sidebar pathname={pathname} user={user} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-1">
            <span className="text-[#0F1C3F] font-bold tracking-tight">Union</span>
            <span className="text-[#C9A84C] font-bold tracking-tight">Invest</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/chat"
              className="relative p-1.5 rounded-lg text-slate-600 hover:text-[#0F1C3F] hover:bg-slate-100 transition-colors"
              title="Mutual Chat"
            >
              <MessageSquare size={19} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F1C3F] text-xs font-bold text-[#C9A84C]">
              {(user.name ?? 'IN')
                .split(' ')
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full min-w-0 relative">
          <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-5 sm:py-6 w-full min-w-0">{children}</div>

          {/* Floating Mutual Chat Dock (positioned at bottom-right across dashboard pages) */}
          <FloatingChatWidget partnerName="Marcus Vance" />
        </main>
      </div>
    </div>
  )
}
