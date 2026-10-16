'use client'

import { useState } from 'react'
import { CommunityCause, DonationReceipt } from '@/types/community'
import {
  Heart,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  X,
  Lock,
  Printer,
  Copy,
  Check,
  Gift,
  HelpCircle,
  Share2,
} from 'lucide-react'

interface DonationModalProps {
  cause: CommunityCause | null
  onClose: () => void
  userSession?: {
    name?: string | null
    email?: string | null
  } | null
}

const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000]

export default function DonationModal({ cause, onClose, userSession }: DonationModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(100)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [donorName, setDonorName] = useState<string>(userSession?.name || '')
  const [donorEmail, setDonorEmail] = useState<string>(userSession?.email || '')
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false)
  const [isRecurring, setIsRecurring] = useState<boolean>(false)
  const [dedicationType, setDedicationType] = useState<
    'NONE' | 'MARRIAGE_HONOR' | 'IN_MEMORY' | 'COMMUNITY_PRIDE'
  >('NONE')
  const [dedicationText, setDedicationText] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<DonationReceipt | null>(null)
  const [copied, setCopied] = useState(false)

  if (!cause) return null

  const effectiveAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount

  const getImpactDescription = (amt: number) => {
    if (amt < 25) return 'Provides daily hot meals and hygiene essentials to an individual in need.'
    if (amt < 50) return 'Secures warm emergency shelter, fresh clothing, and clean bedding for a night.'
    if (amt < 100) return 'Funds 1 full week of trauma-informed mental wellness counseling & lifeline services.'
    if (amt < 250) return 'Covers vital medical prescriptions and critical emergency transport stipends.'
    if (amt < 500) return 'Funds an emergency civil rights legal injunction or family adoption filing subsidy.'
    return 'Provides life-changing transitional housing grants or major reciprocal IVF family support.'
  }

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (effectiveAmount < 5) {
      setError('Minimum donation is $5.00.')
      return
    }

    if (!isAnonymous && !donorName.trim()) {
      setError('Please provide your name or check the Anonymous box.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/community/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          causeId: cause.id,
          amount: effectiveAmount,
          donorName: isAnonymous ? 'Anonymous' : donorName,
          donorEmail: donorEmail || 'donor@community.unioninvest.com',
          isAnonymous,
          isRecurring,
          dedicationType,
          dedicationText,
          paymentMethod: 'CARD',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process donation.')
      }

      setReceipt(data.receipt)
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyReceipt = () => {
    if (receipt?.receiptNumber) {
      navigator.clipboard.writeText(receipt.receiptNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F1C3F] via-[#162752] to-[#0F1C3F] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#C9A84C] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles size={12} />
            {cause.categoryLabel} · 501(c)(3) Verified
          </div>

          <h3 className="text-xl font-bold pr-8 leading-snug">{cause.title}</h3>
          <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
            <span>Partner: {cause.partnerOrg}</span>
            <span>•</span>
            <span className="text-[#C9A84C]">{cause.ein}</span>
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {receipt ? (
            /* Success & Tax Receipt View */
            <div className="space-y-6 text-center py-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border-2 border-emerald-200 shadow-sm animate-bounce">
                <Heart className="w-8 h-8 fill-emerald-500 text-emerald-600" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  Donation Confirmed · Tax Deductible
                </span>
                <h4 className="text-2xl font-black text-[#0F1C3F] pt-2">
                  Thank You For Your Generosity!
                </h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Your tax-deductible contribution of{' '}
                  <strong className="text-gray-900 font-bold">${receipt.amount.toLocaleString()}</strong> has been directly allocated to{' '}
                  <strong className="text-gray-900 font-bold">{receipt.causeTitle}</strong>.
                </p>
              </div>

              {/* Printable Receipt Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 text-left space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-[#0F1C3F] flex items-center gap-1">
                    <ShieldCheck size={14} className="text-[#C9A84C]" />
                    UNION INVEST PHILANTHROPY COVENANT
                  </span>
                  <span className="text-[10px] text-gray-400">OFFICIAL 501(c)(3) RECEIPT</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-[10px] text-gray-400 block">RECEIPT NUMBER</span>
                    <span className="font-bold text-[#0F1C3F] flex items-center gap-1">
                      {receipt.receiptNumber}
                      <button onClick={handleCopyReceipt} className="text-gray-400 hover:text-black">
                        {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">AMOUNT CONTRIBUTED</span>
                    <span className="font-bold text-emerald-600">${receipt.amount.toFixed(2)} USD</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">DONOR</span>
                    <span className="font-semibold">{receipt.donorName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">DATE & TIME</span>
                    <span>{new Date(receipt.date).toLocaleDateString()}</span>
                  </div>
                </div>

                {receipt.dedicationText && (
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 italic">
                    &ldquo;{receipt.dedicationText}&rdquo;
                  </div>
                )}

                <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[10px] text-gray-500">
                  <span>Fiscal Org: {receipt.partnerOrg}</span>
                  <span className="text-[#C9A84C] font-semibold">{receipt.ein}</span>
                </div>
                <div className="text-[9px] text-gray-400 truncate">
                  Digital Seal: {receipt.digitalSignature}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Printer size={14} />
                  Print Tax Receipt
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#0F1C3F] text-xs font-bold text-white hover:bg-[#1a2f64] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Donation Form */
            <form onSubmit={handleDonate} className="space-y-5">
              {error && (
                <div className="p-3 text-xs rounded-xl bg-red-50 text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              {/* Preset Amounts */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Select Donation Amount (USD)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_AMOUNTS.map((amt) => {
                    const isSelected = selectedAmount === amt && !customAmount
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amt)
                          setCustomAmount('')
                        }}
                        className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${
                          isSelected
                            ? 'bg-[#0F1C3F] text-white border-[#0F1C3F] shadow-sm ring-2 ring-[#C9A84C]/40'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        ${amt}
                      </button>
                    )
                  })}
                </div>

                {/* Custom Amount */}
                <div className="mt-2.5 relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="5"
                    step="1"
                    placeholder="Other custom amount (e.g. $750)"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value)
                    }}
                    className="w-full pl-8 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]"
                  />
                </div>

                {/* Dynamic Impact Statement */}
                <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    <strong>Your ${effectiveAmount} impact:</strong> {getImpactDescription(effectiveAmount)}
                  </p>
                </div>
              </div>

              {/* Recurring Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center">
                    <Heart className="w-4 h-4 fill-pink-600" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Make this a Monthly Pledge</h5>
                    <p className="text-[11px] text-gray-500">Provide continuous, reliable support for this cause</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F1C3F]"></div>
                </label>
              </div>

              {/* Donor Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Donor Information
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded border-gray-300 text-[#0F1C3F] focus:ring-[#C9A84C]"
                    />
                    <span>Donate Anonymously</span>
                  </label>
                </div>

                {!isAnonymous && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Your Name (or Couple Names)"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      required={!isAnonymous}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C]"
                    />
                    <input
                      type="email"
                      placeholder="Email for Tax Receipt"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C]"
                    />
                  </div>
                )}
              </div>

              {/* Optional Dedication / In Honor of */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Gift size={13} className="text-[#C9A84C]" />
                  Dedication or Tribute (Optional)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                  {[
                    { id: 'NONE', label: 'None' },
                    { id: 'MARRIAGE_HONOR', label: 'In Honor of Marriage' },
                    { id: 'IN_MEMORY', label: 'In Memory of Pioneer' },
                    { id: 'COMMUNITY_PRIDE', label: 'Community Pride' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDedicationType(item.id as any)}
                      className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-all ${
                        dedicationType === item.id
                          ? 'bg-[#C9A84C]/15 border-[#C9A84C] text-[#0F1C3F] font-bold'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {dedicationType !== 'NONE' && (
                  <input
                    type="text"
                    placeholder="Enter dedication note (e.g. 'In honor of Marcus & David's wedding 2026')"
                    value={dedicationText}
                    onChange={(e) => setDedicationText(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C] mt-1.5"
                  />
                )}
              </div>

              {/* Security & 501(c)(3) Note */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <Lock size={12} className="text-emerald-600" />
                  256-bit SSL Encrypted & Tax Audited
                </span>
                <span>EIN: {cause.ein}</span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#0F1C3F] text-white font-bold text-sm shadow-md hover:bg-[#1a2f64] transition-all flex items-center justify-center gap-2 group disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authorizing Secure Donation...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-[#C9A84C] text-[#C9A84C] group-hover:scale-110 transition-transform" />
                    Complete ${effectiveAmount.toLocaleString()} Donation
                    {isRecurring && ' Monthly'}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
