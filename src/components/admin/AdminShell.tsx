'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'

interface AdminShellProps {
  user: { name?: string | null; email?: string | null }
  children: React.ReactNode
}

export default function AdminShell({ user, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0)
  const pathname = usePathname()

  // Refresh the pending-withdrawals count on navigation (menu links close the drawer themselves)
  useEffect(() => {
    fetch('/api/admin/withdrawals')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list: { status?: string }[] = data?.withdrawals || []
        setPendingWithdrawals(list.filter((w) => w.status === 'PENDING').length)
      })
      .catch(() => {})
  }, [pathname])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row relative w-full overflow-x-hidden">
      <AdminSidebar
        pendingWithdrawals={pendingWithdrawals}
        mobileOpen={mobileOpen}
        onOpenMobile={() => setMobileOpen(true)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen lg:pl-64 w-full min-w-0">
        <AdminHeader user={user} onMenuClick={() => setMobileOpen(true)} />

        {/* Bottom padding leaves room for the phone tab bar */}
        <main className="flex-1 p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 w-full min-w-0">{children}</main>

        <footer className="hidden lg:block py-4 px-8 border-t border-gray-200 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Union Verify · Admin
        </footer>
      </div>
    </div>
  )
}
