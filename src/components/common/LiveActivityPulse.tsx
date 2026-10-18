'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Heart,
  Award,
  PiggyBank,
  Sparkles,
  Users,
  Flame,
  Gift,
  X,
  ChevronRight,
  Volume2,
  VolumeX,
} from 'lucide-react'

interface ActivityEvent {
  id: string
  type: 'MARRIAGE' | 'GIFT' | 'VAULT' | 'SYNDICATE' | 'STREAK' | 'DONATION' | 'CERTIFICATE'
  title: string
  subtitle: string
  location: string
  timeAgo: string
  href: string
  badgeText: string
  badgeBg: string
  badgeTextCol: string
  icon: any
}

const LIVE_EVENTS: ActivityEvent[] = [
  {
    id: 'evt-1',
    type: 'MARRIAGE',
    title: 'Liam & Chloe Bennett',
    subtitle: 'Solemnized their civil marriage registration',
    location: 'Seattle, WA',
    timeAgo: '2m ago',
    href: '/get-married',
    badgeText: 'New Marriage',
    badgeBg: 'bg-rose-50 border-rose-200',
    badgeTextCol: 'text-rose-700',
    icon: Heart,
  },
  {
    id: 'evt-2',
    type: 'GIFT',
    title: 'Aunt Claudia & Viktor',
    subtitle: 'Gifted $500 to Marcus & Elena’s Honeymoon Fund',
    location: 'New York, NY',
    timeAgo: '4m ago',
    href: '/registry/marcus-and-elena',
    badgeText: 'Wedding Gift',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeTextCol: 'text-amber-800',
    icon: Gift,
  },
  {
    id: 'evt-3',
    type: 'VAULT',
    title: 'Joint Spousal Deposit',
    subtitle: 'Contributed $1,500 to First Home Down Payment Vault',
    location: 'Chicago, IL',
    timeAgo: '7m ago',
    href: '/savings',
    badgeText: 'Savings Milestone',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeTextCol: 'text-emerald-700',
    icon: PiggyBank,
  },
  {
    id: 'evt-4',
    type: 'SYNDICATE',
    title: '4 Friends Pooled $1,000',
    subtitle: 'Secured Backstage VIP Tier in Timeless World Tour',
    location: 'Atlanta, GA',
    timeAgo: '11m ago',
    href: '/friends',
    badgeText: 'Friends Syndicate',
    badgeBg: 'bg-indigo-50 border-indigo-200',
    badgeTextCol: 'text-indigo-700',
    icon: Users,
  },
  {
    id: 'evt-5',
    type: 'STREAK',
    title: 'Sophia & Jordan Hayes',
    subtitle: 'Reached 14-Day Wealth Streak (+0.25% APY Booster)',
    location: 'Miami, FL',
    timeAgo: '15m ago',
    href: '/quests',
    badgeText: 'Streak Milestone',
    badgeBg: 'bg-orange-50 border-orange-200',
    badgeTextCol: 'text-orange-700',
    icon: Flame,
  },
  {
    id: 'evt-6',
    type: 'DONATION',
    title: 'Anonymous Philanthropist',
    subtitle: 'Contributed $250 to LGBTQ+ Youth Crisis Shelter',
    location: 'San Francisco, CA',
    timeAgo: '19m ago',
    href: '/community',
    badgeText: 'Community Impact',
    badgeBg: 'bg-blue-50 border-blue-200',
    badgeTextCol: 'text-blue-700',
    icon: Sparkles,
  },
  {
    id: 'evt-7',
    type: 'CERTIFICATE',
    title: 'David & Jordan',
    subtitle: 'Authenticated 24K Gold-Embossed Marriage Certificate',
    location: 'Austin, TX',
    timeAgo: '24m ago',
    href: '/certificate',
    badgeText: 'Legal Seal Issued',
    badgeBg: 'bg-purple-50 border-purple-200',
    badgeTextCol: 'text-purple-700',
    icon: Award,
  },
]

export function LiveActivityPulse() {
  const pathname = usePathname()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)
  const [activeCouplesCount, setActiveCouplesCount] = useState(312)

  // Rotate events every 8 seconds (only active on home page '/')
  useEffect(() => {
    if (isDismissed || pathname !== '/') return

    const interval = setInterval(() => {
      setIsVisible(false)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % LIVE_EVENTS.length)
        setIsVisible(true)
      }, 400)
    }, 8000)

    return () => clearInterval(interval)
  }, [isDismissed, pathname])

  // Random gentle fluctuations in active users (only active on home page '/')
  useEffect(() => {
    if (pathname !== '/') return

    const userInterval = setInterval(() => {
      setActiveCouplesCount((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2
        return Math.max(280, Math.min(365, prev + delta))
      })
    }, 15000)

    return () => clearInterval(userInterval)
  }, [pathname])

  // ONLY render on the public landing page ('/') — never on chat, dashboard, or internal tools
  if (pathname !== '/') {
    return null
  }

  if (isDismissed) {
    return (
      <button
        onClick={() => setIsDismissed(false)}
        className="fixed bottom-4 left-4 z-40 px-3 py-1.5 rounded-full bg-[#0F1C3F]/90 text-white text-[11px] font-bold shadow-lg border border-[#C9A84C]/40 backdrop-blur-md flex items-center gap-1.5 hover:bg-[#0F1C3F] transition-all"
        title="Open Live Activity Pulse"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="w-2 h-2 rounded-full bg-emerald-500 absolute" />
        <span>Live Pulse · {activeCouplesCount} Online</span>
      </button>
    )
  }

  const currentEvent = LIVE_EVENTS[currentIndex]
  const IconComponent = currentEvent.icon

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] sm:w-auto animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
      <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl shadow-black/10 p-3.5 sm:p-4 text-slate-800 transition-all hover:shadow-2xl hover:border-[#C9A84C]/50 relative overflow-hidden group">
        {/* Subtle Top Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0F1C3F] via-[#C9A84C] to-emerald-500" />

        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-slate-600">
              Live Network Pulse · <strong className="text-emerald-600 font-bold">{activeCouplesCount}</strong> couples active
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">{currentEvent.timeAgo}</span>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
              aria-label="Dismiss Live Pulse"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <Link
          href={currentEvent.href}
          className={`flex items-start gap-3 transition-opacity duration-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
        >
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-[#0F1C3F]/5 border border-[#0F1C3F]/10 flex items-center justify-center flex-shrink-0 text-[#0F1C3F] group-hover:scale-105 transition-transform">
            <IconComponent className="w-5 h-5 text-[#C9A84C]" />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${currentEvent.badgeBg} ${currentEvent.badgeTextCol}`}
              >
                {currentEvent.badgeText}
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                {currentEvent.location}
              </span>
            </div>

            <h4 className="text-xs font-bold text-[#0F1C3F] truncate group-hover:text-[#C9A84C] transition-colors">
              {currentEvent.title}
            </h4>
            <p className="text-[11px] text-slate-600 line-clamp-1 leading-snug">
              {currentEvent.subtitle}
            </p>
          </div>

          {/* Arrow */}
          <div className="self-center flex-shrink-0 text-slate-400 group-hover:text-[#0F1C3F] group-hover:translate-x-0.5 transition-all">
            <ChevronRight size={14} />
          </div>
        </Link>
      </div>
    </div>
  )
}
