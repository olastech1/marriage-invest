import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Users,
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
  Eye,
  Sparkles,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminInvestorsPage() {
  const session = await auth()
  if (!session?.user?.role || !['ADMIN', 'FINANCE', 'COMPLIANCE', 'SUPPORT'].includes(session.user.role)) {
    redirect('/login?callbackUrl=/admin/investors')
  }

  let investors: any[] = []
  try {
    investors = await prisma.user.findMany({
      where: { role: 'INVESTOR' },
      include: {
        investments: true,
        transactions: {
          where: { type: 'DEPOSIT', status: 'COMPLETED' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    // DB offline
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investor Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Registered joint investor accounts, onboarding verification statuses, and capital allocations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/demo-accounts"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F1C3F] text-[#C9A84C] text-xs font-bold hover:bg-[#1a2e63] transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C9A84C]" />
            Demo Accounts Studio
          </Link>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700">
            Total Investors: {investors.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search investor by name or email..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 outline-none focus:border-[#C9A84C]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3 px-6">Investor / Couple</th>
                <th className="py-3 px-6">Contact Email & Phone</th>
                <th className="py-3 px-6">Registration Date</th>
                <th className="py-3 px-6">KYC Status</th>
                <th className="py-3 px-6">Active Investments</th>
                <th className="py-3 px-6">Total Funded (USD)</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {investors.map((inv: any) => {
                const totalFunded = (inv.investments || []).reduce((sum: number, i: any) => sum + Number(i.amount), 0)
                const activeCount = (inv.investments || []).filter((i: any) => i.status === 'ACTIVE').length

                return (
                  <tr key={inv.id} className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-6 font-semibold text-gray-900">
                      {inv.name}
                    </td>
                    <td className="py-3.5 px-6 text-gray-600">
                      <div>{inv.email}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{inv.phone || 'No phone'}</div>
                    </td>
                    <td className="py-3.5 px-6 text-gray-500 font-mono">
                      {formatDate(inv.createdAt)}
                    </td>
                    <td className="py-3.5 px-6">
                      {inv.identityVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-gray-800">
                      {activeCount} Active
                    </td>
                    <td className="py-3.5 px-6 font-bold text-[#0F1C3F]">
                      {formatCurrency(totalFunded)}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button className="px-3 py-1 rounded-lg border border-gray-200 text-gray-700 text-[11px] font-medium hover:bg-gray-50">
                        View Dossier
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
