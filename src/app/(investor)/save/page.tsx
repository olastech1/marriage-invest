'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PiggyBank, Bell, AlertTriangle, CheckCircle2, CreditCard, RefreshCw } from 'lucide-react'

interface DepositItem {
  id: string
  amount: number
  depositorName: string
  isCurrentUser: boolean
  isReciprocalMatch: boolean
  statusLabel: string
  status: 'APPROVED' | 'PENDING_MATCH'
  createdAt: string
}

interface Reciprocation {
  hasPendingReciprocation: boolean
  pendingReciprocation: { amount: number; depositorName: string; dueDate: string; partnerNote: string } | null
  partnerId: string
  partnerName: string
  owedByMe: number
  owedBySpouse: number
  pendingDeposits: { messageId: string; depositorName: string; amount: number; depositedAt: string; note: string }[]
}

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)

function SavePageContent() {
  const searchParams = useSearchParams()

  const [deposits, setDeposits] = useState<DepositItem[]>([])
  const [reciprocation, setReciprocation] = useState<Reciprocation | null>(null)
  const [settings, setSettings] = useState<{ vaultApy: number; bonusMatchRate: number } | null>(null)
  const [loadingDeposits, setLoadingDeposits] = useState(true)

  const [amount, setAmount] = useState(searchParams.get('match') || searchParams.get('amount') || '')
  const [note, setNote] = useState('')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const [reminderAmount, setReminderAmount] = useState('')
  const [reminderNote, setReminderNote] = useState('')
  const [sendingReminder, setSendingReminder] = useState(false)
  const [reminderResult, setReminderResult] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(async () => {
    const [dep, rec, set] = await Promise.all([
      fetch('/api/savings/deposits').then((r) => r.json()).catch(() => null),
      fetch('/api/savings/reciprocation').then((r) => r.json()).catch(() => null),
      fetch('/api/settings').then((r) => r.json()).catch(() => null),
    ])
    if (dep?.success) setDeposits(dep.deposits)
    if (rec && !rec.error) setReciprocation(rec)
    if (set?.success) setSettings(set.settings)
    setLoadingDeposits(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const spouseName = reciprocation?.partnerName || 'your partner'
  const hasSpouse = !!reciprocation?.partnerId
  const owedBySpouse = reciprocation?.owedBySpouse || 0
  const total = deposits.reduce((sum, d) => sum + d.amount, 0)
  const myTotal = deposits.filter((d) => d.isCurrentUser).reduce((sum, d) => sum + d.amount, 0)
  const numAmount = parseFloat(amount) || 0
  const bonusRate = settings?.bonusMatchRate || 0

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (numAmount < 10) {
      setError('The minimum deposit is $10.')
      return
    }
    setPaying(true)
    try {
      // Paid by card through Stripe; recorded once the payment succeeds
      const res = await fetch('/api/savings/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount, note }),
      })
      const data = await res.json()
      if (!res.ok || !data.checkoutUrl) throw new Error(data.error || 'Could not start the payment.')
      window.location.href = data.checkoutUrl
    } catch (err: any) {
      setError(err.message)
      setPaying(false)
    }
  }

  const handleSendReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    setSendingReminder(true)
    setReminderResult(null)
    try {
      const res = await fetch('/api/savings/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_now', amount: parseFloat(reminderAmount) || 0, note: reminderNote }),
      })
      const data = await res.json()
      setReminderResult({ ok: !!data.success, text: data.message || data.error || 'Something went wrong.' })
      if (data.success) setReminderNote('')
    } catch {
      setReminderResult({ ok: false, text: 'Could not send the reminder.' })
    } finally {
      setSendingReminder(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1C3F]">Joint vault</h1>
        <p className="text-sm text-gray-500">
          {hasSpouse ? `Shared with ${spouseName}.` : 'Connect with your partner from the chat page to save together.'}
        </p>
      </div>

      {searchParams.get('checkout_canceled') === 'true' && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
          Payment canceled. Nothing was charged.
        </div>
      )}

      {/* Balance */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#0F1C3F] text-white p-5">
          <p className="text-xs text-white/70">Total deposited together</p>
          <p className="text-2xl font-bold mt-1">{usd(total)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs text-gray-500">Your deposits</p>
          <p className="text-2xl font-bold text-[#0F1C3F] mt-1">{usd(myTotal)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs text-gray-500">Vault rate</p>
          <p className="text-2xl font-bold text-[#0F1C3F] mt-1">{settings ? `${settings.vaultApy}% / year` : '—'}</p>
          <p className="text-[11px] text-gray-400 mt-1">Variable, not guaranteed.</p>
        </div>
      </div>

      {/* Spouse deposits to reciprocate, each on its own */}
      {(reciprocation?.pendingDeposits?.length || 0) > 0 && (
        <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-5 space-y-3">
          <div>
            <p className="text-sm font-bold text-rose-900">
              {reciprocation!.pendingDeposits.length === 1
                ? `${spouseName}'s deposit to reciprocate`
                : `${reciprocation!.pendingDeposits.length} deposits from ${spouseName} to reciprocate`}
            </p>
            <p className="text-xs text-rose-800/80 mt-1">Reciprocate each one separately. Joint withdrawals stay locked until they&apos;re all reciprocated.</p>
          </div>
          <ul className="space-y-2">
            {reciprocation!.pendingDeposits.map((d) => (
              <li key={d.messageId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-white border border-rose-200 px-4 py-3">
                <div className="text-sm text-rose-950">
                  <span className="font-bold">{usd(d.amount)}</span>
                  <span className="text-rose-800/80"> · deposited {new Date(d.depositedAt).toLocaleDateString()}</span>
                  {d.note && <span className="block text-xs text-rose-800/80">&ldquo;{d.note}&rdquo;</span>}
                </div>
                <form method="post" action="/pay/match" className="flex-shrink-0">
                  <input type="hidden" name="deposit" value={d.messageId} />
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2f64] text-white font-bold text-xs cursor-pointer"
                  >
                    Reciprocate {usd(d.amount)}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
      {owedBySpouse > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
          Waiting for {spouseName} to reciprocate {usd(owedBySpouse)}.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Deposit */}
        <form onSubmit={handleDeposit} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="font-bold text-[#0F1C3F] flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-[#C9A84C]" /> Add money
          </h2>
          <div>
            <label htmlFor="amount" className="text-xs font-semibold text-gray-600">Amount (USD)</label>
            <input
              id="amount"
              type="number"
              min="10"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-300 text-base sm:text-sm focus:outline-none focus:border-[#C9A84C]"
            />
          </div>
          {hasSpouse && (
            <div>
              <label htmlFor="note" className="text-xs font-semibold text-gray-600">Note to {spouseName} (optional)</label>
              <input
                id="note"
                type="text"
                maxLength={200}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-300 text-base sm:text-sm focus:outline-none focus:border-[#C9A84C]"
              />
            </div>
          )}
          {bonusRate > 0 && numAmount >= 10 && (
            <p className="text-xs text-emerald-700">
              Current promotion: a {bonusRate}% cash match (+{usd(Math.round(numAmount * bonusRate) / 100)}) is added after payment.
            </p>
          )}
          {error && (
            <p className="text-xs text-rose-700 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
          <button
            type="submit"
            disabled={paying}
            className="w-full py-3 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2f64] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {paying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {paying ? 'Opening secure payment…' : numAmount >= 10 ? `Pay ${usd(numAmount)} by card` : 'Pay by card'}
          </button>
          <p className="text-[11px] text-gray-400">Payments are processed by Stripe. The deposit appears once the payment succeeds.</p>
        </form>

        {/* Reminder */}
        <form onSubmit={handleSendReminder} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="font-bold text-[#0F1C3F] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#C9A84C]" /> Request money from {spouseName}
          </h2>
          {!hasSpouse ? (
            <p className="text-sm text-gray-500">Connect with your partner first.</p>
          ) : (
            <>
              <input
                type="number"
                min="1"
                step="0.01"
                inputMode="decimal"
                value={reminderAmount}
                onChange={(e) => setReminderAmount(e.target.value)}
                placeholder="Amount"
                aria-label="Reminder amount"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-base sm:text-sm focus:outline-none focus:border-[#C9A84C]"
              />
              <input
                type="text"
                maxLength={300}
                value={reminderNote}
                onChange={(e) => setReminderNote(e.target.value)}
                placeholder="What it's for (optional)"
                aria-label="What it's for"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-base sm:text-sm focus:outline-none focus:border-[#C9A84C]"
              />
              {reminderResult && (
                <p className={`text-xs ${reminderResult.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{reminderResult.text}</p>
              )}
              <button
                type="submit"
                disabled={sendingReminder || !(parseFloat(reminderAmount) > 0)}
                className="w-full py-2.5 rounded-xl border border-[#0F1C3F] text-[#0F1C3F] font-bold text-sm hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
              >
                {sendingReminder ? 'Sending…' : 'Send request'}
              </button>
            </>
          )}
        </form>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-bold text-[#0F1C3F] mb-3">Deposit history</h2>
        {loadingDeposits ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : deposits.length === 0 ? (
          <p className="text-sm text-gray-500">No deposits yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {deposits.map((d) => (
              <li key={d.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    {d.isCurrentUser ? 'You' : d.depositorName}
                    {d.isReciprocalMatch && <span className="ml-2 text-[11px] font-medium text-emerald-700">Reciprocation</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(d.createdAt).toLocaleDateString()} ·{' '}
                    <span className={d.status === 'PENDING_MATCH' ? 'text-amber-700' : 'text-gray-500'}>{d.statusLabel}</span>
                  </p>
                </div>
                <span className="text-sm font-bold text-[#0F1C3F] flex items-center gap-1">
                  {d.status === 'APPROVED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  {usd(d.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function SavePage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-400">Loading…</div>}>
      <SavePageContent />
    </Suspense>
  )
}
