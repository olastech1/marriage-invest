'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Mail,
  Phone,
  Building,
  Shield,
  Send,
  Check,
  ArrowLeft,
  Sparkles,
  Lock,
  Copy,
  Calendar,
} from 'lucide-react'
import { CELEBRITY_ARTISTS } from '@/types/fanbase'

export default function ArtistContactDedicatedPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const artist = CELEBRITY_ARTISTS.find((a) => a.slug === slug)

  if (!artist) {
    notFound()
  }

  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactOrg, setContactOrg] = useState('')
  const [contactType, setContactType] = useState('VIP Fan Syndicate Inquiry')
  const [budget, setBudget] = useState('$50,000 - $100,000')
  const [eventDate, setEventDate] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contactSuccess, setContactSuccess] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/fanbase/${artist.slug}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          organization: contactOrg,
          inquiryType: contactType,
          budget,
          eventDate,
          message: contactMessage,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setContactSuccess(data)
      } else {
        alert(data.error || 'Failed to submit inquiry.')
      }
    } catch (err) {
      console.error(err)
      alert('Error connecting to management booking desk.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-[#0A0D14] text-white min-h-screen pt-28 pb-24 px-4 sm:px-6 lg:px-8 selection:bg-[#C9A84C] selection:text-[#0F1C3F]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Link & Private Pill */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/fanbase/${artist.slug}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {artist.stageName} Syndicate Profile</span>
          </Link>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[#C9A84C] text-xs font-semibold hover:bg-white/10 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copied!' : 'Copy Private Contact Link'}</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#C9A84C] text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            Private Representation · Direct Management Desk
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
            Contact {artist.stageName} Management
          </h1>
          <p className="text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            Confidential booking, tour sponsorship, VIP syndicate inquiries, and private concert representation for {artist.name} ({artist.stageName}).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Dossier Card */}
          <div className="p-6 rounded-3xl bg-[#101420] border border-white/10 space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C9A84C] block border-b border-white/10 pb-3">
              Representation Dossier
            </span>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Executive Representation</span>
                <p className="font-bold text-white mt-0.5">{artist.managementContact.managerName}</p>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Agency / Record Label</span>
                <p className="font-bold text-white mt-0.5">{artist.managementContact.agency}</p>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Direct Booking Email</span>
                <a href={`mailto:${artist.managementContact.bookingEmail}`} className="font-mono text-[#C9A84C] hover:underline mt-0.5 block truncate">
                  {artist.managementContact.bookingEmail}
                </a>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Press & Investor Relations</span>
                <a href={`mailto:${artist.managementContact.pressEmail}`} className="font-mono text-gray-300 hover:underline mt-0.5 block truncate">
                  {artist.managementContact.pressEmail}
                </a>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Fiduciary Legal Counsel</span>
                <p className="text-gray-300 mt-0.5 leading-snug">{artist.managementContact.fiduciaryCounsel}</p>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Global Headquarters</span>
                <p className="text-gray-300 mt-0.5">{artist.managementContact.headquarters}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-gray-400 leading-relaxed">
              🔒 Inquiries received through this verified portal are assigned a confidential tracking docket and reviewed directly by management.
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-[#101420] border border-white/10 space-y-6">
            <h2 className="text-lg font-bold text-white">Direct Management Inquiry Form</h2>

            {contactSuccess ? (
              <div className="p-8 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-center space-y-4 animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-[#0F1C3F] flex items-center justify-center mx-auto font-bold shadow-md">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h3 className="text-lg font-bold text-white">Inquiry Transmitted</h3>
                <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
                  {contactSuccess.message}
                </p>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs text-[#C9A84C] inline-block">
                  Reference: {contactSuccess.referenceId}
                </div>
                <div>
                  <button
                    onClick={() => setContactSuccess(null)}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Julian Sterling"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="e.g. julian@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Organization / Entity</label>
                    <input
                      type="text"
                      value={contactOrg}
                      onChange={(e) => setContactOrg(e.target.value)}
                      placeholder="e.g. Sterling Capital / Event Group"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Inquiry Purpose *</label>
                    <select
                      value={contactType}
                      onChange={(e) => setContactType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2030] border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                    >
                      <option value="VIP Fan Syndicate Inquiry">VIP Fan Syndicate Inquiry</option>
                      <option value="Private Concert / Event Booking">Private Concert / Event Booking</option>
                      <option value="Brand Endorsement & Tour Sponsorship">Brand Endorsement & Tour Sponsorship</option>
                      <option value="High-Net-Worth Sovereign Patron">High-Net-Worth Sovereign Patron</option>
                      <option value="Press / Media Interview Request">Press / Media Interview Request</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Proposed Budget Allocation</label>
                    <select
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2030] border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                    >
                      <option value="$1,000 - $10,000">$1,000 - $10,000</option>
                      <option value="$10,000 - $50,000">$10,000 - $50,000</option>
                      <option value="$50,000 - $250,000">$50,000 - $250,000</option>
                      <option value="$250,000+">$250,000+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Detailed Inquiry & Proposal *</label>
                  <textarea
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Provide context regarding your syndicate allocation, event dates, requested riders, or brand terms..."
                    className="w-full p-3.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A84C] leading-relaxed"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-xs shadow-md shadow-[#C9A84C]/25 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Routing to Management...' : 'Submit Official Management Inquiry'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
