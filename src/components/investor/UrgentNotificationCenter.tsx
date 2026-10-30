'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Check,
  RefreshCw,
  X,
  MessageSquareHeart,
} from 'lucide-react'

interface NotificationItem {
  id: string
  userId: string
  title: string
  message: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT'
  read: boolean
  link: string | null
  createdAt: string | Date
  category?: 'BONUS_MATCH' | 'PARTNER_DEPOSIT' | 'PARTNER_CHANGE' | 'COMPOUND_URGENCY' | 'GENERAL'
  requiresAction?: boolean
  attended?: boolean
  attendedAt?: string | Date | null
  amount?: number
  partnerName?: string
  actionLabel?: string
  metadata?: unknown
}

interface Props {
  initialNotifications: NotificationItem[]
  partnerName?: string
}

export default function UrgentNotificationCenter({
  initialNotifications,
  partnerName = 'your partner',
}: Props) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications || [])
  const [attendingIds, setAttendingIds] = useState<Record<string, boolean>>({})
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'URGENT' | 'ALL'>('URGENT')

  // Notifications that still need the member to act on them
  const pendingActions = notifications.filter(
    (n) => (n.requiresAction || n.category === 'BONUS_MATCH' || n.category === 'PARTNER_DEPOSIT') && !n.attended
  )

  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handleAttend = async (id: string) => {
    setAttendingIds((prev) => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`/api/notifications/${id}/attend`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, attended: true, read: true, attendedAt: new Date() } : n))
        )
        showToast('Marked as done.')
      }
    } catch (err) {
      console.error('Failed to attend notification', err)
    } finally {
      setAttendingIds((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleAttendAll = async () => {
    try {
      const res = await fetch('/api/notifications/attend-all', {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, attended: true, read: true, attendedAt: new Date() }))
        )
        showToast('All notifications marked as done.')
      }
    } catch (err) {
      console.error('Failed to attend all', err)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-xl">
          <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-white/80 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#0F1C3F] via-[#162752] to-[#0F1C3F] p-4 text-white shadow-md border border-[#C9A84C]/30">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Bell className="h-5 w-5" />
            {pendingActions.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white ring-2 ring-[#0F1C3F]">
                {pendingActions.length}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#C9A84C]">
                Action Center
              </span>
              {pendingActions.length > 0 && (
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/30">
                  {pendingActions.length} need{pendingActions.length === 1 ? 's' : ''} attention
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white">
              Notifications
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Link
            href="/chat?thread=spouse"
            className="rounded-lg bg-[#C9A84C]/20 border border-[#C9A84C]/40 px-3 py-1.5 text-xs font-bold text-[#C9A84C] hover:bg-[#C9A84C]/30 transition-colors flex items-center gap-1.5"
            title={`Chat with ${partnerName}`}
          >
            <MessageSquareHeart size={13} />
            Couple Chat
          </Link>
          <button
            onClick={() => setActiveTab(activeTab === 'URGENT' ? 'ALL' : 'URGENT')}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            {activeTab === 'URGENT' ? 'View all' : 'Needs action only'}
          </button>
          {pendingActions.length > 0 && (
            <button
              onClick={handleAttendAll}
              className="rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#d4b460] px-3.5 py-1.5 text-xs font-bold text-[#0F1C3F] hover:shadow transition-all"
            >
              Mark all done
            </button>
          )}
        </div>
      </div>

      {/* Notifications that need action (stay here until marked done) */}
      {pendingActions.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-rose-600" />
              Needs your attention
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {pendingActions.map((notif) => {
              const isDeposit = notif.category === 'PARTNER_DEPOSIT' || notif.amount
              const isReminder = notif.category === 'COMPOUND_URGENCY'
              const isAttending = attendingIds[notif.id]

              return (
                <div
                  key={notif.id}
                  className={`rounded-2xl border-2 p-5 shadow-sm transition-all relative overflow-hidden flex flex-col justify-between ${
                    isDeposit
                      ? 'border-rose-400 bg-rose-50/60 ring-2 ring-rose-200/50'
                      : isReminder
                      ? 'border-amber-400 bg-amber-50/60'
                      : 'border-blue-300 bg-blue-50/50'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Badge line */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          isDeposit
                            ? 'bg-rose-600 text-white'
                            : isReminder
                            ? 'bg-amber-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {isDeposit ? 'Partner deposit' : isReminder ? 'Reminder' : 'Update'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Content */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{notif.title}</h4>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                    </div>

                    {/* Amount note if deposit */}
                    {isDeposit && notif.amount && (
                      <div className="rounded-xl bg-white/80 p-3 border border-rose-200 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-rose-900">
                          <span>Deposit amount</span>
                          <span className="font-mono">${Number(notif.amount).toLocaleString()}</span>
                        </div>
                        <p className="text-[11px] text-rose-700">
                          Joint withdrawals stay locked while a partner&apos;s deposit has not been reciprocated.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4 border-t border-slate-200/60 mt-3">
                    {notif.link ? (
                      // /pay/* links redirect to Stripe, so they need a full page load
                      (() => {
                        const LinkEl = notif.link.startsWith('/pay/') ? 'a' : Link
                        return (
                          <LinkEl
                            href={notif.link}
                            className="flex-1 rounded-xl bg-[#0F1C3F] px-3 py-2 text-center text-xs font-bold text-white hover:bg-[#1a2f64] transition-colors flex items-center justify-center gap-1.5"
                          >
                            {notif.actionLabel || 'Open'}
                            <ArrowRight size={13} />
                          </LinkEl>
                        )
                      })()
                    ) : null}
                    <Link
                      href="/chat?thread=spouse"
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:text-[#0F1C3F] hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 flex-shrink-0"
                      title={`Discuss this with ${partnerName}`}
                    >
                      <MessageSquareHeart size={13} className="text-[#C9A84C]" />
                      Chat
                    </Link>
                    <button
                      onClick={() => handleAttend(notif.id)}
                      disabled={isAttending}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-1 flex-shrink-0"
                    >
                      {isAttending ? (
                        <RefreshCw size={13} className="animate-spin text-slate-400" />
                      ) : (
                        <Check size={13} className="text-emerald-600" />
                      )}
                      Mark done
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div className="text-xs">
            Nothing needs your attention right now. When {partnerName} makes a deposit, it will show up here.
          </div>
        </div>
      )}

      {/* Full notification list (toggleable) */}
      {activeTab === 'ALL' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-fade-in">
          <div className="border-b border-slate-100 px-5 py-3.5 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              All notifications ({notifications.length})
            </h4>
          </div>

          {notifications.length === 0 ? (
            <p className="px-5 py-6 text-center text-xs text-slate-400">No notifications yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start justify-between gap-3 p-4 transition-colors ${
                    !n.read || (!n.attended && n.requiresAction) ? 'bg-amber-50/30' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{n.title}</span>
                      {n.attended ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-emerald-700">
                          Done
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.2 text-[10px] font-bold text-amber-800">
                          Open
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Link
                      href="/chat?thread=spouse"
                      className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0F1C3F] transition-colors flex items-center gap-1"
                      title="Discuss in couple chat"
                    >
                      <MessageSquareHeart size={12} className="text-[#C9A84C]" />
                      Chat
                    </Link>
                    {!n.attended && (
                      <button
                        onClick={() => handleAttend(n.id)}
                        disabled={attendingIds[n.id]}
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        Mark done
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
