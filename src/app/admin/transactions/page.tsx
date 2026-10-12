import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminTransactionsPage() {
  const session = await auth()
  if (!session?.user?.role || !['ADMIN', 'FINANCE'].includes(session.user.role)) {
    redirect('/login?callbackUrl=/admin/transactions')
  }

  let transactions: any[] = []
  try {
    transactions = await prisma.transaction.findMany({
      include: {
        user: { select: { name: true, email: true } },
        investment: {
          include: {
            opportunity: { select: { title: true } },
          },
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
          <h1 className="text-2xl font-bold text-gray-900">Platform Financial Ledger</h1>
          <p className="text-xs text-gray-500 mt-1">
            Reconciled records of all deposits, contractual yields, and liquidations denominated in USD.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Traceable Transaction Ledger</h2>
            <p className="text-xs text-gray-500">Total ledger transactions: {transactions.length}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-6">Transaction Ref</th>
                <th className="py-3 px-6">Investor</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Description</th>
                <th className="py-3 px-6">Amount (USD)</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50">
                  <td className="py-3.5 px-6 font-mono text-gray-500">
                    {formatDate(t.createdAt)}
                  </td>
                  <td className="py-3.5 px-6 font-mono font-medium text-gray-900">
                    {t.reference}
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="font-semibold text-gray-900">{t.user.name}</div>
                    <div className="text-[11px] text-gray-400">{t.user.email}</div>
                  </td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.type === 'DEPOSIT'
                          ? 'bg-blue-50 text-blue-700'
                          : t.type === 'DISTRIBUTION'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-orange-50 text-orange-700'
                      }`}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-gray-600 max-w-xs truncate">
                    {t.description}
                  </td>
                  <td className="py-3.5 px-6 font-bold text-gray-900">
                    {formatCurrency(Number(t.netAmount))}
                  </td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
