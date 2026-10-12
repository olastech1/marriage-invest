'use client'

/**
 * AdminHeader – top bar shown across all admin pages.
 * Displays user name, role badge, and avatar with a notification bell.
 */

import { Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils'

type AdminRole = 'ADMIN' | 'FINANCE' | 'COMPLIANCE' | 'SUPPORT'

const ROLE_COLOR: Record<AdminRole, string> = {
  ADMIN: 'text-red-400',
  FINANCE: 'text-emerald-400',
  COMPLIANCE: 'text-purple-400',
  SUPPORT: 'text-sky-400',
}

interface Props {
  user: { name?: string | null; email?: string | null }
  role: AdminRole
}

export default function AdminHeader({ user, role }: Props) {
  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      {/* Left – page title placeholder (overridden by page-level h1) */}
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-sm text-gray-500">
          Union Invest
        </span>
        <span className="hidden sm:inline text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-700">Admin Portal</span>
      </div>

      {/* Right – controls */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Avatar + user info */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-none">
              {user.name ?? 'Admin'}
            </p>
            <p className={cn('text-xs font-semibold mt-0.5', ROLE_COLOR[role])}>
              {role}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#0F1C3F] flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </header>
  )
}
