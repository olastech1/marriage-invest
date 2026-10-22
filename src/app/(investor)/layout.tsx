'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Briefcase,
  ArrowLeftRight,
  ArrowUpFromLine,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Award,
  PiggyBank,
  MessageSquareHeart,
  TrendingUp,
  Share2,
  ExternalLink,
} from 'lucide-react'
import { FloatingChatWidget } from '@/components/investor/FloatingChatWidget'
import NotificationBellDropdown from '@/components/investor/NotificationBellDropdown'

// ---------------------------------------------------------------------------
// Navigation (every item stays inside the member area)
// ---------------------------------------------------------------------------
type NavItem = { href: string; label: string; icon: typeof LayoutDashboard }
type NavGroup = { title: string | null; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  { title: null, items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    title: 'Money',
    items: [
      { href: '/save', label: 'Joint vault', icon: PiggyBank },
      { href: '/withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
      { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    ],
  },
  {
    title: 'Investing',
    items: [
      { href: '/portfolio', label: 'My portfolio', icon: Briefcase },
      { href: '/solo', label: 'Browse investments', icon: TrendingUp },
    ],
  },
  {
    title: 'Together',
    items: [
      { href: '/chat', label: 'Chat', icon: MessageSquareHeart },
      { href: '/certificate', label: 'Union & certificate', icon: Award },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/my-documents', label: 'Documents', icon: FileText },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

// Pages reached from inside other pages, mapped to the menu item they belong to
const PAGE_TITLES: Record<string, string> = {
  '/payment/complete': 'Payment',
  '/savings': 'Joint vault',
  '/deposits': 'Joint vault',
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

function pageTitle(pathname: string): string {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) if (isActive(pathname, item.href)) return item.label
  }
  return PAGE_TITLES[pathname] || 'Member area'
}

function initialsOf(name?: string | null) {
  return (name ?? 'Member')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
      {count > 9 ? '9+' : count}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Sidebar (desktop, and the "More" drawer on phones)
// ---------------------------------------------------------------------------
function Sidebar({
  pathname,
  user,
  publicBioUrl,
  unread,
  onClose,
}: {
  pathname: string
  user: { name?: string | null; email?: string | null }
  publicBioUrl: string | null
  unread: number
  onClose?: () => void
}) {
  return (
    <aside className="flex h-full w-64 flex-col bg-[#0F1C3F] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2">
          <span className="text-[#C9A84C] text-xl font-bold tracking-tight">Union</span>
          <span className="text-white text-xl font-light tracking-tight">Verify</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="rounded p-1 text-white/60 hover:text-white lg:hidden" aria-label="Close menu">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Member navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group.title ?? 'home'} className="space-y-0.5">
            {group.title && (
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">{group.title}</p>
            )}
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-[#C9A84C]' : 'text-white/50 group-hover:text-white'} />
                  <span className="truncate">{label}</span>
                  {href === '/chat' && <UnreadBadge count={unread} />}
                </Link>
              )
            })}
            {group.title === 'Account' && publicBioUrl && (
              <Link
                href={publicBioUrl}
                onClick={onClose}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Share2 size={18} className="text-white/50 group-hover:text-white" />
                <span className="truncate">Public profile</span>
                <ExternalLink size={13} className="ml-auto text-white/40" />
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#C9A84C] text-sm font-bold text-[#0F1C3F]">
            {initialsOf(user.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user.name ?? 'Member'}</p>
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
  const { data: session } = useSession()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [publicBioUrl, setPublicBioUrl] = useState<string | null>(null)
  const [unread, setUnread] = useState(0)

  // The member's own public profile URL (null until they choose a username)
  useEffect(() => {
    fetch('/api/user/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setPublicBioUrl(data?.user?.publicBioUrl ?? null))
      .catch(() => setPublicBioUrl(null))
  }, [])

  // Unread chat messages, for the Chat badge
  useEffect(() => {
    const load = () =>
      fetch('/api/chat?list=true')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const total = (data?.conversations || []).reduce((sum: number, c: { unreadCount?: number }) => sum + (c.unreadCount || 0), 0)
          setUnread(total)
        })
        .catch(() => {})
    load()
    const timer = setInterval(load, 20000)
    return () => clearInterval(timer)
  }, [pathname])

  const user = session?.user || { name: null, email: '' }
  const isChat = pathname === '/chat'
  const title = pageTitle(pathname)

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar pathname={pathname} user={user} publicBioUrl={publicBioUrl} unread={unread} />
      </div>

      {/* Phone menu drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="relative z-50 flex h-full w-64 shadow-2xl">
            <Sidebar pathname={pathname} user={user} publicBioUrl={publicBioUrl} unread={unread} onClose={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        {/* Top bar: page title + notifications */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:px-8 lg:py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-lg p-2 -ml-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="truncate text-base font-bold text-[#0F1C3F] lg:text-sm lg:font-semibold lg:text-slate-500">{title}</h1>
          </div>
          <div className="flex items-center gap-1.5 lg:gap-3">
            <NotificationBellDropdown />
            <Link
              href="/chat"
              aria-label="Chat"
              className="relative flex p-2 rounded-xl text-slate-600 hover:text-[#0F1C3F] hover:bg-slate-100 transition-colors items-center gap-1.5 text-xs font-bold"
            >
              <MessageSquareHeart size={19} />
              <span className="hidden lg:inline">Chat</span>
              {unread > 0 && (
                <span className="absolute top-1 right-1 lg:static h-2.5 w-2.5 rounded-full bg-rose-500" aria-label={`${unread} unread`} />
              )}
            </Link>
            <Link
              href="/settings"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F1C3F] text-xs font-bold text-[#C9A84C]"
              aria-label="Account settings"
            >
              {initialsOf(user.name)}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main
          className={`flex-1 min-w-0 ${
            isChat
              ? 'overflow-hidden flex flex-col p-0 min-h-0'
              : 'overflow-y-auto overflow-x-hidden relative'
          }`}
        >
          <div
            className={
              isChat
                ? 'flex-1 h-full w-full flex flex-col min-w-0 p-0 sm:p-3 lg:p-4 max-w-7xl mx-auto'
                : 'mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-5 sm:py-6 w-full min-w-0'
            }
          >
            {children}
          </div>

          {/* Floating spouse chat (desktop; phones use the chat icon in the top bar) */}
          <FloatingChatWidget />
        </main>

      </div>
    </div>
  )
}
