'use client'

/**
 * Admin navigation: grouped sidebar (desktop + phone drawer) and a phone tab
 * bar. The admin area is only reachable with the ADMIN role.
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
  Menu,
  ExternalLink,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

export interface AdminNavItem {
  label: string
  href: string
  icon: React.ElementType
}

export const ADMIN_NAV_GROUPS: { title: string | null; items: AdminNavItem[] }[] = [
  { title: null, items: [{ label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }] },
  {
    title: 'Members & money',
    items: [
      { label: 'Investors', href: '/admin/investors', icon: Users },
      { label: 'Withdrawals', href: '/admin/withdrawals', icon: ArrowDownToLine },
      { label: 'Transactions', href: '/admin/transactions', icon: CreditCard },
    ],
  },
  {
    title: 'Offerings',
    items: [
      { label: 'Investments', href: '/admin/investments', icon: TrendingUp },
      { label: 'Documents', href: '/admin/documents', icon: FileText },
    ],
  },
  {
    title: 'Insights & system',
    items: [
      { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
]

const TABS: AdminNavItem[] = [
  { label: 'Home', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Withdrawals', href: '/admin/withdrawals', icon: ArrowDownToLine },
  { label: 'Investors', href: '/admin/investors', icon: Users },
  { label: 'Investments', href: '/admin/investments', icon: TrendingUp },
]

export function isAdminActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

export function adminPageTitle(pathname: string): string {
  for (const group of ADMIN_NAV_GROUPS) {
    for (const item of group.items) if (isAdminActive(pathname, item.href)) return item.label
  }
  return 'Admin'
}

function CountBadge({ count, light = false }: { count: number; light?: boolean }) {
  if (count <= 0) return null
  return (
    <span
      className={cn(
        'ml-auto min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center',
        light ? 'bg-[#0F1C3F] text-white' : 'bg-rose-500 text-white',
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

interface Props {
  pendingWithdrawals: number
  mobileOpen?: boolean
  onOpenMobile?: () => void
  onCloseMobile?: () => void
}

export default function AdminSidebar({ pendingWithdrawals, mobileOpen = false, onOpenMobile, onCloseMobile }: Props) {
  const pathname = usePathname()

  const renderContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between h-16 px-5 border-b border-white/10">
        <Link href="/admin/dashboard" onClick={() => isMobile && onCloseMobile?.()} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#C9A84C] flex items-center justify-center flex-shrink-0">
            <span className="text-[#0F1C3F] font-bold text-xs">UV</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-wide text-white leading-tight">Union Verify</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Admin</span>
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

      <nav className="flex-1 py-4 overflow-y-auto px-3 space-y-5" aria-label="Admin navigation">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.title ?? 'home'} className="space-y-1">
            {group.title && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 block mb-1">{group.title}</span>
            )}
            {group.items.map((item) => {
              const Icon = item.icon
              const active = isAdminActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isMobile && onCloseMobile?.()}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                    active ? 'bg-[#C9A84C] text-[#0F1C3F] shadow-sm font-bold' : 'text-gray-300 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-[#0F1C3F]' : 'text-gray-400')} />
                  <span>{item.label}</span>
                  {item.href === '/admin/withdrawals' && <CountBadge count={pendingWithdrawals} light={active} />}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0 text-gray-400" />
          <span>View public site</span>
        </Link>
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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:top-0 lg:left-0 lg:h-full lg:z-30 lg:w-64 bg-[#0F1C3F] text-white shadow-2xl">
        {renderContent(false)}
      </aside>

      {/* Phone drawer ("More") */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <aside className="relative z-50 w-72 max-w-[85vw] h-full bg-[#0F1C3F] text-white shadow-2xl">{renderContent(true)}</aside>
        </div>
      )}

      {/* Phone tab bar */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]"
        aria-label="Admin main"
      >
        <div className="grid grid-cols-5 h-16">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = isAdminActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold',
                  active ? 'text-[#0F1C3F]' : 'text-gray-400',
                )}
              >
                <Icon className={cn('w-5 h-5', active && 'text-[#C9A84C]')} />
                {label}
                {href === '/admin/withdrawals' && pendingWithdrawals > 0 && (
                  <span className="absolute top-1.5 right-[calc(50%-20px)] min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {pendingWithdrawals > 9 ? '9+' : pendingWithdrawals}
                  </span>
                )}
              </Link>
            )
          })}
          <button onClick={onOpenMobile} className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-gray-400">
            <Menu className="w-5 h-5" />
            More
          </button>
        </div>
      </nav>
    </>
  )
}
