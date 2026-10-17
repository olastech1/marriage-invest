'use client'

import { useState } from 'react'
import { CoupleRegistry, RegistryFund, RegistryGift } from '@/types/registry'
import {
  Gift,
  Heart,
  Sparkles,
  X,
  CheckCircle2,
  Lock,
  Share2,
  Copy,
  Check,
} from 'lucide-react'

interface SendGiftModalProps {
  registry: CoupleRegistry
  initialFundId?: string
  onClose: () => void
  onGiftSent: (gift: RegistryGift) => void
}

const PRESET_GIFT_AMOUNTS = [50, 100, 250, 500, 1000]

const CARD_THEMES = [
  { id: 'GOLD_ELEGANCE', label: '24K Gold Elegance', bg: 'bg-[#C9A84C]/10 border-[#C9A84C]' },
  { id: 'ROSE_ROMANCE', label: 'Blushing Rose', bg: 'bg-rose-50 border-rose-300' },
  { id: 'MIDNIGHT_ROYAL', label: 'Midnight Royal', bg: 'bg-[#0F1C3F]/10 border-[#0F1C3F]' },
  { id: 'EMERALD_HARMONY', label: 'Emerald Harmony', bg: 'bg-emerald-50 border-emerald-300' },
] as const

export default function SendGiftModal({
  registry,
  initialFundId,
  onClose,
  onGiftSent,
}: SendGiftModalProps) {
  const [selectedFundId, setSelectedFundId] = useState<string>(
    initialFundId || registry.funds[0]?.id || ''
  )
  const [selectedAmount, setSelectedAmount] = useState<number>(100)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [donorName, setDonorName] = useState<string>('')
  const [donorEmail, setDonorEmail] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false)
  const [cardDesign, setCardDesign] = useState<
    'GOLD_ELEGANCE' | 'ROSE_ROMANCE' | 'MIDNIGHT_ROYAL' | 'EMERALD_HARMONY'
  >('GOLD_ELEGANCE')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successGift, setSuccessGift] = useState<RegistryGift | null>(null)

  const effectiveAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount
  const targetFund = registry.funds.find((f) => f.id === selectedFundId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (effectiveAmount < 10) {
      setError('Minimum wedding gift contribution is $10.')
      return
    }

    if (!isAnonymous && !donorName.trim()) {
      setError('Please provide your name or check "Gift Anonymously".')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/registry/${registry.slug}/gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fundId: selectedFundId,
          amount: effectiveAmount,
          donorName: isAnonymous ? 'A Gracious Guest' : donorName,
          donorEmail: donorEmail || 'guest@wedding.unioninvest.com',
          message: message || `Wishing ${registry.partner1Name} & ${registry.partner2Name} a lifetime of boundless love, happiness, and prosperity!`,
          isAnonymous,
          giftCardDesign: cardDesign,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit wedding gift.')
      }

      setSuccessGift(data.gift)
      onGiftSent(data.gift)
    } catch (err: any) {
      setError(err.message || 'Something went wrong while processing your gift.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F1C3F] via-[#1a2f64] to-[#0F1C3F] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#C9A84C] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Gift size={12} />
            Wedding Cash Gift Registry · 6.8% High-Yield Vault
          </div>

          <h3 className="text-xl font-bold pr-8">
            Gift to {registry.partner1Name} & {registry.partner2Name}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Your gift will directly fund their milestone vault and be recorded in their public wedding guestbook.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {successGift ? (
            /* Success confirmation */
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border-2 border-emerald-200 animate-bounce">
                <Heart className="w-8 h-8 fill-emerald-500 text-emerald-600" />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  Wedding Gift Received!
                </span>
                <h4 className="text-2xl font-black text-[#0F1C3F]">
                  Thank You, {successGift.donorName}!
                </h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Your generous gift of{' '}
                  <strong className="text-gray-900 font-bold">${successGift.amount.toLocaleString()} USD</strong>{' '}
                  has been deposited into{' '}
                  <strong className="text-gray-900 font-bold">
                    {targetFund?.title || 'their Joint Milestone Vault'}
                  </strong>{' '}
                  and added to the couple’s permanent guestbook.
                </p>
              </div>

              {/* Guestbook Blessing Preview */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-left space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Guestbook Blessing Note
                </span>
                <p className="text-xs text-slate-700 italic font-serif">
                  &ldquo;{successGift.message}&rdquo;
                </p>
                <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between border-t border-amber-200/50">
                  <span>— {successGift.donorName}</span>
                  <span>{new Date(successGift.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-6 rounded-2xl bg-[#0F1C3F] text-white font-bold text-xs hover:bg-[#1a2f64] transition-colors"
              >
                Close & Return to Registry
              </button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs rounded-xl bg-red-50 text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              {/* Fund Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Choose a Specific Milestone Fund
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {registry.funds.map((fund) => {
                    const isSelected = selectedFundId === fund.id
                    return (
                      <button
                        key={fund.id}
                        type="button"
                        onClick={() => setSelectedFundId(fund.id)}
                        className={`p-3 rounded-2xl text-left border transition-all ${
                          isSelected
                            ? 'bg-[#0F1C3F] text-white border-[#0F1C3F] shadow-sm'
                            : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="block text-xs font-bold truncate">{fund.title}</span>
                        <span
                          className={`text-[10px] block mt-0.5 ${
                            isSelected ? 'text-[#C9A84C]' : 'text-gray-500'
                          }`}
                        >
                          Target: ${fund.targetAmount.toLocaleString()}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Amount Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Contribution Amount (USD)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_GIFT_AMOUNTS.map((amt) => {
                    const isSelected = selectedAmount === amt && !customAmount
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amt)
                          setCustomAmount('')
                        }}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-[#0F1C3F] text-white border-[#0F1C3F] shadow-sm ring-2 ring-[#C9A84C]/40'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        ${amt}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-2 relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    placeholder="Other custom amount (e.g. $350)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C]"
                  />
                </div>
              </div>

              {/* Guest Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Your Information
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded border-gray-300 text-[#0F1C3F] focus:ring-[#C9A84C]"
                    />
                    <span>Gift Anonymously</span>
                  </label>
                </div>

                {!isAnonymous && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Your Full Name (e.g. Aunt Claudia)"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      required={!isAnonymous}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C]"
                    />
                    <input
                      type="email"
                      placeholder="Your Email for Confirmation"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C]"
                    />
                  </div>
                )}
              </div>

              {/* Wedding Blessing Note */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Guestbook Blessing / Congratulatory Note
                </label>
                <textarea
                  rows={2}
                  placeholder={`Write a loving message for ${registry.partner1Name} & ${registry.partner2Name}...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              {/* Card Design Selector */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Choose Digital Blessing Card Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {CARD_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setCardDesign(theme.id)}
                      className={`p-2 rounded-xl text-center border text-[10px] font-bold transition-all ${
                        cardDesign === theme.id
                          ? `${theme.bg} shadow-sm ring-1 ring-[#C9A84C]`
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#0F1C3F] text-white font-bold text-xs shadow-md hover:bg-[#1a2f64] transition-all flex items-center justify-center gap-2 group disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Transacting Wedding Gift...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 text-[#C9A84C] group-hover:scale-110 transition-transform" />
                    Send ${effectiveAmount.toLocaleString()} Wedding Gift to Vault
                  </>
                )}
              </button>

              <div className="text-center text-[10px] text-gray-400 flex items-center justify-center gap-1">
                <Lock size={11} className="text-emerald-600" />
                Zero transaction fees deducted · 100% of gift goes to the couple's 6.8% APY vault
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
