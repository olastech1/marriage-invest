'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SEED_REGISTRIES, CoupleRegistry, RegistryGift, RegistryFund } from '@/types/registry'
import SendGiftModal from '@/components/registry/SendGiftModal'
import {
  Heart,
  Gift,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Share2,
  Copy,
  Check,
  QrCode,
  Plane,
  Home,
  Baby,
  HeartHandshake,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react'

export default function CoupleRegistryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = use(params)
  const initialRegistry = SEED_REGISTRIES.find((r) => r.slug === resolvedParams.slug)

  if (!initialRegistry) {
    notFound()
  }

  const [registry, setRegistry] = useState<CoupleRegistry>(initialRegistry)
  const [activeGiftModal, setActiveGiftModal] = useState<boolean>(false)
  const [selectedFundId, setSelectedFundId] = useState<string | undefined>(undefined)
  const [copiedLink, setCopiedLink] = useState<boolean>(false)
  const [showQrCode, setShowQrCode] = useState<boolean>(false)

  // Countdown timer calculations
  const [countdown, setCountdown] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const target = new Date(registry.weddingDate).getTime()

    const updateTimer = () => {
      const now = new Date().getTime()
      const diff = Math.max(0, target - now)

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setCountdown({ days, hours, minutes, seconds })
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [registry.weddingDate])

  const handleGiftSent = (newGift: RegistryGift) => {
    setRegistry((prev) => {
      const updatedGifts = [newGift, ...prev.gifts]
      const updatedFunds = prev.funds.map((f) => {
        if (f.id === newGift.fundId) {
          return { ...f, currentAmount: f.currentAmount + newGift.amount }
        }
        return f
      })
      const updatedTotal = prev.currentTotal + newGift.amount
      return {
        ...prev,
        currentTotal: updatedTotal,
        funds: updatedFunds,
        gifts: updatedGifts,
      }
    })
  }

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  const totalFundedPct = Math.min(
    100,
    Math.round((registry.currentTotal / registry.targetTotal) * 100)
  )

  const getFundIcon = (iconName: string) => {
    switch (iconName) {
      case 'Plane':
        return Plane
      case 'Home':
        return Home
      case 'Baby':
        return Baby
      default:
        return HeartHandshake
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* ── Couple Hero Section ────────────────────────────────────────── */}
      <section className="relative bg-[#0F1C3F] text-white overflow-hidden pt-24 pb-20">
        {/* Cover Photo Backdrop */}
        <div className="absolute inset-0 z-0 opacity-20">
          <img
            src={registry.coverPhoto}
            alt="Couple Celebration"
            className="w-full h-full object-cover filter blur-sm scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1C3F] via-[#0F1C3F]/80 to-transparent z-0" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-bold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 fill-[#C9A84C]" />
            Official Wedding & Milestone Cash Registry
          </div>

          <h1 className="text-4xl sm:text-6xl font-black font-serif tracking-tight text-white leading-tight">
            {registry.partner1Name} & {registry.partner2Name}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-slate-300">
            <span className="flex items-center gap-1.5">
              <Calendar size={15} className="text-[#C9A84C]" />
              {new Date(registry.weddingDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <MapPin size={15} className="text-[#C9A84C]" />
              {registry.weddingLocation}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <TrendingUp size={15} />
              Vault Yield: {registry.vaultApy}% APY
            </span>
          </div>

          {/* Countdown Clock */}
          <div className="pt-2 flex items-center justify-center gap-3 sm:gap-4 max-w-lg mx-auto">
            {[
              { val: countdown.days, label: 'Days' },
              { val: countdown.hours, label: 'Hours' },
              { val: countdown.minutes, label: 'Mins' },
              { val: countdown.seconds, label: 'Secs' },
            ].map((unit, i) => (
              <div
                key={i}
                className="w-20 sm:w-24 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center"
              >
                <span className="block text-2xl sm:text-3xl font-black text-white font-mono">
                  {String(unit.val).padStart(2, '0')}
                </span>
                <span className="block text-[10px] text-slate-300 uppercase tracking-widest font-semibold mt-0.5">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setSelectedFundId(undefined)
                setActiveGiftModal(true)
              }}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#C9A84C] text-[#0F1C3F] font-bold text-sm shadow-lg hover:bg-[#d8b659] transition-all transform hover:-translate-y-0.5"
            >
              <Gift size={16} />
              Send a Wedding Cash Gift
            </button>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all border border-white/20"
            >
              {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copiedLink ? 'Registry Link Copied!' : 'Share Registry'}
            </button>

            <button
              onClick={() => setShowQrCode(!showQrCode)}
              className="inline-flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all border border-white/20"
              title="Show QR Code for Invitations"
            >
              <QrCode size={14} />
              QR Code
            </button>
          </div>

          {/* QR Code Modal Drawer */}
          {showQrCode && (
            <div className="max-w-xs mx-auto p-4 rounded-2xl bg-white text-slate-900 shadow-2xl animate-in zoom-in-95 duration-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Invitation Card QR Code
              </span>
              <div className="w-40 h-40 mx-auto bg-slate-100 rounded-xl flex items-center justify-center border-2 border-slate-200">
                <QrCode size={96} className="text-[#0F1C3F]" />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Print on your physical wedding invitations so guests can scan with their smartphone camera.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Couple Love Story & Welcome ───────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-3xl bg-white border border-gray-200 p-8 shadow-sm space-y-4 text-center">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#C9A84C] bg-[#C9A84C]/10 px-3 py-1 rounded-full">
            A Note From The Couple
          </span>
          <h2 className="text-2xl font-bold font-serif text-[#0F1C3F]">
            Our Love Story & Welcome
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto italic font-serif">
            &ldquo;{registry.greeting}&rdquo;
          </p>
          <div className="w-12 h-0.5 bg-[#C9A84C]/40 mx-auto" />
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-2xl mx-auto">
            {registry.story}
          </p>
        </div>
      </section>

      {/* ── Milestone Funds Grid ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              6.8% APY Spousal Savings Vault
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-[#0F1C3F] mt-1.5">
              Explore Our Dedicated Milestone Funds
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Choose which chapter of our marriage you’d love to support. Every dollar is deposited directly into our high-yield spousal vault.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-right self-start sm:self-auto">
            <span className="text-[11px] text-gray-500 block">TOTAL GIFTS ACCUMULATED</span>
            <span className="text-xl font-black text-[#0F1C3F]">
              ${registry.currentTotal.toLocaleString()}
              <span className="text-gray-400 font-normal text-xs"> of ${registry.targetTotal.toLocaleString()}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {registry.funds.map((fund) => {
            const Icon = getFundIcon(fund.icon)
            const pct = Math.min(100, Math.round((fund.currentAmount / fund.targetAmount) * 100))

            return (
              <div
                key={fund.id}
                className="rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden p-6 space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0F1C3F]/5 border border-[#0F1C3F]/10 text-[#0F1C3F] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6 text-[#C9A84C]" />
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-[#0F1C3F] group-hover:text-[#C9A84C] transition-colors">
                      {fund.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {fund.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#0F1C3F] font-bold">
                      ${fund.currentAmount.toLocaleString()}
                      <span className="text-gray-400 font-normal"> / ${fund.targetAmount.toLocaleString()}</span>
                    </span>
                    <span className="text-emerald-600 font-bold">{pct}%</span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#C9A84C] to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <button
                    onClick={() => {
                      setSelectedFundId(fund.id)
                      setActiveGiftModal(true)
                    }}
                    className="w-full mt-2 py-2.5 rounded-xl bg-[#0F1C3F] text-white font-bold text-xs hover:bg-[#1a2f64] transition-all flex items-center justify-center gap-1.5 shadow-sm group-hover:bg-[#C9A84C] group-hover:text-[#0F1C3F]"
                  >
                    <Gift size={13} />
                    Contribute to this Fund
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Live Wedding Guestbook & Blessings ────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#C9A84C] bg-[#C9A84C]/10 px-2.5 py-0.5 rounded-full">
              Wedding Guestbook
            </span>
            <h3 className="text-2xl font-black text-[#0F1C3F] mt-1">
              Guest Blessings & Well Wishes ({registry.gifts.length})
            </h3>
          </div>

          <button
            onClick={() => {
              setSelectedFundId(undefined)
              setActiveGiftModal(true)
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F1C3F] hover:text-[#C9A84C] transition-colors"
          >
            Leave a Blessing <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {registry.gifts.map((gift) => (
            <div
              key={gift.id}
              className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm hover:border-[#C9A84C] transition-all space-y-3 relative overflow-hidden"
            >
              {/* Card Accent Top Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#C9A84C]" />

              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0F1C3F] flex items-center gap-1.5">
                  <Heart size={13} className="fill-rose-500 text-rose-500" />
                  {gift.donorName}
                </span>
                <span className="text-[11px] text-gray-400">
                  {new Date(gift.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p className="text-xs text-gray-700 italic font-serif leading-relaxed">
                &ldquo;{gift.message}&rdquo;
              </p>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Gifted ${gift.amount.toLocaleString()} USD
                </span>
                <span className="text-slate-400">Verified Guestbook Seal</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Active Gift Modal ─────────────────────────────────────────── */}
      {activeGiftModal && (
        <SendGiftModal
          registry={registry}
          initialFundId={selectedFundId}
          onClose={() => setActiveGiftModal(false)}
          onGiftSent={handleGiftSent}
        />
      )}
    </div>
  )
}
