/**
 * Admin portal layout – wraps every page under /admin.
 *
 * Guards: session must exist + role must be one of ADMIN | FINANCE | COMPLIANCE | SUPPORT.
 * Sidebar nav items are conditionally shown based on the active role.
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

// Permitted roles for the admin portal
const ADMIN_ROLES = ['ADMIN', 'FINANCE', 'COMPLIANCE', 'SUPPORT'] as const
type AdminRole = (typeof ADMIN_ROLES)[number]

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Not authenticated → go to login
  if (!session?.user) {
    redirect('/login')
  }

  // Wrong role → go back to investor dashboard
  if (!ADMIN_ROLES.includes(session.user.role as AdminRole)) {
    redirect('/dashboard')
  }

  const role = session.user.role as AdminRole

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <AdminSidebar role={role} />

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <AdminHeader user={session.user} role={role} />

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>

        <footer className="py-4 px-8 border-t border-gray-200 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Union Invest · Admin Portal · All rights
          reserved
        </footer>
      </div>
    </div>
  )
}
