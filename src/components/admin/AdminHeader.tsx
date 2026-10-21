'use client'

/**
 * AdminHeader – top bar on every admin page: menu button (phones), the
 * current page title, and the signed-in admin.
 */

import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { adminPageTitle } from './AdminSidebar'

interface Props {
  user: { name?: string | null; email?: string | null }
  onMenuClick?: () => void
}

export default function AdminHeader({ user, onMenuClick }: Props) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 text-gray-600 hover:text-[#0F1C3F] hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <p className="hidden sm:block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
          <h1 className="truncate text-base font-bold text-[#0F1C3F] leading-tight">{adminPageTitle(pathname)}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-900 leading-none">{user.name ?? 'Admin'}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{user.email ?? ''}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#0F1C3F] flex items-center justify-center text-[#C9A84C] font-bold text-xs">
          {(user.name ?? 'Admin')
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0])
            .join('')
            .toUpperCase()}
        </div>
      </div>
    </header>
  )
}
