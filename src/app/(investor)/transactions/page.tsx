import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { isDemoTransaction } from '@/lib/rating'
import {
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Download,
  Calendar,
  ShieldCheck,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/transactions')
  }

  const userId = session.user.id

  const allTransactions = await prisma.transaction.findMany({
    where: { userId },
    include: {
      investment: {
        include: {
          opportunity: { select: { title: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Strictly filter out demo deposits — only real stuff
  const transactions = allTransactions.filter((t) => !isDemoTransaction(t))

  const totalDeposited = transactions
    .filter((t) => t.type === 'DEPOSIT' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + Number(t.netAmount), 0)

  const totalDistributions = transactions
    .filter((t) => t.type === 'DISTRIBUTION' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + Number(t.netAmount), 0)

  const totalWithdrawn = transactions
    .filter((t) => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + Number(t.netAmount), 0)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-[#0F1C3F]">Transaction Ledger & History</h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Verified Real Ledger Only
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Complete USD transaction audit trail of settled deposits, distributions, and disbursements. Demo allocations are strictly excluded.
          </p>
        </div>
      </div>

      {/* Ledger Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
            Total Settled Deposits
          </span>
          <span className="text-2xl font-bold text-[#0F1C3F]">
            {formatCurrency(totalDeposited)}
          </span>
          <span className="text-[11px] text-gray-500 block mt-1">Confirmed capital investments</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
            Total Distributions Paid
          </span>
          <span className="text-2xl font-bold text-emerald-600">
            {formatCurrency(totalDistributions)}
          </span>
          <span className="text-[11px] text-gray-500 block mt-1">Contractual yield payouts</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
            Total Capital Liquidated
          </span>
          <span className="text-2xl font-bold text-orange-600">
            {formatCurrency(totalWithdrawn)}
          </span>
          <span className="text-[11px] text-gray-500 block mt-1">Completed withdrawals</span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0F1C3F]">Verified Ledger Entries</h2>
            <p className="text-xs text-gray-500">Traceable bank and payment provider transaction receipts.</p>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            No transactions recorded for this account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Reference</th>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6">Description</th>
                  <th className="py-3 px-6">Gross Amount</th>
                  <th className="py-3 px-6">Fee</th>
                  <th className="py-3 px-6">Net (USD)</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((txn) => {
                  const isCredit = txn.type === 'DISTRIBUTION' || txn.type === 'REFUND'

                  return (
                    <tr key={txn.id} className="hover:bg-gray-50/50">
                      <td className="py-3.5 px-6 font-mono text-gray-500">
                        {formatDate(txn.createdAt)}
                      </td>
                      <td className="py-3.5 px-6 font-mono font-medium text-gray-900">
                        {txn.reference}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            txn.type === 'DEPOSIT'
                              ? 'bg-blue-50 text-blue-700'
                              : txn.type === 'DISTRIBUTION'
                              ? 'bg-emerald-50 text-emerald-700'
                              : txn.type === 'WITHDRAWAL'
                              ? 'bg-orange-50 text-orange-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {txn.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-gray-700 max-w-xs truncate">
                        {txn.description}
                      </td>
                      <td className="py-3.5 px-6 font-medium text-gray-900">
                        {formatCurrency(Number(txn.amount))}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-gray-400">
                        {Number(txn.fee) > 0 ? formatCurrency(Number(txn.fee)) : '$0.00'}
                      </td>
                      <td className={`py-3.5 px-6 font-bold ${isCredit ? 'text-emerald-600' : 'text-gray-900'}`}>
                        {formatCurrency(Number(txn.netAmount))}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            txn.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : txn.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
