'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell,
  X,
  Zap,
  CheckCircle2,
  ArrowRight,
  MessageSquareHeart,
} from 'lucide-react'

export default function NotificationBellDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unattendedCount, setUnattendedCount] = useState(0)
  const [loading, setLoading] = useState(false)
  // Deposit match promo, only when an admin has turned it on
  const [bonusActive, setBonusActive] = useState(false)
  const [bonusRate, setBonusRate] = useState(0)

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      if (data.success) {
        setNotifications(data.notifications || [])
        setUnattendedCount(data.unattendedCount || 0)
        setBonusActive(Boolean(data.bonusActive))
        setBonusRate(Number(data.bonusRate) || 0)
      }
    } catch (e) {
      console.warn('Failed to fetch notifications in bell', e)
    }
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleAttend = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications/${id}/attend`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, attended: true, read: true } : n))
        )
        setUnattendedCount((c) => Math.max(0, c - 1))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const urgentItems = notifications.filter((n) => n.requiresAction && !n.attended)

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-[#0F1C3F] hover:bg-slate-100 transition-colors"
        title="Notifications"
      >
        <Bell size={20} />
        {unattendedCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white ring-2 ring-white animate-pulse">
            {unattendedCount}
          </span>
        )}
      </button>

      {/* Slide-out Dropdown Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in sm:static sm:z-auto sm:bg-transparent">
          <div
            className="fixed inset-0 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative z-50 w-full sm:absolute sm:right-0 sm:top-12 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between bg-[#0F1C3F] p-4 text-white">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[#C9A84C]" />
                <h3 className="text-sm font-bold">Notifications</h3>
                {unattendedCount > 0 && (
                  <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white">
                    {unattendedCount} pending
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            {/* Deposit match promo (only while an admin has it switched on) */}
            {bonusActive && bonusRate > 0 && (
              <div className="bg-gradient-to-r from-amber-500 to-[#C9A84C] p-3 text-[#0F1C3F] flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <Zap size={14} className="fill-[#0F1C3F]" />
                  {Math.round(bonusRate * 1000) / 10}% cash match on deposits
                </span>
                <Link
                  href="/save"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg bg-[#0F1C3F] text-white px-2 py-1 text-[10px] font-black hover:bg-[#1a2f64] transition-colors"
                >
                  Deposit
                </Link>
              </div>
            )}

            {/* Notification List */}
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {urgentItems.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                  <p className="text-xs font-bold text-slate-800">Nothing needs your attention</p>
                  <p className="text-[11px] text-slate-500">
                    When your partner makes a deposit, it will show up here.
                  </p>
                </div>
              ) : (
                urgentItems.map((item) => (
                  <div key={item.id} className="p-3.5 space-y-2 bg-rose-50/30 hover:bg-rose-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[9px] font-black uppercase text-white">
                        Needs action
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{item.message}</p>
                    </div>
                    <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {item.link ? (
                          // /pay/* links redirect to Stripe, so they need a full page load
                          (() => {
                            const LinkEl = item.link.startsWith('/pay/') ? 'a' : Link
                            return (
                              <LinkEl
                                href={item.link}
                                onClick={() => setIsOpen(false)}
                                className="text-[11px] font-bold text-[#0F1C3F] hover:text-[#C9A84C] flex items-center gap-1"
                              >
                                {item.actionLabel || 'Open'} <ArrowRight size={11} />
                              </LinkEl>
                            )
                          })()
                        ) : null}
                        <Link
                          href="/chat?thread=spouse"
                          onClick={() => setIsOpen(false)}
                          className="text-[10px] font-bold text-slate-500 hover:text-[#0F1C3F] flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200"
                          title="Discuss this with your partner in chat"
                        >
                          <MessageSquareHeart size={11} className="text-[#C9A84C]" />
                          Chat
                        </Link>
                      </div>
                      <button
                        onClick={() => handleAttend(item.id)}
                        disabled={loading}
                        className="rounded-md bg-white border border-slate-300 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Mark done
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
              <Link
                href="/chat?thread=spouse"
                onClick={() => setIsOpen(false)}
                className="text-[#0F1C3F] hover:text-[#C9A84C] flex items-center gap-1"
              >
                <MessageSquareHeart size={13} className="text-[#C9A84C]" />
                Couple Chat
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="text-slate-600 hover:text-[#0F1C3F] hover:underline"
              >
                Dashboard →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
