'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Award,
  Lock,
  Unlock,
  CheckCircle2,
  Mail,
  Send,
  Download,
  Printer,
  Copy,
  Check,
  Shield,
  Heart,
  Calendar,
  AlertCircle,
  CreditCard,
  Sparkles,
  ArrowRight,
  FileCheck,
  Users,
} from 'lucide-react'

export interface MarriageTypeOption {
  id: string
  label: string
  category: string
  certificateTitle: string
  covenantSubtitle: string
  sealBadgeText: string
  defaultRole1: string
  defaultRole2: string
  description: string
  badgeColor: string
}

export const MARRIAGE_TYPES: MarriageTypeOption[] = [
  {
    id: 'SAME_SEX_GAY',
    label: 'Same-Sex Marriage (Gay / Husbands)',
    category: 'Same-Sex Matrimony',
    certificateTitle: 'Certificate of Same-Sex Marriage Investment',
    covenantSubtitle: 'Official Matrimonial Covenant of Joint Wealth & Mutual Survivorship between Husbands',
    sealBadgeText: 'SAME-SEX COVENANT',
    defaultRole1: 'Husband',
    defaultRole2: 'Husband',
    description: 'Equal joint survivorship, 50/50 capital rights & mutual fiduciary protection for male spouses.',
    badgeColor: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  },
  {
    id: 'SAME_SEX_LESBIAN',
    label: 'Same-Sex Marriage (Lesbian / Wives)',
    category: 'Same-Sex Matrimony',
    certificateTitle: 'Certificate of Same-Sex Marriage Investment',
    covenantSubtitle: 'Official Matrimonial Covenant of Joint Wealth & Mutual Survivorship between Wives',
    sealBadgeText: 'SAME-SEX COVENANT',
    defaultRole1: 'Wife',
    defaultRole2: 'Wife',
    description: 'Equal joint survivorship, 50/50 capital rights & mutual fiduciary protection for female spouses.',
    badgeColor: 'bg-rose-50 border-rose-200 text-rose-700',
  },
  {
    id: 'CIVIL_MARRIAGE',
    label: 'Civil Marriage (Husband & Wife)',
    category: 'Civil Matrimony',
    certificateTitle: 'Certificate of Marriage Investment',
    covenantSubtitle: 'Official Matrimonial Covenant of Shared Wealth & Mutual Survivorship',
    sealBadgeText: 'CIVIL MARRIAGE',
    defaultRole1: 'Husband',
    defaultRole2: 'Wife',
    description: 'Traditional civil marriage covenant under Zurich & London fiduciary protocols.',
    badgeColor: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  {
    id: 'CIVIL_UNION',
    label: 'Registered Civil Union / Legal Partnership',
    category: 'Registered Civil Union',
    certificateTitle: 'Certificate of Civil Union & Investment',
    covenantSubtitle: 'Official Registered Civil Union Covenant of Equal Capital Custody',
    sealBadgeText: 'CIVIL UNION SEAL',
    defaultRole1: 'Registered Partner',
    defaultRole2: 'Registered Partner',
    description: 'Statutory civil partnership enjoying identical financial rights and dual survivorship.',
    badgeColor: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  {
    id: 'DOMESTIC_PARTNERSHIP',
    label: 'Domestic Partnership',
    category: 'Domestic Partnership',
    certificateTitle: 'Certificate of Domestic Partnership Investment',
    covenantSubtitle: 'Official Domestic Partnership Covenant of Shared Economic Assets',
    sealBadgeText: 'DOMESTIC PARTNERSHIP',
    defaultRole1: 'Domestic Partner',
    defaultRole2: 'Domestic Partner',
    description: 'Recognized domestic cohabitation partnership with co-beneficiary rights across all investment yields.',
    badgeColor: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  {
    id: 'UNIVERSAL_COVENANT',
    label: 'Universal Life Partnership Covenant',
    category: 'Universal Life Union',
    certificateTitle: 'Certificate of Life Partnership Investment',
    covenantSubtitle: 'Universal Covenant of Mutual Capital Trust & Co-Beneficiary Entitlement',
    sealBadgeText: 'UNIVERSAL COVENANT',
    defaultRole1: 'Spouse',
    defaultRole2: 'Spouse',
    description: 'Universal fiduciary covenant applicable to all life partners with reciprocal inheritance.',
    badgeColor: 'bg-purple-50 border-purple-200 text-purple-700',
  },
]

export default function MarriageCertificatePage() {
  const { data: session } = useSession()
  const userName = session?.user?.name || 'Julian Sterling'
  const userEmail = session?.user?.email || 'julian.sterling@unioninvest.com'

  // Union & Marriage Type state
  const [selectedTypeId, setSelectedTypeId] = useState('SAME_SEX_GAY')
  const [role1, setRole1] = useState('Husband')
  const [role2, setRole2] = useState('Husband')

  const currentType = MARRIAGE_TYPES.find((t) => t.id === selectedTypeId) || MARRIAGE_TYPES[0]

  const handleTypeSelect = (typeId: string) => {
    setSelectedTypeId(typeId)
    const t = MARRIAGE_TYPES.find((item) => item.id === typeId)
    if (t) {
      setRole1(t.defaultRole1)
      setRole2(t.defaultRole2)
    }
  }

  // Invitation state
  const [partnerName, setPartnerName] = useState('Marcus Vance')
  const [partnerEmail, setPartnerEmail] = useState('marcus.vance@unioninvest.com')
  const [weddingDate, setWeddingDate] = useState('2024-06-15')
  const [inviteSent, setInviteSent] = useState(true)
  const [copied, setCopied] = useState(false)

  // Signing state
  const [primarySigned, setPrimarySigned] = useState(true)
  const [primarySignDate, setPrimarySignDate] = useState('Oct 12, 2026')
  const [partnerSigned, setPartnerSigned] = useState(true)
  const [partnerSignDate, setPartnerSignDate] = useState('Oct 13, 2026')

  // Payment & Access state
  const [isPaid, setIsPaid] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [cardCvc, setCardCvc] = useState('123')

  const certificateNumber = 'CH-MIC-2026-98420'

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault()
    setInviteSent(true)
  }

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/join?partner=${encodeURIComponent(userName)}&email=${encodeURIComponent(partnerEmail)}&type=${encodeURIComponent(currentType.label)}&role=${encodeURIComponent(role2)}`
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePay = () => {
    setProcessingPayment(true)
    setTimeout(() => {
      setProcessingPayment(false)
      setIsPaid(true)
      setShowPaymentModal(false)
    }, 1200)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A84C]/15 text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-2">
            <Heart className="w-3.5 h-3.5 fill-[#C9A84C]" />
            Marriage Investment Covenant
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F1C3F]">
            Official Marriage Investment Certificate
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Invite your spouse, sign your digital covenant together, and complete the one-time $49 legal registry fee to unlock your official high-resolution certificate and start investing.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {isPaid ? (
            <>
              <button
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4 text-gray-500" />
                Print / PDF
              </button>
              <Link
                href="/deposits"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A84C] text-[#0F1C3F] font-bold text-sm hover:bg-[#d4b460] transition-colors shadow-md shadow-[#C9A84C]/25"
              >
                Start Investing
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F1C3F] text-white font-bold text-sm hover:bg-[#1a2c5e] transition-colors shadow-md shadow-[#0F1C3F]/25 w-full sm:w-auto"
            >
              <Lock className="w-4 h-4 text-[#C9A84C]" />
              Pay $49 to Unlock Certificate
            </button>
          )}
        </div>
      </div>

      {/* ── STEPS PROGRESS BAR ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-sm text-xs">
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-emerald-50 text-emerald-800 font-medium">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
          <div className="min-w-0">
            <span className="block font-bold text-[11px] sm:text-xs">1. Registered</span>
            <span className="text-[10px] sm:text-[11px] text-emerald-700 truncate block">{userName}</span>
          </div>
        </div>

        <div className={`flex items-center gap-2.5 p-2 rounded-lg font-medium ${
          inviteSent ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-50 text-gray-600'
        }`}>
          <CheckCircle2 className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${inviteSent ? 'text-emerald-600' : 'text-gray-400'}`} />
          <div className="min-w-0">
            <span className="block font-bold text-[11px] sm:text-xs">2. Invited</span>
            <span className="text-[10px] sm:text-[11px] truncate block">{inviteSent ? partnerName : 'Pending'}</span>
          </div>
        </div>

        <div className={`flex items-center gap-3 p-2 rounded-lg font-medium ${
          primarySigned && partnerSigned ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
        }`}>
          <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${
            primarySigned && partnerSigned ? 'text-emerald-600' : 'text-amber-500'
          }`} />
          <div>
            <span className="block font-bold">3. Dual Signatures</span>
            <span className="text-[11px]">
              {primarySigned && partnerSigned ? 'Both Signed' : 'Awaiting Signatures'}
            </span>
          </div>
        </div>

        <div className={`flex items-center gap-3 p-2 rounded-lg font-medium ${
          isPaid ? 'bg-emerald-50 text-emerald-800' : 'bg-[#0F1C3F]/5 text-[#0F1C3F]'
        }`}>
          {isPaid ? (
            <Unlock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <Lock className="w-5 h-5 text-[#C9A84C] flex-shrink-0" />
          )}
          <div>
            <span className="block font-bold">4. Pay & Unlock ($49)</span>
            <span className="text-[11px] font-semibold text-[#C9A84C]">
              {isPaid ? 'Paid & Certified' : 'Issuance Fee Due'}
            </span>
          </div>
        </div>
      </div>

      {/* ── PARTNER INVITATION & COVENANT CARD ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F1C3F]/5 text-[#0F1C3F] flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#C9A84C]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F1C3F]">Partner Invitation & Joint Covenant</h2>
              <p className="text-xs text-gray-500">Configure your marriage type, customize spouse roles, and invite your partner to sign.</p>
            </div>
          </div>

          {inviteSent && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Invite Link Copied!' : 'Copy Partner Invite Link'}
              </button>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                Invitation Active
              </span>
            </div>
          )}
        </div>

        {/* ── UNION & MARRIAGE TYPE SELECTOR ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0F1C3F] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#C9A84C]" />
              Select Marriage / Partnership Type
            </label>
            <span className="text-xs text-gray-500 font-medium">
              Active: <strong className="text-[#0F1C3F]">{currentType.label}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MARRIAGE_TYPES.map((type) => {
              const isSelected = type.id === selectedTypeId
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleTypeSelect(type.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all relative ${
                    isSelected
                      ? 'border-[#C9A84C] bg-[#C9A84C]/5 shadow-sm ring-2 ring-[#C9A84C]/30'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${type.badgeColor}`}>
                      {type.category}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-[#C9A84C] text-[#0F1C3F] flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-[#0F1C3F] leading-snug">
                    {type.label}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {type.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── PARTNER & ROLE DETAILS FORM ── */}
        <form onSubmit={handleSendInvite} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Spouse / Partner Name
            </label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Partner Email Address
            </label>
            <input
              type="email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Marriage / Anniversary Date
            </label>
            <input
              type="date"
              value={weddingDate}
              onChange={(e) => setWeddingDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            />
          </div>
        </form>

        {/* ── CUSTOM SPOUSE / PARTNER ROLES ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Primary Partner Role Title
            </label>
            <input
              type="text"
              value={role1}
              onChange={(e) => setRole1(e.target.value)}
              placeholder="Husband, Wife, Spouse, Partner..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            />
            <span className="text-[10px] text-gray-400 mt-1 block">Displayed on certificate for {userName}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Second Partner Role Title
            </label>
            <input
              type="text"
              value={role2}
              onChange={(e) => setRole2(e.target.value)}
              placeholder="Husband, Wife, Spouse, Partner..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            />
            <span className="text-[10px] text-gray-400 mt-1 block">Displayed on certificate for {partnerName}</span>
          </div>
        </div>

        {/* Dual Signature Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          {/* Partner 1 (User) */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block">
                {role1} (Primary)
              </span>
              <p className="text-sm font-bold text-[#0F1C3F]">{userName}</p>
              <p className="text-xs text-gray-500">Signed: {primarySignDate}</p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <Check className="w-3.5 h-3.5" /> Digitally Signed
            </span>
          </div>

          {/* Partner 2 (Spouse) */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block">
                {role2} (Joint Partner)
              </span>
              <p className="text-sm font-bold text-[#0F1C3F]">{partnerName}</p>
              <p className="text-xs text-gray-500">
                {partnerSigned ? `Signed: ${partnerSignDate}` : 'Awaiting confirmation'}
              </p>
            </div>
            {partnerSigned ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <Check className="w-3.5 h-3.5" /> Digitally Signed
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setPartnerSigned(true)}
                className="px-3 py-1.5 rounded-lg bg-[#C9A84C] text-[#0F1C3F] text-xs font-bold hover:bg-[#d4b460]"
              >
                Sign on Behalf (Demo)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── PAYWALL NOTIFICATION (WHEN NOT PAID) ── */}
      {!isPaid && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0F1C3F] to-[#1e326b] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-[#C9A84C]/30">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              Certificate Access Locked
            </div>
            <h3 className="text-xl font-bold">
              Pay the $49 Issuance Fee to Download Your Certified Certificate
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Before accessing, printing, or downloading your high-resolution Marriage Investment Certificate, the official legal registration fee must be settled. This permanently records your joint beneficial covenant on the platform ledger.
            </p>
          </div>

          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex-shrink-0 px-8 py-3.5 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-sm tracking-wide transition-all shadow-lg shadow-[#C9A84C]/30 active:scale-95"
          >
            Pay $49 & Unlock Certificate
          </button>
        </div>
      )}

      {/* ── THE ORNATE MARRIAGE CERTIFICATE ── */}
      <div className="relative">
        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-certificate, #printable-certificate * {
              visibility: visible;
            }
            #printable-certificate {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 20px;
              box-shadow: none !important;
            }
          }
        `}</style>

        <div
          id="printable-certificate"
          className="relative bg-[#FCFBF7] rounded-2xl sm:rounded-3xl p-4 sm:p-12 border-4 sm:border-8 border-double border-[#C9A84C] shadow-2xl overflow-hidden text-center"
          style={{ minHeight: '620px' }}
        >
          {/* Ornate corner embellishments */}
          <div className="absolute top-3 left-3 w-12 h-12 border-t-2 border-l-2 border-[#C9A84C]" />
          <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-[#C9A84C]" />
          <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-[#C9A84C]" />
          <div className="absolute bottom-3 right-3 w-12 h-12 border-b-2 border-r-2 border-[#C9A84C]" />

          {/* Watermark overlay when unpaid */}
          {!isPaid && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1.5px] z-20 flex flex-col items-center justify-center p-6 select-none pointer-events-none">
              <div className="transform -rotate-12 px-8 py-4 border-4 border-dashed border-red-500/80 rounded-2xl bg-white/90 shadow-2xl text-center">
                <span className="text-red-600 font-extrabold text-2xl sm:text-3xl tracking-widest uppercase block">
                  PAYMENT REQUIRED TO DOWNLOAD
                </span>
                <span className="text-gray-700 font-semibold text-xs mt-1 block">
                  OFFICIAL ISSUANCE FEE ($49) PENDING · WATERMARKED PREVIEW
                </span>
              </div>
            </div>
          )}

          {/* Top emblem */}
          <div className="flex justify-center mb-6">
            <div className="relative w-16 h-12 flex items-center justify-center">
              <svg
                width="64"
                height="48"
                viewBox="0 0 38 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <ellipse cx="14" cy="14" rx="10" ry="10" stroke="#C9A84C" strokeWidth="2.5" />
                <polygon points="14,2 17,6 14,9 11,6" fill="#C9A84C" />
                <ellipse cx="24" cy="14" rx="10" ry="10" stroke="#C9A84C" strokeWidth="2.5" />
              </svg>
            </div>
          </div>

          {/* Headers */}
          <span className="text-[11px] sm:text-xs font-serif font-bold uppercase tracking-[0.25em] text-[#0F1C3F]/70 block mb-2">
            {currentType.category} · International Matrimonial Capital Registry · Zurich & London
          </span>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#0F1C3F] tracking-tight mb-4">
            {currentType.certificateTitle}
          </h2>

          <p className="text-xs sm:text-sm font-serif italic text-gray-600 max-w-xl mx-auto mb-8">
            {currentType.covenantSubtitle}
          </p>

          {/* Couple Names */}
          <div className="my-8 py-6 border-y border-[#C9A84C]/30 max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <div className="text-center sm:text-right flex-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                  {role1}
                </span>
                <span className="text-2xl sm:text-3xl font-serif font-bold text-[#0F1C3F] tracking-wide">
                  {userName}
                </span>
              </div>

              <div className="w-10 h-10 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C] flex items-center justify-center text-[#0F1C3F] font-serif text-lg font-bold">
                &
              </div>

              <div className="text-center sm:text-left flex-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                  {role2}
                </span>
                <span className="text-2xl sm:text-3xl font-serif font-bold text-[#0F1C3F] tracking-wide">
                  {partnerName}
                </span>
              </div>
            </div>
          </div>

          {/* Covenant statement */}
          <p className="text-xs sm:text-sm text-gray-700 max-w-2xl mx-auto leading-relaxed mb-10">
            By dual execution, both parties covenant to pool capital, co-invest jointly in USD-denominated yield funds, share equally in all distributions, and maintain reciprocal survivorship and beneficial entitlement across all matrimonial investment accounts.
          </p>

          {/* Details & Signatures Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto items-end pt-4">
            {/* Signature 1 */}
            <div className="text-center border-t border-gray-400 pt-3">
              <p className="font-serif italic text-lg text-[#0F1C3F] h-8 flex items-center justify-center">
                {userName}
              </p>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                {role1} Signature
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {primarySigned ? primarySignDate : 'Pending'}
              </span>
            </div>

            {/* Official Gold Seal */}
            <div className="flex flex-col items-center justify-center">
              <div className={`w-24 h-24 rounded-full border-4 border-[#C9A84C] flex flex-col items-center justify-center shadow-lg relative p-1 ${
                isPaid ? 'bg-gradient-to-tr from-[#C9A84C] via-[#e8cb7a] to-[#C9A84C] text-[#0F1C3F]' : 'bg-gray-100 text-gray-400'
              }`}>
                {isPaid ? (
                  <>
                    <Award className="w-7 h-7 text-[#0F1C3F] mb-0.5" />
                    <span className="text-[7px] font-extrabold uppercase tracking-wider text-[#0F1C3F] text-center leading-tight">
                      {currentType.sealBadgeText}
                    </span>
                    <span className="text-[6.5px] font-bold text-[#0F1C3F]/80">
                      UNION INVEST
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-7 h-7 text-gray-400 mb-0.5" />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500">
                      FEE REQUIRED
                    </span>
                  </>
                )}
              </div>
              <span className="text-[10px] font-mono text-gray-500 mt-2">
                ID: {certificateNumber}
              </span>
            </div>

            {/* Signature 2 */}
            <div className="text-center border-t border-gray-400 pt-3">
              <p className="font-serif italic text-lg text-[#0F1C3F] h-8 flex items-center justify-center">
                {partnerSigned ? partnerName : 'Pending Signature'}
              </p>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                {role2} Signature
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {partnerSigned ? partnerSignDate : 'Awaiting sign-off'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── PAYMENT MODAL ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/20 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-[#C9A84C]" />
                </div>
                <h3 className="text-lg font-bold text-[#0F1C3F]">Certificate Issuance Fee</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex justify-between items-center text-sm font-semibold text-gray-900 mb-1">
                  <span>Marriage Certificate Issuance</span>
                  <span>$49.00 USD</span>
                </div>
                <p className="text-xs text-gray-500">
                  Includes digital registry filing, official embossed seal, lifetime PDF download, and activates joint portfolio funding.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                  />
                  <CreditCard className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                    CVC
                  </label>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={processingPayment}
              className="w-full py-3.5 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-sm tracking-wide transition-all shadow-md shadow-[#C9A84C]/25 disabled:opacity-50"
            >
              {processingPayment ? 'Processing $49.00 Payment...' : 'Pay $49.00 & Unlock Certificate'}
            </button>

            <p className="text-[11px] text-gray-400 text-center mt-3">
              🔒 256-Bit Encrypted Payment. Instant Certificate Unlock.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
