'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Sparkles,
  Award,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Lock,
  Share2,
  Copy,
  Check,
  Music,
  Calendar,
  Globe,
  DollarSign,
  TrendingUp,
  Mail,
  Phone,
  Building,
  Heart,
  ChevronRight,
  Play,
  UserPlus,
  Send,
  ExternalLink,
  MessageSquare,
  AlertCircle,
} from 'lucide-react'
import { CELEBRITY_ARTISTS, type CelebrityArtist, type ArtistPerkTier } from '@/types/fanbase'
import { formatCurrency } from '@/lib/utils'

export default function CelebrityFanbasePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const artist = CELEBRITY_ARTISTS.find((a) => a.slug === slug)

  if (!artist) {
    notFound()
  }

  // Active Tab: 'overview' | 'tiers' | 'friends' | 'contact'
  const [activeTab, setActiveTab] = useState<'overview' | 'tiers' | 'friends' | 'contact'>('overview')

  // Investment Modal State
  const [selectedTier, setSelectedTier] = useState<ArtistPerkTier | null>(null)
  const [investorName, setInvestorName] = useState('')
  const [investorEmail, setInvestorEmail] = useState('')
  const [customAmount, setCustomAmount] = useState<number>(0)
  const [isSubmittingInvest, setIsSubmittingInvest] = useState(false)
  const [investmentSuccess, setInvestmentSuccess] = useState<any>(null)

  // Friends Syndicate Pool State
  const [circleName, setCircleName] = useState('My Friends Circle')
  const [friendSplitCount, setFriendSplitCount] = useState<number>(4)
  const [friendsEmails, setFriendsEmails] = useState('charlie@example.com, sam@example.com, alex@example.com')
  const [circleCreated, setCircleCreated] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Contact Form State
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactOrg, setContactOrg] = useState('')
  const [contactType, setContactType] = useState('VIP Fan Syndicate Inquiry')
  const [contactMessage, setContactMessage] = useState('')
  const [isSubmittingContact, setIsSubmittingContact] = useState(false)
  const [contactSuccess, setContactSuccess] = useState<any>(null)

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/fanbase/${artist.slug}`
      navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  const handleOpenInvest = (tier: ArtistPerkTier) => {
    setSelectedTier(tier)
    setCustomAmount(tier.minInvestment)
    setInvestmentSuccess(null)
  }

  const handleProcessInvestment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTier) return
    setIsSubmittingInvest(true)

    try {
      const res = await fetch(`/api/fanbase/${artist.slug}/invest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: selectedTier.id,
          amount: customAmount || selectedTier.minInvestment,
          investorName,
          investorEmail,
          isFriendsSyndicate: activeTab === 'friends',
          syndicateName: circleName,
          friendEmails: friendsEmails.split(',').map((e) => e.trim()).filter(Boolean),
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setInvestmentSuccess(data)
      } else {
        alert(data.error || 'Failed to submit investment.')
      }
    } catch (err) {
      console.error(err)
      alert('Network error connecting to syndicate registry.')
    } finally {
      setIsSubmittingInvest(false)
    }
  }

  const handleProcessContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingContact(true)

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
          message: contactMessage,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setContactSuccess(data)
      } else {
        alert(data.error || 'Failed to send inquiry.')
      }
    } catch (err) {
      console.error(err)
      alert('Error sending message to artist management.')
    } finally {
      setIsSubmittingContact(false)
    }
  }

  const fundedPct = Math.min(
    100,
    Math.round((artist.offering.fundedAmount / artist.offering.targetAmount) * 100)
  )

  return (
    <div className="bg-[#0A0D14] text-white min-h-screen pt-24 pb-24 selection:bg-[#C9A84C] selection:text-[#0F1C3F]">
      {/* ── PRIVATE LINK BANNER ── */}
      <div className="bg-gradient-to-r from-[#0F1C3F] via-[#211738] to-[#0F1C3F] border-b border-[#C9A84C]/30 py-2.5 px-4 text-xs font-semibold text-[#C9A84C] flex items-center justify-between gap-4 max-w-7xl mx-auto rounded-b-2xl shadow-lg">
        <div className="flex items-center gap-2 truncate">
          <Lock className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">
            Private Fanbase Allocation · Unlisted Round for Verified Friends & VIP Patrons
          </span>
        </div>
        <button
          onClick={handleCopyShareLink}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all flex-shrink-0"
        >
          {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#C9A84C]" />}
          <span>{copiedLink ? 'Link Copied!' : 'Copy Private Link'}</span>
        </button>
      </div>

      {/* ── HERO BANNER & ARTIST PROFILE ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#101420]">
          {/* Banner Graphic Image */}
          <div className="h-64 sm:h-80 w-full relative overflow-hidden">
            <img
              src={artist.heroImage}
              alt={artist.stageName}
              className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity filter brightness-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101420] via-[#101420]/60 to-transparent" />
          </div>

          {/* Profile Floating Details */}
          <div className="relative px-6 sm:px-10 pb-8 -mt-24 sm:-mt-28 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              <div className="relative">
                <img
                  src={artist.avatarImage}
                  alt={artist.stageName}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-[#101420] shadow-2xl shadow-black/80"
                />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#C9A84C] text-[#0F1C3F] flex items-center justify-center font-bold text-xs shadow-md" title="Verified Global Artist">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/40">
                    {artist.genre}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-gray-300">
                    {artist.label}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-white flex items-center gap-3">
                  <span>{artist.stageName}</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-300 max-w-xl">
                  {artist.title} · <span className="text-gray-400 font-normal">{artist.origin}</span>
                </p>
              </div>
            </div>

            {/* CTA actions */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => {
                  setSelectedTier(artist.tiers[1] || artist.tiers[0])
                  setCustomAmount((artist.tiers[1] || artist.tiers[0]).minInvestment)
                }}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-xs sm:text-sm transition-all shadow-lg shadow-[#C9A84C]/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Join Syndicate Round</span>
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm border border-white/15 transition-all"
              >
                <Mail className="w-4 h-4 text-[#C9A84C]" />
                <span>Contact Management</span>
              </button>
            </div>
          </div>

          {/* ── VERIFIED FANBASE METRICS BAR ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-4 sm:p-6 bg-white/[0.03] border-t border-white/10 text-center">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Monthly Listeners</span>
              <span className="text-lg sm:text-xl font-bold text-white mt-0.5 block">{artist.stats.monthlyListeners}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">YouTube Views</span>
              <span className="text-lg sm:text-xl font-bold text-white mt-0.5 block">{artist.stats.youtubeViews}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Instagram Fans</span>
              <span className="text-lg sm:text-xl font-bold text-[#C9A84C] mt-0.5 block">{artist.stats.instagramFollowers}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">TikTok Fans</span>
              <span className="text-lg sm:text-xl font-bold text-white mt-0.5 block">{artist.stats.tiktokFollowers}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Tour Box Office</span>
              <span className="text-lg sm:text-xl font-bold text-emerald-400 mt-0.5 block">{artist.stats.tourGrossToDate}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Catalog Streams</span>
              <span className="text-lg sm:text-xl font-bold text-white mt-0.5 block">{artist.stats.catalogStreams}</span>
            </div>
          </div>
        </div>

        {/* ── NAVIGATION TABS ── */}
        <div className="flex items-center gap-2 mt-8 border-b border-white/10 pb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-[#C9A84C] text-[#0F1C3F] shadow-md shadow-[#C9A84C]/20'
                : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Syndicate Overview & Music</span>
          </button>

          <button
            onClick={() => setActiveTab('tiers')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'tiers'
                ? 'bg-[#C9A84C] text-[#0F1C3F] shadow-md shadow-[#C9A84C]/20'
                : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Investment Tiers & VIP Perks ({artist.tiers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'friends'
                ? 'bg-[#C9A84C] text-[#0F1C3F] shadow-md shadow-[#C9A84C]/20'
                : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Invest for Friends / Pool Circle</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'contact'
                ? 'bg-[#C9A84C] text-[#0F1C3F] shadow-md shadow-[#C9A84C]/20'
                : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Artist Management & Inquiries</span>
          </button>
        </div>

        {/* ── TAB CONTENT ── */}
        <div className="mt-8 space-y-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Story & Offering */}
              <div className="lg:col-span-2 space-y-8">
                {/* Offering Summary Card */}
                <div className="p-6 sm:p-8 rounded-3xl bg-[#101420] border border-white/10 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#C9A84C] tracking-wider block mb-1">
                        Private Syndicate Offering
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold text-white">
                        {artist.offering.title}
                      </h2>
                      <p className="text-xs text-gray-400 mt-1">
                        {artist.offering.roundType}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs text-gray-400 block font-medium">Projected Annual Return</span>
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#C9A84C]">
                        {(artist.offering.projectedAPY * 100).toFixed(1)}% APY
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="text-gray-400">
                        Funded: <strong className="text-white font-bold">{formatCurrency(artist.offering.fundedAmount)}</strong>
                      </span>
                      <span className="text-gray-400">
                        Target: <strong className="text-white font-bold">{formatCurrency(artist.offering.targetAmount)}</strong>
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex">
                      <div
                        className="bg-gradient-to-r from-[#C9A84C] to-emerald-400 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${fundedPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                      <span>{fundedPct}% of Syndicate Secured</span>
                      <span>Quarterly Streaming & Tour Royalty Dividends</span>
                    </div>
                  </div>

                  {/* Offering Key Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Min. Entry</span>
                      <span className="text-sm font-bold text-white mt-0.5 block">${artist.offering.minInvestment}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Term</span>
                      <span className="text-sm font-bold text-white mt-0.5 block">{artist.offering.termMonths} Months</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Distributions</span>
                      <span className="text-sm font-bold text-white mt-0.5 block">Quarterly USD</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Risk Rating</span>
                      <span className="text-sm font-bold text-emerald-400 mt-0.5 block">{artist.offering.riskLevel} Risk</span>
                    </div>
                  </div>

                  {/* Use of Funds */}
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                      Capital Allocation & Master Distribution:
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300">
                      {artist.offering.useOfFunds.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A84C] flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fiduciary Protection Note */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0F1C3F] to-indigo-950/70 border border-[#C9A84C]/30 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {artist.offering.fiduciaryProtection}
                    </p>
                  </div>
                </div>

                {/* Artist Bio & Detailed Vision */}
                <div className="p-6 sm:p-8 rounded-3xl bg-[#101420] border border-white/10 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                    <span>Artist Vision & Background</span>
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {artist.bio}
                  </p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {artist.detailedStory}
                  </p>
                </div>
              </div>

              {/* Right Column: Music Catalog & Tour Schedule */}
              <div className="space-y-6">
                {/* Top Tracks Card */}
                <div className="p-6 rounded-3xl bg-[#101420] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Music className="w-4 h-4 text-[#C9A84C]" />
                      <span>Streaming Catalog Highlights</span>
                    </h3>
                    <span className="text-[10px] text-gray-400 font-mono">Master Syncs</span>
                  </div>

                  <div className="space-y-2.5">
                    {artist.topTracks.map((track, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-[#0F1C3F] text-[#C9A84C] flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {i + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{track.title}</p>
                            <span className="text-[10px] text-gray-400">{track.year} · {track.duration}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#C9A84C] flex-shrink-0">
                          {track.streams}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tour Dates Schedule */}
                <div className="p-6 rounded-3xl bg-[#101420] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#C9A84C]" />
                      <span>World Arena Tour Schedule</span>
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-semibold">Live Dates</span>
                  </div>

                  <div className="space-y-2.5">
                    {artist.tourDates.map((tour, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1 hover:border-[#C9A84C]/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{tour.venue}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C9A84C]/20 text-[#C9A84C]">
                            {tour.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                          <span>{tour.city}</span>
                          <span>{tour.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Invest CTA card */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0F1C3F] to-[#25173e] border border-[#C9A84C]/40 text-center space-y-4 shadow-xl">
                  <div className="w-12 h-12 rounded-2xl bg-[#C9A84C] text-[#0F1C3F] flex items-center justify-center mx-auto shadow-md">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Join {artist.stageName}&apos;s Circle</h3>
                    <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                      Participate in masters streaming royalties, tour revenues, and private VIP perks starting from $250.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('tiers')}
                    className="w-full py-3 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-xs shadow-md transition-all"
                  >
                    View All Tiers & Perks →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVESTMENT TIERS & VIP PERKS */}
          {activeTab === 'tiers' && (
            <div className="space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C9A84C] block">
                  Select Your Participation Level
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                  Exclusive Fanbase Investment Tiers
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  Every tier confers contractual economic participation in streaming royalties and live tour revenue, backed by verifiable electronic certificates.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {artist.tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className={`rounded-3xl p-6 border flex flex-col justify-between transition-all relative ${
                      tier.recommended
                        ? 'bg-[#12182b] border-[#C9A84C] shadow-xl shadow-[#C9A84C]/15 ring-2 ring-[#C9A84C]/40'
                        : 'bg-[#101420] border-white/10 hover:border-white/20'
                    }`}
                  >
                    {tier.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#C9A84C] text-[#0F1C3F] shadow-sm">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${tier.badgeColor}`}>
                          {tier.badge}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-2">{tier.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">{tier.royaltyShareText}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                        <div className="text-2xl font-black text-white">
                          ${tier.minInvestment.toLocaleString()}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#C9A84C] font-semibold mt-1">
                          <span>Projected Yield:</span>
                          <span>{(tier.projectedReturnRate * 100).toFixed(1)}% APY</span>
                        </div>
                      </div>

                      {/* Perks list */}
                      <div className="space-y-2 pt-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                          Included Perks:
                        </span>
                        <ul className="space-y-2 text-xs text-gray-300">
                          {tier.perks.map((perk, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                              <span className="leading-snug">{perk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-6 mt-4 border-t border-white/10">
                      <button
                        onClick={() => handleOpenInvest(tier)}
                        className={`w-full py-3 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 ${
                          tier.recommended
                            ? 'bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] shadow-[#C9A84C]/20'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Allocate ${tier.minInvestment.toLocaleString()}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: INVEST FOR FRIENDS / POOL CIRCLE */}
          {activeTab === 'friends' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
              <div className="text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C9A84C] block">
                  Social Circle Syndication
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                  Invest Together With Your Friends
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
                  Pool funds with your friends group chat to unlock higher VIP tiers (like VIP backstage concert passes or meet & greets) and share contractual quarterly royalty dividends together.
                </p>
              </div>

              {/* Friends Pool Builder Card */}
              <div className="p-6 sm:p-10 rounded-3xl bg-[#101420] border border-white/10 space-y-8 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                      1. Name Your Friends Circle
                    </label>
                    <input
                      type="text"
                      value={circleName}
                      onChange={(e) => setCircleName(e.target.value)}
                      placeholder="e.g. London VIP Squad / The Day 1 Crew"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                    />

                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 pt-2">
                      2. How Many Friends in the Circle?
                    </label>
                    <div className="flex items-center gap-2">
                      {[2, 3, 4, 5, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setFriendSplitCount(num)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                            friendSplitCount === num
                              ? 'bg-[#C9A84C] text-[#0F1C3F] border-[#C9A84C]'
                              : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {num} Friends
                        </button>
                      ))}
                    </div>

                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 pt-2">
                      3. Invite Friend Emails (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={friendsEmails}
                      onChange={(e) => setFriendsEmails(e.target.value)}
                      placeholder="Enter emails separated by commas..."
                      className="w-full p-3.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                    />
                  </div>

                  {/* Friends Pool Split Breakdown Preview */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0F1C3F] to-[#1c2a52] border border-[#C9A84C]/40 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#C9A84C]">
                          Circle Syndicate Preview
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                          Equal Split Pool
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-gray-300">Target VIP Tier:</span>
                          <span className="text-sm font-bold text-white">Backstage VIP Circle ($1,000)</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-gray-300">Total Group Capital:</span>
                          <span className="text-base font-bold text-[#C9A84C]">$1,000.00 USD</span>
                        </div>
                        <div className="flex justify-between items-baseline p-3 rounded-xl bg-white/10 border border-white/15">
                          <span className="text-xs font-bold text-white">Per Friend Contribution:</span>
                          <span className="text-lg font-black text-emerald-400">
                            ${(1000 / friendSplitCount).toFixed(2)} USD
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-300 leading-relaxed">
                          Each friend contributes ${(1000 / friendSplitCount).toFixed(2)} to collectively unlock the Backstage VIP Circle pass (includes 2 VIP concert tickets, meet & greet pass, and quarterly royalty dividends).
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCircleCreated(true)
                        handleCopyShareLink()
                      }}
                      className="w-full py-3 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{circleCreated ? 'Circle Created! Link Copied' : 'Generate Friends Syndicate Invite Link'}</span>
                    </button>
                  </div>
                </div>

                {circleCreated && (
                  <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-4 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span>
                        Your circle <strong>&quot;{circleName}&quot;</strong> is ready! Send your direct private link to your friends on WhatsApp, iMessage, or Telegram.
                      </span>
                    </div>
                    <button
                      onClick={handleCopyShareLink}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-[#0F1C3F] font-bold text-xs hover:bg-emerald-400 flex-shrink-0"
                    >
                      Copy Link
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ARTIST MANAGEMENT & CONTACT PAGE */}
          {activeTab === 'contact' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
              <div className="text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C9A84C] block">
                  Fiduciary Representation & Booking
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                  Contact {artist.stageName}&apos;s Executive Management
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
                  Direct official portal for syndicate co-investors, high-net-worth patrons, corporate booking, brand endorsements, and press inquiries.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Official Contact Info Card */}
                <div className="p-6 rounded-3xl bg-[#101420] border border-white/10 space-y-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C9A84C] block border-b border-white/10 pb-3">
                    Management Dossier
                  </span>

                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Executive Manager</span>
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
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Fiduciary Counsel</span>
                      <p className="text-gray-300 mt-0.5 leading-snug">{artist.managementContact.fiduciaryCounsel}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Headquarters</span>
                      <p className="text-gray-300 mt-0.5">{artist.managementContact.headquarters}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 text-[11px] text-gray-400 leading-relaxed">
                    Official inquiries receive a registered confirmation ticket and response within 24 business hours.
                  </div>
                </div>

                {/* Interactive Contact Form */}
                <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-[#101420] border border-white/10 space-y-5">
                  <h3 className="text-base font-bold text-white">Send Direct Message to Management</h3>

                  {contactSuccess ? (
                    <div className="p-6 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-center space-y-3 animate-fade-in">
                      <div className="w-12 h-12 rounded-full bg-emerald-500 text-[#0F1C3F] flex items-center justify-center mx-auto font-bold">
                        <Check className="w-6 h-6 stroke-[3]" />
                      </div>
                      <h4 className="text-base font-bold text-white">Inquiry Transmitted Successfully</h4>
                      <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
                        {contactSuccess.message}
                      </p>
                      <span className="text-xs font-mono text-[#C9A84C] block">
                        Reference Docket: {contactSuccess.referenceId}
                      </span>
                      <button
                        onClick={() => setContactSuccess(null)}
                        className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 mt-2"
                      >
                        Send Another Inquiry
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleProcessContact} className="space-y-4">
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
                            placeholder="e.g. investor@example.com"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1">Phone Number (Optional)</label>
                          <input
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="+1 (555) 000-0000"
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
                            <option value="Corporate / Private Booking">Corporate / Private Booking</option>
                            <option value="Brand Endorsement & Sponsorship">Brand Endorsement & Sponsorship</option>
                            <option value="High-Net-Worth Sovereign Investor">High-Net-Worth Sovereign Investor</option>
                            <option value="Press / Media Interview">Press / Media Interview</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Your Detailed Message *</label>
                        <textarea
                          rows={4}
                          required
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          placeholder="Provide details about your syndicate inquiry, desired allocation, event date, or brand partnership proposal..."
                          className="w-full p-3.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A84C] leading-relaxed"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={isSubmittingContact}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-xs transition-all shadow-md shadow-[#C9A84C]/20 disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSubmittingContact ? 'Routing to Management...' : 'Transmit Inquiry to Management'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── INVESTMENT ALLOCATION MODAL ── */}
      {selectedTier && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121624] border border-white/15 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-slide-up text-white">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C9A84C] tracking-wider block mb-1">
                  Private Syndicate Allocation
                </span>
                <h3 className="text-xl font-bold text-white">
                  {selectedTier.name} · {artist.stageName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTier(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {investmentSuccess ? (
              <div className="text-center space-y-4 py-4 animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-[#0F1C3F] flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h4 className="text-lg font-bold text-white">Syndicate Allocation Executed!</h4>
                <p className="text-xs text-gray-300 leading-relaxed max-w-md mx-auto">
                  {investmentSuccess.message}
                </p>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 font-mono text-xs space-y-1.5 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reference:</span>
                    <span className="text-[#C9A84C] font-bold">{investmentSuccess.referenceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tier Selected:</span>
                    <span className="text-white font-semibold">{investmentSuccess.tierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Funded:</span>
                    <span className="text-emerald-400 font-bold">${investmentSuccess.amount.toLocaleString()}.00 USD</span>
                  </div>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <Link
                    href="/portfolio"
                    className="px-6 py-2.5 rounded-xl bg-[#C9A84C] text-[#0F1C3F] font-bold text-xs hover:bg-[#d4b460]"
                  >
                    View in Portfolio
                  </Link>
                  <button
                    onClick={() => setSelectedTier(null)}
                    className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-xs hover:bg-white/20"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProcessInvestment} className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Selected Tier:</span>
                    <span className="font-bold text-white">{selectedTier.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Projected Return:</span>
                    <span className="font-bold text-[#C9A84C]">{(selectedTier.projectedReturnRate * 100).toFixed(1)}% APY</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Royalty Scope:</span>
                    <span className="text-gray-200">{selectedTier.royaltyShareText}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Allocation Amount (USD) *
                  </label>
                  <input
                    type="number"
                    min={selectedTier.minInvestment}
                    step={50}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Minimum requirement for {selectedTier.name} is ${selectedTier.minInvestment.toLocaleString()}.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Investor Full Name *</label>
                    <input
                      type="text"
                      required
                      value={investorName}
                      onChange={(e) => setInvestorName(e.target.value)}
                      placeholder="e.g. Julian Sterling"
                      className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Investor Email *</label>
                    <input
                      type="email"
                      required
                      value={investorEmail}
                      onChange={(e) => setInvestorEmail(e.target.value)}
                      placeholder="e.g. julian@example.com"
                      className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0F1C3F] text-[11px] text-gray-300 border border-white/10 leading-relaxed">
                  🔒 Zurich Fiduciary Protection: Your capital is held in bankruptcy-remote master escrow. Quarterly distributions are credited directly in USD.
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedTier(null)}
                    className="px-4 py-2.5 rounded-xl border border-white/15 text-gray-400 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingInvest}
                    className="px-6 py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-xs shadow-md shadow-[#C9A84C]/25 disabled:opacity-50"
                  >
                    {isSubmittingInvest ? 'Executing Allocation...' : `Confirm $${customAmount.toLocaleString()} Allocation`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
