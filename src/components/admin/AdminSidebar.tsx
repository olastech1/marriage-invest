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
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  CreditCard,
  ArrowDownToLine,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
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
}

export default function AdminSidebar({ role }: Props) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <>
      {/* ── Mobile overlay backdrop ─────────────────────────────── */}
      <div className="lg:hidden fixed inset-0 z-20 bg-black/40 hidden" />

      {/* ── Sidebar panel ───────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-30 flex flex-col',
          'bg-[#0F1C3F] text-white shadow-2xl transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        {/* Logo + collapse toggle */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          {!collapsed && (
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#C9A84C] flex items-center justify-center flex-shrink-0">
                <span className="text-[#0F1C3F] font-bold text-xs">UI</span>
              </div>
              <span className="font-bold text-sm tracking-wide text-white">
                Union Invest
              </span>
            </Link>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-[#C9A84C] mx-auto flex items-center justify-center">
              <span className="text-[#0F1C3F] font-bold text-xs">UI</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              'ml-auto p-1 rounded hover:bg-white/10 transition-colors',
              collapsed && 'mx-auto',
            )}
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-white/10">
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-white',
                ROLE_BADGE_COLOR[role],
              )}
            >
              {role}
            </span>
            <p className="text-xs text-gray-400 mt-1">Admin Portal</p>
          </div>
        )}

        {/* Navigation items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {visibleItems.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin/dashboard' &&
                  pathname.startsWith(item.href))

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#C9A84C] text-[#0F1C3F]'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white',
                      collapsed && 'justify-center px-2',
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Sign out */}
        <div className="px-2 py-4 border-t border-white/10">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
              'text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors',
              collapsed && 'justify-center px-2',
            )}
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
