'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'

type AdminRole = 'ADMIN' | 'FINANCE' | 'COMPLIANCE' | 'SUPPORT'

interface AdminShellProps {
  user: { name?: string | null; email?: string | null }
  role: AdminRole
  children: React.ReactNode
}

export default function AdminShell({ user, role, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row relative w-full overflow-x-hidden">
      {/* ── Sidebar (handles both Desktop fixed & Mobile off-canvas drawer) ── */}
      <AdminSidebar
        role={role}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64 w-full min-w-0">
        <AdminHeader
          user={user}
          role={role}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-w-0">
          {children}
        </main>

        <footer className="py-4 px-4 sm:px-8 border-t border-gray-200 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Union Verify · Admin Portal · All rights reserved
        </footer>
      </div>
    </div>
  )
}
