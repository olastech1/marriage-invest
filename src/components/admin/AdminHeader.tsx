'use client'

/**
 * AdminHeader – top bar shown across all admin pages.
 * Displays user name, role badge, and avatar.
 */

import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

type AdminRole = 'ADMIN' | 'FINANCE' | 'COMPLIANCE' | 'SUPPORT'

const ROLE_COLOR: Record<AdminRole, string> = {
  ADMIN: 'text-red-500 bg-red-50',
  FINANCE: 'text-emerald-600 bg-emerald-50',
  COMPLIANCE: 'text-purple-600 bg-purple-50',
  SUPPORT: 'text-sky-600 bg-sky-50',
}

interface Props {
  user: { name?: string | null; email?: string | null }
  role: AdminRole
  onMenuClick?: () => void
}

export default function AdminHeader({ user, role, onMenuClick }: Props) {
  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shadow-xs">
      {/* Left – Hamburger menu for mobile + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 text-gray-600 hover:text-[#0F1C3F] hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0F1C3F] flex items-center justify-center lg:hidden">
            <span className="text-[#C9A84C] font-bold text-xs">UI</span>
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Union Verify
          </span>
          <span className="hidden sm:inline text-gray-300">/</span>
          <span className="text-xs sm:text-sm font-bold text-[#0F1C3F]">Admin Portal</span>
        </div>
      </div>

      {/* Right – controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Role badge */}
        <span className={cn('text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border border-current/20 uppercase tracking-wider', ROLE_COLOR[role])}>
          {role}
        </span>

        {/* Avatar + user info */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-none">
              {user.name ?? 'Admin'}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{user.email ?? ''}</p>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0F1C3F] flex items-center justify-center text-[#C9A84C] font-bold text-xs">
            {(user.name ?? 'AD')
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0])
              .join('')
              .toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}
