'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Heart,
  Users,
  UserPlus,
  Mail,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  PiggyBank,
  Award,
  MessageSquareHeart,
  Shield,
  FileCheck,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Clock,
  Briefcase,
  ArrowLeftRight,
  Send,
  Eye,
  Info,
} from 'lucide-react'
import { MARRIAGE_TYPES } from '@/types/marriage'

export default function DemoDashboardPage() {
  // Demo Personas
  const [activePersona, setActivePersona] = useState<'jane' | 'marcus'>('jane')

  // Spouse Invitation & Status State
  const [partnerName, setPartnerName] = useState('Marcus Vance')
  const [partnerEmail, setPartnerEmail] = useState('marcus.vance@unionverify.com')
  const [selectedTypeId, setSelectedTypeId] = useState('OPPOSITE_SEX')
  const [invitationMessage, setInvitationMessage] = useState(
    'Jane has invited you to connect as equal co-spouse on Union Verify to co-sign your Marriage Certificate and manage joint 6.8% APY savings vaults.'
  )

  const [inviteStatus, setInviteStatus] = useState<'pending' | 'sent' | 'accepted'>('accepted')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [simulatingAcceptance, setSimulatingAcceptance] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [toastNotification, setToastNotification] = useState<string | null>(null)

  const currentType = MARRIAGE_TYPES.find((t) => t.id === selectedTypeId) || MARRIAGE_TYPES[0]

  const currentSpouseName = activePersona === 'jane' ? 'Jane Doe' : partnerName
  const partnerSpouseName = activePersona === 'jane' ? partnerName : 'Jane Doe'

  const showToast = (msg: string) => {
    setToastNotification(msg)
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        const ctx = new AudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.frequency.setValueAtTime(587.33, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12)
        gain.gain.setValueAtTime(0.12, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.35)
      }
    } catch {
      // Audio fallback
    }
    setTimeout(() => {
      setToastNotification(null)
    }, 4500)
  }

  const handleCopyInviteLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://unionverify.com'
    const link = `${origin}/join?partner=${encodeURIComponent(currentSpouseName)}&email=${encodeURIComponent(partnerEmail)}&type=${encodeURIComponent(currentType.label)}&role=${encodeURIComponent(currentType.defaultRole2)}`
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    showToast('Encrypted invitation link copied to clipboard!')
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault()
    setInviteStatus('sent')
    setShowInviteModal(false)
    showToast(`Official invitation dispatched to ${partnerEmail}!`)
  }

  const handleSimulateAcceptance = () => {
    setSimulatingAcceptance(true)
    setTimeout(() => {
      setSimulatingAcceptance(false)
      setInviteStatus('accepted')
      showToast(`🎉 ${partnerName} has accepted the invitation and digitally co-signed the certificate!`)
    }, 1500)
  }

  return (
    <div className="bg-slate-50 min-h-screen pt-20 sm:pt-24 pb-16 px-3 sm:px-6 lg:px-8">
      {/* ── TOAST NOTIFICATION ── */}
      {toastNotification && (
        <div className="fixed top-24 right-5 z-50 max-w-sm w-full bg-white rounded-2xl shadow-2xl border-2 border-[#C9A84C] p-4 flex items-start gap-3 animate-slide-up">
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-bold text-[#0F1C3F] block">Matrimonial Event</span>
            <p className="text-xs text-gray-600 leading-snug mt-0.5">{toastNotification}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── TOP DEMO BANNER & PERSONA SWITCHER ── */}
        <div className="bg-gradient-to-r from-[#0F1C3F] via-[#162752] to-[#0F1C3F] text-white p-4 sm:p-5 rounded-3xl shadow-lg border border-[#C9A84C]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center flex-shrink-0 text-[#C9A84C]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C9A84C]">
                  Interactive Demo Mode
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                  Zero Login Required
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                Full-Featured Matrimonial Investor Dashboard
              </h2>
            </div>
          </div>

          {/* Persona Switcher Buttons */}
          <div className="flex items-center gap-2 bg-white/10 p-1 rounded-2xl border border-white/15">
            <span className="text-[11px] font-semibold text-gray-300 px-2 hidden sm:inline">
              View Dashboard As:
            </span>
            <button
              onClick={() => setActivePersona('jane')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activePersona === 'jane'
                  ? 'bg-[#C9A84C] text-[#0F1C3F] shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Spouse 1 (Jane)
            </button>
            <button
              onClick={() => setActivePersona('marcus')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activePersona === 'marcus'
                  ? 'bg-[#C9A84C] text-[#0F1C3F] shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Spouse 2 (Marcus)
            </button>
          </div>
        </div>

        {/* ── SPOUSE INVITATION & CO-BENEFICIARY STUDIO ── */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-200 shadow-md relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-wider border border-rose-200">
                  <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                  Spouse Connection Studio
                </span>
                {inviteStatus === 'accepted' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Dual Signatures Verified · 50/50 Active
                  </span>
                ) : inviteStatus === 'sent' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Invitation Sent · Awaiting Spouse
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                    Pending Invite
                  </span>
                )}
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-[#0F1C3F]">
                Invite Your Spouse & Enable Equal Joint Access
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Connect your spouse to review mutual wealth, co-sign the certified Marriage Certificate, and jointly fund 6.8% APY milestone savings vaults.
              </p>

              {/* Connected Spouse Profile Pill */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-gray-700">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                  <Users className="w-3.5 h-3.5 text-[#C9A84C]" />
                  <span>Spouse: <strong>{partnerName}</strong> ({partnerEmail})</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                  <Award className="w-3.5 h-3.5 text-[#0F1C3F]" />
                  <span>Classification: <strong>{currentType.label}</strong></span>
                </div>
              </div>
            </div>

            {/* Interactive Actions Grid */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 flex-shrink-0 min-w-[240px]">
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0F1C3F] hover:bg-[#1b2d5a] text-white font-bold text-xs transition-all shadow-md"
              >
                <UserPlus className="w-4 h-4 text-[#C9A84C]" />
                <span>Configure & Invite Spouse</span>
              </button>

              <button
                onClick={handleCopyInviteLink}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs transition-all shadow-sm"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Join Link'}</span>
              </button>

              {inviteStatus !== 'accepted' && (
                <button
                  onClick={handleSimulateAcceptance}
                  disabled={simulatingAcceptance}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-xs transition-all shadow-md shadow-[#C9A84C]/20 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${simulatingAcceptance ? 'animate-spin' : ''}`} />
                  <span>{simulatingAcceptance ? 'Simulating...' : 'Simulate Spouse Acceptance'}</span>
                </button>
              )}

              <Link
                href="/chat"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all"
              >
                <MessageSquareHeart className="w-4 h-4 text-rose-500" />
                <span>Open Mutual Chat</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── TOP STATS BAR ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <span className="text-xs text-gray-500 font-medium">Total Matrimonial Capital</span>
            <div className="text-2xl sm:text-3xl font-bold text-[#0F1C3F] mt-1">$125,000.00</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>50/50 Dual Survivorship</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <span className="text-xs text-gray-500 font-medium">Marriage Savings Vaults</span>
            <div className="text-2xl sm:text-3xl font-bold text-[#C9A84C] mt-1">$37,500.00</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-[#0F1C3F]">
              <PiggyBank className="w-3.5 h-3.5 text-[#C9A84C]" />
              <span>6.80% Compounding APY</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <span className="text-xs text-gray-500 font-medium">Yield Distributions Received</span>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-1">$8,450.00</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-gray-500">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Credited to Liquid Ledger</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <span className="text-xs text-gray-500 font-medium">Certificate Docket Status</span>
            <div className="text-base sm:text-lg font-bold text-[#0F1C3F] mt-1 truncate">
              {inviteStatus === 'accepted' ? 'CH-MIC-2026-98420' : 'Awaiting Sign-off'}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-purple-700">
              <Award className="w-3.5 h-3.5 text-[#C9A84C]" />
              <span>Gold Seal Validated</span>
            </div>
          </div>
        </div>

        {/* ── MATRIMONIAL SAVINGS VAULTS HIGHLIGHT ── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A84C]/15 text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-1">
                <PiggyBank className="w-3.5 h-3.5" />
                Shared Marital Goals
              </div>
              <h3 className="text-xl font-bold text-[#0F1C3F]">
                Dual-Partner Marriage Savings Vaults
              </h3>
            </div>

            <Link
              href="/savings"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#C9A84C] hover:underline"
            >
              Open Full Vaults Manager <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 4 Vaults Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: 'Family Dream Home Down Payment',
                target: 50000,
                current: 32500,
                partner1: 16250,
                partner2: 16250,
                color: 'bg-indigo-600',
              },
              {
                title: 'First Baby & Education Nest Egg',
                target: 20000,
                current: 14200,
                partner1: 7100,
                partner2: 7100,
                color: 'bg-rose-600',
              },
              {
                title: '10-Year Anniversary Trip (Amalfi Coast)',
                target: 10000,
                current: 6800,
                partner1: 3400,
                partner2: 3400,
                color: 'bg-amber-600',
              },
              {
                title: 'Joint Emergency Liquid Buffer',
                target: 15000,
                current: 12000,
                partner1: 6000,
                partner2: 6000,
                color: 'bg-emerald-600',
              },
            ].map((v, i) => {
              const pct = Math.round((v.current / v.target) * 100)
              return (
                <div key={i} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#0F1C3F] truncate">{v.title}</h4>
                    <span className="text-xs font-bold text-[#C9A84C] font-mono">{pct}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-indigo-600 h-full"
                      style={{ width: `${pct / 2}%` }}
                      title={`${currentSpouseName}: $${v.partner1.toLocaleString()}`}
                    />
                    <div
                      className="bg-[#C9A84C] h-full"
                      style={{ width: `${pct / 2}%` }}
                      title={`${partnerSpouseName}: $${v.partner2.toLocaleString()}`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 font-mono pt-1">
                    <span>${v.current.toLocaleString()} / ${v.target.toLocaleString()}</span>
                    <span>50/50 Split ($${(v.current / 2).toLocaleString()} each)</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── ACTIVE INVESTMENTS TABLE ── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#C9A84C] block mb-1">
                Institutional USD Funds
              </span>
              <h3 className="text-xl font-bold text-[#0F1C3F]">Active Matrimonial Portfolio</h3>
            </div>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#C9A84C] hover:underline"
            >
              View Full Portfolio <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-2">Fund Opportunity</th>
                  <th className="py-3 px-2">Principal ($)</th>
                  <th className="py-3 px-2">Projected Annual Yield</th>
                  <th className="py-3 px-2">Distribution Cadence</th>
                  <th className="py-3 px-2">Beneficial Entitlement</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                <tr className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-2 font-bold text-[#0F1C3F]">
                    Global Infrastructure Debt Fund
                  </td>
                  <td className="py-3 px-2 font-mono text-gray-900">$50,000.00</td>
                  <td className="py-3 px-2 font-bold text-emerald-700">14.2% APY</td>
                  <td className="py-3 px-2 text-gray-600">Monthly Payout</td>
                  <td className="py-3 px-2 text-indigo-700 font-semibold">Equal 50/50 Split</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ACTIVE
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-2 font-bold text-[#0F1C3F]">
                    Clean Energy Sovereign Yield Fund
                  </td>
                  <td className="py-3 px-2 font-mono text-gray-900">$45,000.00</td>
                  <td className="py-3 px-2 font-bold text-emerald-700">12.8% APY</td>
                  <td className="py-3 px-2 text-gray-600">Monthly Payout</td>
                  <td className="py-3 px-2 text-indigo-700 font-semibold">Equal 50/50 Split</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ACTIVE
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-2 font-bold text-[#0F1C3F]">
                    Core Sovereign Debt Reserve Fund
                  </td>
                  <td className="py-3 px-2 font-mono text-gray-900">$30,000.00</td>
                  <td className="py-3 px-2 font-bold text-emerald-700">9.5% APY</td>
                  <td className="py-3 px-2 text-gray-600">Quarterly Payout</td>
                  <td className="py-3 px-2 text-indigo-700 font-semibold">Equal 50/50 Split</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MODAL: CONFIGURE & INVITE SPOUSE ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F1C3F]">Invite Your Spouse</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Spouse Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="e.g. Marcus Vance"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#C9A84C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Spouse Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="e.g. marcus@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#C9A84C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Matrimonial Union Classification
                </label>
                <select
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#C9A84C] focus:outline-none"
                >
                  {MARRIAGE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Personal Invitation Message
                </label>
                <textarea
                  rows={3}
                  value={invitationMessage}
                  onChange={(e) => setInvitationMessage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-300 text-xs font-serif leading-relaxed focus:ring-2 focus:ring-[#C9A84C] focus:outline-none"
                />
              </div>

              {/* Direct Link Preview */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                  Live Registration Link Preview:
                </span>
                <span className="font-mono text-[11px] text-gray-700 break-all select-all">
                  https://unionverify.com/join?partner={encodeURIComponent(currentSpouseName)}&email={encodeURIComponent(partnerEmail)}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="flex-1 py-3 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold transition-all text-center"
                >
                  Copy Join Link
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#0F1C3F] hover:bg-[#1b2d5a] text-white font-bold transition-all shadow-md text-center"
                >
                  Send Invitation Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
