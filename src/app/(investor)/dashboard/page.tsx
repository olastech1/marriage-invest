import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getReciprocationStatus } from '@/lib/reciprocation'
import { getIncomingSpouseRequests } from '@/lib/chat'
import { getPartnerIds, withdrawalApproverId } from '@/lib/partners'
import { getSettings } from '@/lib/settings'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Decimal } from '@prisma/client/runtime/library'
import AccountRatingCard from '@/components/investor/AccountRatingCard'
import UrgentNotificationCenter from '@/components/investor/UrgentNotificationCenter'
import SpouseRequestBanner from '@/components/investor/SpouseRequestBanner'
import MyAccountId from '@/components/investor/MyAccountId'
import VerifyEmailBanner from '@/components/investor/VerifyEmailBanner'
import { ensureAccountNumber } from '@/lib/accountId'
import { computeAccountRating, isDemoTransaction, countsInTotals } from '@/lib/rating'
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  ArrowRight,
  PiggyBank,
  TrendingUp,
  Award,
  Sparkles,
  Lock,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const USD = (n: Decimal | number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    typeof n === 'number' ? n : Number(n),
  )

const fmtDate = (d: Date | null) =>
  d ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d) : '—'

const statusColors: Record<string, string> = {
  PENDING:    'bg-amber-100 text-amber-700',
  ACTIVE:     'bg-emerald-100 text-emerald-700',
  MATURED:    'bg-blue-100 text-blue-700',
  CANCELLED:  'bg-red-100 text-red-600',
  DEFAULTED:  'bg-red-200 text-red-800',
  COMPLETED:  'bg-emerald-100 text-emerald-700',
  PROCESSING: 'bg-sky-100 text-sky-700',
  FAILED:     'bg-red-100 text-red-600',
}

const txTypeColors: Record<string, string> = {
  DEPOSIT:      'bg-emerald-100 text-emerald-700',
  WITHDRAWAL:   'bg-orange-100 text-orange-700',
  DISTRIBUTION: 'bg-blue-100 text-blue-700',
  FEE:          'bg-slate-100 text-slate-600',
  REFUND:       'bg-purple-100 text-purple-700',
  ADJUSTMENT:   'bg-gray-100 text-gray-600',
}

const notifIcon = (type: string) => {
  switch (type) {
    case 'SUCCESS': return <CheckCircle size={16} className="text-emerald-500" />
    case 'WARNING': return <AlertTriangle size={16} className="text-amber-500" />
    case 'ALERT':   return <AlertCircle size={16} className="text-red-500" />
    default:        return <Info size={16} className="text-blue-500" />
  }
}

// ---------------------------------------------------------------------------
// Page
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const currentUser = session.user
  const userId = currentUser.id

  // ── parallel data fetch ────────────────────────────────────────────────
  const [
    userRecord,
    investments,
    transactions,
    allCompletedTransactions,
    notifications,
    allDocuments,
    userAcknowledgments,
    marriageAudit,
    allPendingWithdrawals,
    reciprocation,
    settings,
    spouseRequests,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { identityVerified: true, accountNumber: true, email: true, emailVerified: true },
    }),
    prisma.investment.findMany({
      where: { userId },
      include: { opportunity: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { investment: { include: { opportunity: true } } },
    }),
    prisma.transaction.findMany({
      where: { userId, status: 'COMPLETED' },
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.document.findMany({
      select: { id: true, name: true, type: true, version: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.documentAcknowledgment.findMany({
      where: { userId },
      select: { documentId: true, signedAt: true },
    }),
    prisma.auditLog.findFirst({
      where: { userId, action: 'MARRIAGE_REGISTRATION_CREATED' },
    }),
    // Only my partners' pending requests can need my approval (each names the partner who approves it)
    getPartnerIds(userId).then(async (partnerIds) => {
      if (!partnerIds.length) return []
      const pending = await prisma.withdrawalRequest.findMany({
        where: { status: 'PENDING', userId: { in: partnerIds } },
        select: { id: true, amount: true, adminNote: true, userId: true, user: { select: { name: true } } },
      })
      const mine = await Promise.all(pending.map(async (w) => ((await withdrawalApproverId(w)) === userId ? w : null)))
      return mine.filter((w): w is NonNullable<typeof w> => !!w)
    }),
    getReciprocationStatus(userId),
    getSettings(),
    getIncomingSpouseRequests(userId),
  ])

  // ── compute real stats (strictly excluding demo deposits & investments) ─
  const realInvestments = investments.filter((i) => countsInTotals(i))
  const realCompletedTransactions = allCompletedTransactions.filter((t) => !isDemoTransaction(t))

  const realDepositedAmount = realCompletedTransactions
    .filter((t) => t.type === 'DEPOSIT')
    .reduce((s, t) => s + Number(t.netAmount), 0)

  const totalInvested = realInvestments
    .filter((i) => i.status === 'ACTIVE' || i.status === 'MATURED')
    .reduce((s, i) => s + Number(i.amount), 0)


  // Filter recent transactions for table (real transactions only)
  const realRecentTransactions = transactions.filter((t) => !isDemoTransaction(t)).slice(0, 5)

  // Marriage registered on the platform (audit log, or completed registration fee)
  const hasFeeCovenant = realCompletedTransactions.some(
    (t) => t.type === 'FEE' && (t.description?.toLowerCase().includes('matrimonial') || t.reference?.startsWith('FEE-REG'))
  )
  // Couple linked: a linked partner, or a union registered on the platform
  const hasMarriageCovenant = Boolean(marriageAudit || hasFeeCovenant || reciprocation.partnerIds.length)

  // Account rating from signed documents, verification and real deposits
  const accountRating = computeAccountRating({
    acknowledgedDocIds: userAcknowledgments.map((a) => a.documentId),
    allDocuments,
    isIdentityVerified: Boolean(userRecord?.identityVerified),
    hasMarriageCovenant,
    realDepositedAmount,
    realInvestedAmount: totalInvested,
  })


  const now = new Date()
  const unreadCount = notifications.filter((n) => !n.read).length
  const accountId = userRecord?.accountNumber || (await ensureAccountNumber(userId))

  // My spouse's withdrawal requests that are waiting for my approval
  const pendingSpousalApprovals = allPendingWithdrawals.filter((w) => {
    try {
      if (!w.adminNote || !w.adminNote.startsWith('{')) return false
      const meta = JSON.parse(w.adminNote)
      return meta.requiresPartnerApproval && meta.partnerApprovalStatus === 'AWAITING_PARTNER'
    } catch {
      return false
    }
  })

  // A spouse deposit I still need to reciprocate
  const pendingDepositorName = reciprocation.pending?.depositorName || reciprocation.spouseName || 'Your partner'
  // Deposits to reciprocate can come from several partners
  const depositors = [...new Set(reciprocation.pendingDeposits.map((d) => d.depositorName))]
  const requesters = [...new Set(pendingSpousalApprovals.map((w) => w.user?.name || 'Your partner'))]

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1C3F]">
            Welcome back{currentUser.name ? `, ${currentUser.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-slate-500">
            {new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(now)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <MyAccountId accountId={accountId} />
            {reciprocation.partnerIds.length === 0 && spouseRequests.length === 0 && (
              <Link href="/settings#spouse" className="text-xs font-bold text-rose-700 underline">
                Link your partner
              </Link>
            )}
          </div>
        </div>
        {/* Only shown while an admin has a deposit match promo switched on */}
        {settings.bonusMatchRate > 0 && (
          <Link
            href="/save"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#d4b460] px-4 py-2.5 text-xs font-black text-[#0F1C3F] shadow-sm hover:shadow transition-all"
          >
            <Sparkles size={15} />
            Deposit · {settings.bonusMatchRate}% cash match
          </Link>
        )}
      </div>

      {/* ── Email not confirmed yet ── */}
      {userRecord && !userRecord.emailVerified && <VerifyEmailBanner email={userRecord.email} />}

      {/* ── Someone asked to link as spouses ───────────────────────── */}
      <SpouseRequestBanner requests={spouseRequests} />

      {/* ── Notifications that need action ─────────────────────────── */}
      <UrgentNotificationCenter
        initialNotifications={notifications.filter((n) => n.category !== 'SPOUSE_REQUEST') as any}
      />

      {/* ── Deposits to reciprocate: each one on its own ─────────────── */}
      {reciprocation.pendingDeposits.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-transparent border-2 border-rose-300 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest bg-rose-200/80 text-rose-900 px-2.5 py-0.5 rounded-full">
                Reciprocation Needed
              </span>
              <h3 className="text-base font-bold text-rose-950">
                {reciprocation.pendingDeposits.length === 1
                  ? `${pendingDepositorName} made a deposit for you to reciprocate`
                  : depositors.length > 1
                    ? `${reciprocation.pendingDeposits.length} deposits from ${depositors.join(' and ')} to reciprocate`
                    : `${pendingDepositorName} made ${reciprocation.pendingDeposits.length} deposits for you to reciprocate`}
              </h3>
              <p className="text-xs text-rose-900/80">Reciprocate each one separately. Withdrawals from what you share with that partner wait until theirs are reciprocated.</p>
            </div>
          </div>
          <ul className="space-y-2">
            {reciprocation.pendingDeposits.map((d) => (
              <li key={d.messageId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-white/80 border border-rose-200 px-4 py-3">
                <div className="text-sm text-rose-950">
                  <span className="font-bold">${d.amount.toLocaleString()}</span>
                  {depositors.length > 1 && <span className="font-semibold"> from {d.depositorName}</span>}
                  <span className="text-rose-800/80"> · deposited {new Date(d.depositedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  {d.note && <span className="block text-xs text-rose-800/80">&ldquo;{d.note}&rdquo;</span>}
                </div>
                <form method="post" action="/pay/match" className="flex-shrink-0">
                  <input type="hidden" name="deposit" value={d.messageId} />
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#0F1C3F] text-white font-bold text-xs hover:bg-[#1a2f64] transition-colors cursor-pointer"
                  >
                    Reciprocate ${d.amount.toLocaleString()}
                    <ArrowRight size={14} />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Spouse Withdrawal Approval Banner ─────────────────────────── */}
      {pendingSpousalApprovals.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent border-2 border-amber-300 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full">
                  Approval needed
                </span>
              </div>
              <h3 className="text-base font-bold text-amber-950">
                {pendingSpousalApprovals.length === 1 ? 'A withdrawal request is' : `${pendingSpousalApprovals.length} withdrawal requests are`} waiting for your approval
              </h3>
              <p className="text-xs text-amber-900/80 leading-relaxed max-w-2xl">
                {requesters.join(' and ')} asked to withdraw from an investment you share. Nothing is paid out until you approve or decline.
              </p>
            </div>
          </div>
          <Link
            href="/withdrawals"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F1C3F] text-white font-bold text-xs shadow-md hover:bg-[#1a2f64] transition-colors flex-shrink-0"
          >
            Review
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ── Three things you can do: save, invest, union package ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/save"
          className="rounded-2xl bg-gradient-to-br from-[#0F1C3F] to-[#1a2f64] p-5 text-white shadow-md border border-[#C9A84C]/30 flex flex-col justify-between gap-4 hover:shadow-lg transition-shadow"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A84C]">Joint savings</span>
              <PiggyBank className="w-5 h-5 text-[#C9A84C]" />
            </div>
            <h3 className="text-base font-bold">
              {reciprocation.partnerIds.length
                ? `${reciprocation.partnerIds.length} joint vault${reciprocation.partnerIds.length > 1 ? 's' : ''}`
                : 'Save with someone'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {reciprocation.partnerIds.length
                ? `One vault with each partner, ${settings.vaultApy}% APY (variable, not guaranteed).`
                : 'Link a partner, family member or friend to open a joint vault together.'}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C9A84C]">
            {reciprocation.partnerIds.length ? 'Open vaults' : 'Get started'} <ArrowRight size={13} />
          </span>
        </Link>

        <Link
          href="/portfolio"
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-[#C9A84C] transition-all flex flex-col justify-between gap-4"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Investing</span>
              <TrendingUp className="w-5 h-5 text-[#C9A84C]" />
            </div>
            <h3 className="text-base font-bold text-[#0F1C3F]">Your portfolio</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Holdings, maturity dates, distributions and open opportunities.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F1C3F]">
            View portfolio <ArrowRight size={13} />
          </span>
        </Link>

        <Link
          href={hasMarriageCovenant && marriageAudit ? '/certificate' : '/get-married'}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-[#C9A84C] transition-all flex flex-col justify-between gap-4"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded-full">Optional · couples</span>
              <Award className="w-5 h-5 text-[#C9A84C]" />
            </div>
            <h3 className="text-base font-bold text-[#0F1C3F]">Union package</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Register your union and get your Union Verify certificate: $1,000, or split 50-50 at $500 each.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F1C3F]">
            {marriageAudit ? 'View certificate' : 'Unlock it'} <ArrowRight size={13} />
          </span>
        </Link>
      </div>

      {/* ── Account Rating ──────────────────────────────────────────── */}
      <AccountRatingCard rating={accountRating} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Recent Transactions ─────────────────────────────────── */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Recent Transactions</h2>
            <Link href="/transactions" className="flex items-center gap-1 text-xs font-medium text-[#C9A84C] hover:underline">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {realRecentTransactions.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No verified transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-left">Type</th>
                    <th className="px-5 py-3 text-left">Description</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {realRecentTransactions.map((tx) => {
                    const isCredit = tx.type === 'DEPOSIT' || tx.type === 'DISTRIBUTION' || tx.type === 'REFUND'
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-3 text-slate-500">{fmtDate(tx.createdAt)}</td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${txTypeColors[tx.type] ?? 'bg-gray-100 text-gray-600'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-700 max-w-[200px] truncate">{tx.description}</td>
                        <td className={`whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isCredit ? '+' : '-'}{USD(tx.netAmount)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[tx.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {tx.status}
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

        {/* ── Notifications ───────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-slate-500" />
              <h2 className="font-semibold text-slate-900">Notifications</h2>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C9A84C] px-1 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
          {notifications.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No notifications.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`flex gap-3 px-5 py-3.5 ${n.read ? '' : 'bg-blue-50/50'}`}
                >
                  <div className="mt-0.5 flex-shrink-0">{notifIcon(n.type)}</div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium text-slate-800 ${n.read ? '' : 'text-[#0F1C3F]'}`}>{n.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{n.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{fmtDate(n.createdAt)}</p>
                  </div>
                  {!n.read && <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#C9A84C]" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
  )
}
