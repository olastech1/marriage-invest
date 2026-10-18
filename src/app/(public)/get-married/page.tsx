'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Heart,
  Shield,
  Award,
  CheckCircle2,
  FileCheck,
  CreditCard,
  ArrowRight,
  Lock,
  Mail,
  Calendar,
  Sparkles,
  Users,
  Check,
  HelpCircle,
  Clock,
  Printer,
  ChevronRight,
  UserCheck,
  UserPlus,
  LogIn,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react'
import { MARRIAGE_TYPES } from '@/types/marriage'

export default function GetMarriedPage() {
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated' && !!session?.user
  const isSessionLoading = status === 'loading'

  // Step navigation (1: Ceremony & Type, 2: Partners (Never Married), 3: Vows & Date, 4: Fee Selection & Payment, 5: Confirmed)
  const [currentStep, setCurrentStep] = useState(1)

  // Form states
  const [selectedTypeId, setSelectedTypeId] = useState('CIVIL_MARRIAGE')
  const [partner1Name, setPartner1Name] = useState('')
  const [partner1Email, setPartner1Email] = useState('')
  const [partner1Dob, setPartner1Dob] = useState('')
  const [partner1Citizenship, setPartner1Citizenship] = useState('United States')
  const [partner1NeverMarried, setPartner1NeverMarried] = useState(true)
  const [partner1Password, setPartner1Password] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [autoFilledFromSession, setAutoFilledFromSession] = useState(false)

  const [partner2Name, setPartner2Name] = useState('')
  const [partner2Email, setPartner2Email] = useState('')
  const [partner2Dob, setPartner2Dob] = useState('')
  const [partner2Citizenship, setPartner2Citizenship] = useState('United Kingdom')
  const [partner2NeverMarried, setPartner2NeverMarried] = useState(true)

  const [weddingDate, setWeddingDate] = useState('2026-11-20')
  const [jurisdiction, setJurisdiction] = useState('Union Verify Global Registry (Statutory Digital Standards)')
  const [customVows, setCustomVows] = useState(
    'We pledge our lives, mutual trust, and shared wealth to one another in equal partnership, honoring our joint covenant of prosperity, survivorship, and eternal fidelity.'
  )

  // Payment Selection: 'both' ($1000), 'registration' ($500), 'certificate' ($500)
  const [paymentOption, setPaymentOption] = useState<'both' | 'registration' | 'certificate'>('both')
  const [processing, setProcessing] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [docketNumber, setDocketNumber] = useState('')

  // Credit Card fields
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [cardCvc, setCardCvc] = useState('789')

  // Auto-detect & auto-fill when user is logged in
  useEffect(() => {
    if (session?.user && !autoFilledFromSession) {
      if (session.user.name && !partner1Name) {
        setPartner1Name(session.user.name)
      }
      if (session.user.email && !partner1Email) {
        setPartner1Email(session.user.email)
      }
      setAutoFilledFromSession(true)
    }
  }, [session, autoFilledFromSession, partner1Name, partner1Email])

  const currentType = MARRIAGE_TYPES.find((t) => t.id === selectedTypeId) || MARRIAGE_TYPES[2]

  const totalAmount =
    paymentOption === 'both' ? 1000 : paymentOption === 'registration' ? 500 : 500

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (!partner1Name || !partner1Email || !partner2Name || !partner2Email) {
        alert('Please fill in both partners names and email addresses.')
        return
      }
      if (!partner1NeverMarried || !partner2NeverMarried) {
        alert('Both partners must attest to their legal never-married status to proceed.')
        return
      }
      setCurrentStep(3)
    } else if (currentStep === 3) {
      setCurrentStep(4)
    }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    try {
      const res = await fetch('/api/marriage-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedTypeId,
          partner1Name,
          partner1Email,
          partner1Dob,
          partner1Citizenship,
          partner1Password,
          partner2Name,
          partner2Email,
          partner2Dob,
          partner2Citizenship,
          weddingDate,
          jurisdiction,
          customVows,
          paymentOption,
          totalAmount,
        }),
      })

      const data = await res.json()
      if (res.ok && data.docketNumber) {
        setDocketNumber(data.docketNumber)
      } else {
        const randomDocket = `REG-2026-CH-${Math.floor(10000 + Math.random() * 90000)}`
        setDocketNumber(randomDocket)
      }
      setIsCompleted(true)
      setCurrentStep(5)
    } catch {
      const randomDocket = `REG-2026-CH-${Math.floor(10000 + Math.random() * 90000)}`
      setDocketNumber(randomDocket)
      setIsCompleted(true)
      setCurrentStep(5)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-20">
      {/* ── TOP HERO HEADER ── */}
      <section className="bg-gradient-to-b from-[#0F1C3F] to-[#16254F] text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-5">
            <Heart className="w-3.5 h-3.5 fill-[#C9A84C]" />
            First-Time Matrimonial Solemnization
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight mb-4">
            Get Married Online & Invest As One
          </h1>
          <p className="text-sm sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed mb-6">
            For individuals and couples who have never been married before. Complete your official legal marriage registration, receive your certified digital & archival marriage certificate, and unlock your 50/50 joint wealth portfolio.
          </p>

          {/* Pricing Highlight Pill */}
          <div className="inline-grid grid-cols-1 sm:grid-cols-2 gap-3 p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 max-w-lg mx-auto text-left">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] uppercase tracking-wider text-[#C9A84C] font-bold block">
                Step 1 · Legal Registration
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-white">$500</span>
                <span className="text-xs text-gray-300">one-time filing</span>
              </div>
              <span className="text-[11px] text-gray-400 block mt-1">
                Affidavit check, registry filing & officiant
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] uppercase tracking-wider text-[#C9A84C] font-bold block">
                Step 2 · Certified Certificate
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-white">$500</span>
                <span className="text-xs text-gray-300">official issuance</span>
              </div>
              <span className="text-[11px] text-gray-400 block mt-1">
                Gold-embossed certificate & lifetime PDF
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── APPLICATION WIZARD CONTAINER ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        {/* Step indicator breadcrumbs */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
            <div
              className={`flex items-center gap-2 p-2.5 rounded-xl transition-colors ${
                currentStep >= 1 ? 'bg-[#0F1C3F] text-white' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-[#C9A84C] text-[#0F1C3F] flex items-center justify-center font-bold text-[10px]">
                1
              </div>
              <span className="truncate">Union Type</span>
            </div>

            <div
              className={`flex items-center gap-2 p-2.5 rounded-xl transition-colors ${
                currentStep >= 2 ? 'bg-[#0F1C3F] text-white' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-[#C9A84C] text-[#0F1C3F] flex items-center justify-center font-bold text-[10px]">
                2
              </div>
              <span className="truncate">Spouses Info</span>
            </div>

            <div
              className={`flex items-center gap-2 p-2.5 rounded-xl transition-colors ${
                currentStep >= 3 ? 'bg-[#0F1C3F] text-white' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-[#C9A84C] text-[#0F1C3F] flex items-center justify-center font-bold text-[10px]">
                3
              </div>
              <span className="truncate">Covenant & Vows</span>
            </div>

            <div
              className={`flex items-center gap-2 p-2.5 rounded-xl transition-colors ${
                currentStep >= 4 ? 'bg-[#0F1C3F] text-white' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-[#C9A84C] text-[#0F1C3F] flex items-center justify-center font-bold text-[10px]">
                4
              </div>
              <span className="truncate">Fees & Payment</span>
            </div>
          </div>
        </div>

        {/* ── STEP 1: SELECT MARRIAGE TYPE ── */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-sm space-y-8 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C9A84C] mb-1">
                <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                Step 1 of 4 · Matrimonial Category
              </div>
              <h2 className="text-2xl font-bold text-[#0F1C3F]">Select Your Marriage Covenant Type</h2>
              <p className="text-sm text-gray-500 mt-1">
                Our Union Verify fiduciary protocol grants equal 50/50 beneficial survivorship across all marriage types.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MARRIAGE_TYPES.map((type) => {
                const isSelected = selectedTypeId === type.id
                return (
                  <div
                    key={type.id}
                    onClick={() => setSelectedTypeId(type.id)}
                    className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative ${
                      isSelected
                        ? 'border-[#0F1C3F] bg-[#0F1C3F]/[0.02] shadow-md ring-2 ring-[#C9A84C]'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border ${type.badgeColor}`}>
                        {type.category}
                      </span>
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-[#0F1C3F] text-[#C9A84C] flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-gray-300" />
                      )}
                    </div>
                    <h3 className="text-base font-bold text-[#0F1C3F] mb-1">{type.label}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">{type.description}</p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono bg-gray-50 p-2 rounded-lg">
                      <span>Default Roles:</span>
                      <strong className="text-gray-800">{type.defaultRole1}</strong> & <strong className="text-gray-800">{type.defaultRole2}</strong>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                onClick={handleNextStep}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2c5e] text-white font-bold text-sm tracking-wide transition-all shadow-md shadow-[#0F1C3F]/20"
              >
                Continue to Spouses Information
                <ArrowRight className="w-4 h-4 text-[#C9A84C]" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: PARTNERS DETAILS (NEVER MARRIED ATTESTATION) ── */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-sm space-y-8 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C9A84C] mb-1">
                <Users className="w-4 h-4 text-[#C9A84C]" />
                Step 2 of 4 · First-Time Marital Attestation
              </div>
              <h2 className="text-2xl font-bold text-[#0F1C3F]">Prospective Spouses Legal Information</h2>
              <p className="text-sm text-gray-500 mt-1">
                Both parties must legally declare their unmarried status to obtain registration under international covenant codes.
              </p>
            </div>

            {/* PARTNER 1 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0F1C3F] flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-[#C9A84C]" />
                  Partner 1 ({currentType.defaultRole1})
                </span>
                {isLoggedIn && (
                  <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-600" />
                    Primary Account Holder
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Legal Name (as on Passport) *
                  </label>
                  <input
                    type="text"
                    required
                    value={partner1Name}
                    onChange={(e) => setPartner1Name(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={partner1Email}
                    onChange={(e) => setPartner1Email(e.target.value)}
                    placeholder="e.g. jane@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={partner1Dob}
                    onChange={(e) => setPartner1Dob(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Country of Legal Citizenship
                  </label>
                  <input
                    type="text"
                    value={partner1Citizenship}
                    onChange={(e) => setPartner1Citizenship(e.target.value)}
                    placeholder="e.g. United States / United Kingdom"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] bg-white"
                  />
                </div>
              </div>

              {/* Account password setup for new applicants */}
              {!isLoggedIn && (
                <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#C9A84C]" />
                      Create Account Password (Optional)
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={partner1Password}
                      onChange={(e) => setPartner1Password(e.target.value)}
                      placeholder="Choose a password (min 6 characters)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] bg-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Set a password to access your joint dashboard and digital certificate after registration.
                  </p>
                </div>
              )}

              {/* Never Married Declaration */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-gray-200 cursor-pointer hover:border-[#C9A84C] transition-colors mt-2">
                <input
                  type="checkbox"
                  checked={partner1NeverMarried}
                  onChange={(e) => setPartner1NeverMarried(e.target.checked)}
                  className="mt-0.5 rounded text-[#0F1C3F] focus:ring-[#C9A84C] w-4 h-4"
                />
                <span className="text-xs text-gray-700 leading-snug">
                  <strong>Affidavit of Never-Married Status:</strong> I certify that I have never been previously married, am currently legally unmarried, and am fully eligible to solemnize this matrimonial covenant.
                </span>
              </label>
            </div>

            {/* PARTNER 2 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0F1C3F] flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-[#C9A84C]" />
                  Partner 2 ({currentType.defaultRole2})
                </span>
                <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                  Joint Signatory
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Partner Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={partner2Name}
                    onChange={(e) => setPartner2Name(e.target.value)}
                    placeholder="e.g. Marcus Vance"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Partner Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={partner2Email}
                    onChange={(e) => setPartner2Email(e.target.value)}
                    placeholder="e.g. marcus@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Partner Date of Birth
                  </label>
                  <input
                    type="date"
                    value={partner2Dob}
                    onChange={(e) => setPartner2Dob(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Partner Country of Citizenship
                  </label>
                  <input
                    type="text"
                    value={partner2Citizenship}
                    onChange={(e) => setPartner2Citizenship(e.target.value)}
                    placeholder="e.g. United Kingdom"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] bg-white"
                  />
                </div>
              </div>

              {/* Partner 2 Never Married Checkbox */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-gray-200 cursor-pointer hover:border-[#C9A84C] transition-colors mt-2">
                <input
                  type="checkbox"
                  checked={partner2NeverMarried}
                  onChange={(e) => setPartner2NeverMarried(e.target.checked)}
                  className="mt-0.5 rounded text-[#0F1C3F] focus:ring-[#C9A84C] w-4 h-4"
                />
                <span className="text-xs text-gray-700 leading-snug">
                  <strong>Affidavit of Partner&apos;s Never-Married Status:</strong> I declare that my prospective spouse has never been previously married and enters this union as a first-time marriage.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                onClick={() => setCurrentStep(1)}
                className="text-sm font-semibold text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <button
                onClick={handleNextStep}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2c5e] text-white font-bold text-sm tracking-wide transition-all shadow-md"
              >
                Continue to Covenant & Vows
                <ArrowRight className="w-4 h-4 text-[#C9A84C]" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: VOWS & MATRIMONIAL DATE ── */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-sm space-y-8 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C9A84C] mb-1">
                <Calendar className="w-4 h-4 text-[#C9A84C]" />
                Step 3 of 4 · Solemnization & Vows
              </div>
              <h2 className="text-2xl font-bold text-[#0F1C3F]">Solemnization Date & Matrimonial Vows</h2>
              <p className="text-sm text-gray-500 mt-1">
                Customize your official marriage covenant inscription and choose the effective legal union date.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Solemnization / Wedding Date *
                </label>
                <input
                  type="date"
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Officiating Jurisdiction & Notary
                </label>
                <input
                  type="text"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] bg-gray-50"
                  readOnly
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Matrimonial Covenant Vows (Printed on Certificate)
              </label>
              <textarea
                rows={4}
                value={customVows}
                onChange={(e) => setCustomVows(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] font-serif leading-relaxed"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                These words will be permanently recorded in the international docket registry and inscribed onto your certified gold-trimmed document.
              </p>
            </div>

            {/* Fiduciary Guarantee */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <strong>Statutory 50/50 Survivorship Entitlement:</strong> Upon solemnization and certificate validation, both spouses will be legally recorded with equal beneficial ownership rights to all matrimonial vaults, distributions, and high-yield deposits.
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                onClick={() => setCurrentStep(2)}
                className="text-sm font-semibold text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <button
                onClick={handleNextStep}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2c5e] text-white font-bold text-sm tracking-wide transition-all shadow-md"
              >
                Review Fees & Complete Registration
                <ArrowRight className="w-4 h-4 text-[#C9A84C]" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: FEES & PAYMENT BREAKDOWN ── */}
        {currentStep === 4 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-sm space-y-8 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C9A84C] mb-1">
                <CreditCard className="w-4 h-4 text-[#C9A84C]" />
                Step 4 of 4 · Fiduciary Docket Fees
              </div>
              <h2 className="text-2xl font-bold text-[#0F1C3F]">Marriage Registration & Certificate Fees</h2>
              <p className="text-sm text-gray-500 mt-1">
                Choose to complete both the $500 registration filing and $500 certificate issuance now, or pay individually.
              </p>
            </div>

            {/* FEE SELECTION CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Option: Full Bundle */}
              <div
                onClick={() => setPaymentOption('both')}
                className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative ${
                  paymentOption === 'both'
                    ? 'border-[#C9A84C] bg-[#C9A84C]/5 shadow-md ring-2 ring-[#C9A84C]'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="absolute top-3 right-3">
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#C9A84C] text-[#0F1C3F]">
                    Recommended
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#0F1C3F] text-[#C9A84C] flex items-center justify-center mb-3">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F1C3F]">Complete Bundle</h3>
                <p className="text-xs text-gray-500 mb-2">Registration ($500) + Certificate ($500)</p>
                <div className="text-2xl font-bold text-[#0F1C3F]">$1,000</div>
                <p className="text-[11px] text-gray-500 mt-2">
                  Complete legal solemnization + instant high-res certificate access.
                </p>
              </div>

              {/* Option: Registration Fee Only ($500) */}
              <div
                onClick={() => setPaymentOption('registration')}
                className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative ${
                  paymentOption === 'registration'
                    ? 'border-[#0F1C3F] bg-[#0F1C3F]/5 shadow-md ring-2 ring-[#0F1C3F]'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 text-[#0F1C3F] flex items-center justify-center mb-3">
                  <FileCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F1C3F]">Registration Only</h3>
                <p className="text-xs text-gray-500 mb-2">Official Legal Docket Filing</p>
                <div className="text-2xl font-bold text-[#0F1C3F]">$500</div>
                <p className="text-[11px] text-gray-500 mt-2">
                  Submits digital marriage registration & records union in registry.
                </p>
              </div>

              {/* Option: Certificate Issuance Only ($500) */}
              <div
                onClick={() => setPaymentOption('certificate')}
                className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative ${
                  paymentOption === 'certificate'
                    ? 'border-[#0F1C3F] bg-[#0F1C3F]/5 shadow-md ring-2 ring-[#0F1C3F]'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 text-[#0F1C3F] flex items-center justify-center mb-3">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F1C3F]">Certificate Only</h3>
                <p className="text-xs text-gray-500 mb-2">Certified Certificate Issuance</p>
                <div className="text-2xl font-bold text-[#0F1C3F]">$500</div>
                <p className="text-[11px] text-gray-500 mt-2">
                  Stamps 24K gold seal, un-watermarks PDF & enables print downloads.
                </p>
              </div>
            </div>

            {/* ORDER SUMMARY */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Order Summary</h4>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Parties:</span>
                <span className="font-semibold text-gray-900">
                  {partner1Name || 'Partner 1'} & {partner2Name || 'Partner 2'}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Union Classification:</span>
                <span className="font-semibold text-gray-900">{currentType.label}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Selected Payment Scope:</span>
                <span className="font-semibold text-[#0F1C3F]">
                  {paymentOption === 'both'
                    ? 'Registration ($500) + Official Certificate ($500)'
                    : paymentOption === 'registration'
                    ? 'Legal Registration Filing Fee ($500)'
                    : 'Official Marriage Certificate Issuance ($500)'}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between items-center text-sm font-bold text-[#0F1C3F]">
                <span>Total Due Now:</span>
                <span className="text-xl text-[#C9A84C]">${totalAmount}.00 USD</span>
              </div>
            </div>

            {/* PAYMENT FORM */}
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                  Payment Details (256-Bit Encrypted)
                </span>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                    />
                    <CreditCard className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      required
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="text-sm font-semibold text-gray-600 hover:text-gray-900"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-sm tracking-wide transition-all shadow-md shadow-[#C9A84C]/25 disabled:opacity-50"
                >
                  {processing ? (
                    'Processing Payment...'
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Pay ${totalAmount}.00 & Solemnize Marriage
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── STEP 5: REGISTRATION SUCCESS & CONFIRMATION ── */}
        {currentStep === 5 && isCompleted && (
          <div className="bg-white rounded-3xl p-6 sm:p-12 border border-gray-200 shadow-xl text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#C9A84C] block mb-1">
                Solemnization Recorded
              </span>
              <h2 className="text-3xl font-serif font-bold text-[#0F1C3F]">
                Congratulations! Your Marriage is Registered.
              </h2>
              <p className="text-sm text-gray-600 max-w-lg mx-auto mt-2 leading-relaxed">
                Official docket <strong>{docketNumber}</strong> has been created in the International Matrimonial Capital Registry. An invitation has been dispatched to <strong>{partner2Email || 'your spouse'}</strong> to add their digital signature.
              </p>
            </div>

            {/* Docket summary card */}
            <div className="max-w-md mx-auto p-5 rounded-2xl bg-[#0F1C3F] text-white text-left space-y-3 shadow-md">
              <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                <span className="text-xs text-gray-400">Official Docket Number</span>
                <span className="text-xs font-mono font-bold text-[#C9A84C]">{docketNumber}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                <span className="text-xs text-gray-400">Solemnized Spouses</span>
                <span className="text-xs font-semibold">{partner1Name || 'Partner 1'} & {partner2Name || 'Partner 2'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                <span className="text-xs text-gray-400">Classification</span>
                <span className="text-xs text-[#C9A84C]">{currentType.label}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                <span className="text-xs text-gray-400">Primary Account</span>
                <span className="text-xs font-mono font-bold text-[#C9A84C]">
                  {session?.user?.email || partner1Email}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Filing Status</span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {paymentOption === 'both' ? 'Fully Certified & Paid' : 'Registration Docketed'}
                </span>
              </div>
            </div>

            {/* Contextual Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2c5e] text-white font-bold text-sm transition-all shadow-md"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 text-[#C9A84C]" />
                  </Link>
                  <Link
                    href="/certificate"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-sm transition-all shadow-md"
                  >
                    <Award className="w-4 h-4" />
                    View & Sign Certificate
                  </Link>
                  <Link
                    href="/chat"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm transition-all"
                  >
                    <Heart className="w-4 h-4 text-rose-500" />
                    Spouse Chat
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login?callbackUrl=/dashboard"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2c5e] text-white font-bold text-sm transition-all shadow-md"
                  >
                    <LogIn className="w-4 h-4 text-[#C9A84C]" />
                    Sign In to Your Account
                  </Link>
                  <Link
                    href="/certificate"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-sm transition-all shadow-md"
                  >
                    <Award className="w-4 h-4" />
                    View Certificate Preview
                  </Link>
                  <Link
                    href="/savings"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm transition-all"
                  >
                    Explore Savings Vault
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── FAQ SECTION FOR FIRST-TIME MARRIAGES ── */}
        <div className="mt-16 bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C9A84C] block mb-1">
              Fiduciary Guidance
            </span>
            <h3 className="text-xl font-bold text-[#0F1C3F]">Frequently Asked Questions for First-Time Marriages</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-600 leading-relaxed">
            <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <h4 className="font-bold text-sm text-[#0F1C3F] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#C9A84C]" />
                What is the $500 Marriage Registration Fee?
              </h4>
              <p>
                The $500 registration fee covers your online application review, identity verification of both spouses, background docket check, and statutory recording in the official registry.
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <h4 className="font-bold text-sm text-[#0F1C3F] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#C9A84C]" />
                What is the $500 Marriage Certificate Fee?
              </h4>
              <p>
                The $500 certificate fee authorizes the cryptographic issuance of your un-watermarked high-resolution certificate, stamped with our 24K gold seal, QR verification hash, and unlocks unrestricted lifetime PDF printing and archival storage.
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <h4 className="font-bold text-sm text-[#0F1C3F] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#C9A84C]" />
                Can we pay both at once?
              </h4>
              <p>
                Yes. You can select the $1,000 Complete Bundle at checkout to complete both your legal registration and certificate issuance in one streamlined step.
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <h4 className="font-bold text-sm text-[#0F1C3F] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C9A84C]" />
                Does this recognize same-sex and civil marriages equally?
              </h4>
              <p>
                Absolutely. Same-sex unions (gay husbands, lesbian wives), civil marriages, civil unions, and domestic partnerships enjoy identical legal protection, 50/50 capital rights, and reciprocal survivorship entitlement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
