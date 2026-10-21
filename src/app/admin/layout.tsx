/**
 * Admin portal layout – wraps every page under /admin.
 *
 * Guards: session must exist + role must be ADMIN.
 * Sidebar nav items are conditionally shown based on the active role.
 */

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import AdminShell from '@/components/admin/AdminShell'

// Permitted roles for the admin portal
const ADMIN_ROLES = ['ADMIN'] as const
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
    <AdminShell user={session.user} role={role}>
      {children}
    </AdminShell>
  )
}
