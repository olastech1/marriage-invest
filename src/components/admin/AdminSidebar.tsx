'use client'

/**
 * AdminSidebar – role-aware navigation panel.
 *
 * Shown roles:
 *  ADMIN      → all items
 *  FINANCE    → Dashboard, Investments, Transactions, Withdrawals, Reports
 *  COMPLIANCE → Dashboard, Investors, Documents
 *  SUPPORT    → Dashboard, Investors, Transactions
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  CreditCard,
  ArrowDownToLine,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  X,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

type AdminRole = 'ADMIN' | 'FINANCE' | 'COMPLIANCE' | 'SUPPORT'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles: AdminRole[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'FINANCE', 'COMPLIANCE', 'SUPPORT'],
  },
  {
    label: 'Investors',
    href: '/admin/investors',
    icon: Users,
    roles: ['ADMIN', 'COMPLIANCE', 'SUPPORT'],
  },
  {
    label: 'Investments',
    href: '/admin/investments',
    icon: TrendingUp,
    roles: ['ADMIN', 'FINANCE'],
  },
  {
    label: 'Transactions',
    href: '/admin/transactions',
    icon: CreditCard,
    roles: ['ADMIN', 'FINANCE', 'SUPPORT'],
  },
  {
    label: 'Withdrawals',
    href: '/admin/withdrawals',
    icon: ArrowDownToLine,
    roles: ['ADMIN', 'FINANCE'],
  },
  {
    label: 'Documents',
    href: '/admin/documents',
    icon: FileText,
    roles: ['ADMIN', 'COMPLIANCE'],
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
    roles: ['ADMIN', 'FINANCE'],
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: ['ADMIN'],
  },
]

const ROLE_BADGE_COLOR: Record<AdminRole, string> = {
  ADMIN: 'bg-red-500',
  FINANCE: 'bg-emerald-500',
  COMPLIANCE: 'bg-purple-500',
  SUPPORT: 'bg-sky-500',
}

interface Props {
  role: AdminRole
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

export default function AdminSidebar({ role, mobileOpen = false, onCloseMobile }: Props) {
  const pathname = usePathname()
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  const renderContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Logo & close button (on mobile) */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-white/10">
        <Link
          href="/admin/dashboard"
          onClick={() => isMobile && onCloseMobile?.()}
          className="flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-lg bg-[#C9A84C] flex items-center justify-center flex-shrink-0 shadow-xs">
            <span className="text-[#0F1C3F] font-bold text-xs">UI</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-wide text-white leading-tight">
              Union Verify
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">
              Admin Suite
            </span>
          </div>
        </Link>

        {isMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role badge */}
      <div className="px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">
            Access Role
          </span>
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider',
              ROLE_BADGE_COLOR[role],
            )}
          >
            {role}
          </span>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 py-4 overflow-y-auto px-3 space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 block mb-2">
          Management
        </span>
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && onCloseMobile?.()}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                isActive
                  ? 'bg-[#C9A84C] text-[#0F1C3F] shadow-sm font-bold'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-[#0F1C3F]' : 'text-gray-400')} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── DESKTOP SIDEBAR: Docked permanently on >= lg screens, hidden on mobile ── */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:top-0 lg:left-0 lg:h-full lg:z-30 lg:w-64 bg-[#0F1C3F] text-white shadow-2xl">
        {renderContent(false)}
      </aside>

      {/* ── MOBILE DRAWER: Only visible on mobile when toggled ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Slide-out Drawer */}
          <aside className="relative z-50 w-72 max-w-[85vw] h-full bg-[#0F1C3F] text-white shadow-2xl animate-in slide-in-from-left duration-200">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  )
}
