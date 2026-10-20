'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldCheck,
  Award,
  MessageSquare,
  MessageCircle,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  ExternalLink,
  QrCode,
  Sparkles,
  Heart,
  Flame,
  ArrowRight,
  X,
  Lock,
  Globe,
} from 'lucide-react'

export default function UserPublicProfilePage() {
  const params = useParams()
  const rawSlug = (params?.slug as string) || 'jane-doe'
  const slug = rawSlug.toLowerCase()

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Interactive Direct Chat Modal State
  const [chatModalOpen, setChatModalOpen] = useState(false)
  const [senderName, setSenderName] = useState('')
  const [senderContact, setSenderContact] = useState('')
  const [messageText, setMessageText] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [msgSentSuccess, setMsgSentSuccess] = useState(false)

  // Copy feedback
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)

  const currentUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/u/${slug}`
    : `https://unionverify.com/u/${slug}`

  useEffect(() => {
    fetch(`/api/user/profile/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          setProfile(data.profile)
        } else {
          setError('Profile not found')
        }
      })
      .catch((err) => {
        console.error(err)
        setError('Failed to load profile')
      })
      .finally(() => setLoading(false))
  }, [slug])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim()) return

    setSendingMsg(true)
    try {
      const res = await fetch(`/api/user/profile/${slug}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: senderName || 'Social Bio Visitor',
          senderEmail: senderContact,
          message: messageText,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send message')
      setMsgSentSuccess(true)
      setMessageText('')
      setSenderName('')
      setSenderContact('')
    } catch (err: any) {
      alert(err.message || 'Error sending message')
    } finally {
      setSendingMsg(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1C3F] flex items-center justify-center text-white p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-[#C9A84C] font-semibold">
            Verifying Identity Credentials...
          </p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0F1C3F] flex items-center justify-center text-white p-6">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-[#C9A84C] mx-auto opacity-60" />
          <h2 className="text-xl font-bold">Profile Unavailable</h2>
          <p className="text-xs text-gray-300">
            The requested member profile could not be verified on the fiduciary ledger.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#C9A84C] text-[#0F1C3F] font-bold text-xs hover:bg-[#d4b460] transition-colors"
          >
            Return to Union Verify
          </Link>
        </div>
      </div>
    )
  }

  const isMarcus = slug.includes('marcus')
  const primaryName = profile.name
  const spouseName = profile.spouse?.name || 'Your Partner'
  const phone = profile.contact?.phone || ''
  const email = profile.contact?.email || `${slug}@unionverify.com`
  const cleanPhone = phone.replace(/[^0-9]/g, '')

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1C3F] via-[#14234b] to-[#0A1329] text-white py-12 px-4 sm:px-6 relative overflow-hidden flex flex-col items-center justify-start">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container — Optimized for Mobile Link-in-Bio */}
      <div className="w-full max-w-lg z-10 space-y-6">
        {/* Top Floating Badge */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/50 flex items-center justify-center">
              <span className="text-[10px] text-[#C9A84C] font-black">UV</span>
            </div>
            <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">
              Union <span className="text-[#C9A84C]">Verify</span>
            </span>
          </Link>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs text-gray-200 border border-white/15 transition-all shadow-sm active:scale-95"
            title="Copy Bio Link for Socials"
          >
            {copiedLink ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span className="text-[11px] text-emerald-300 font-bold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 size={12} className="text-[#C9A84C]" />
                <span className="text-[11px] font-semibold">Share Profile</span>
              </>
            )}
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center space-y-5">
          {/* Verified Pill */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/50 text-[#C9A84C] text-[11px] font-bold uppercase tracking-wider shadow-sm">
            <ShieldCheck size={14} className="text-[#C9A84C]" />
            <span>Verified Matrimonial Signatory</span>
          </div>

          {/* Couple Avatars with Interlocking Status */}
          <div className="flex items-center justify-center -space-x-3 my-2">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#C9A84C] via-[#e2c77d] to-[#C9A84C] p-0.5 shadow-xl">
                <div className="w-full h-full rounded-full bg-[#0F1C3F] flex items-center justify-center font-bold text-2xl text-white">
                  {profile.avatar || primaryName.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0F1C3F] rounded-full" title="Online" />
            </div>

            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-slate-400 via-white to-slate-300 p-0.5 shadow-xl">
                <div className="w-full h-full rounded-full bg-[#162752] flex items-center justify-center font-bold text-lg text-[#C9A84C]">
                  {spouseName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
              </div>
            </div>
          </div>

          {/* Name & Spouse details */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <span>{primaryName}</span>
              <span className="w-5 h-5 rounded-full bg-[#C9A84C] text-[#0F1C3F] text-xs font-black inline-flex items-center justify-center" title="Verified Signatory">
                ✓
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#C9A84C] font-semibold mt-1">
              Joint Covenant with {spouseName} · 50/50 Equal Rights
            </p>
            <p className="text-xs text-gray-300 max-w-sm mx-auto mt-3 leading-relaxed">
              {profile.bio}
            </p>
          </div>

          {/* Verified Seal & Stats */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/10 text-center">
            <div className="p-2">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Covenant APY</span>
              <span className="text-sm sm:text-base font-black text-emerald-400">6.8% Daily</span>
            </div>
            <div className="p-2 border-x border-white/10">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Parity Balance</span>
              <span className="text-sm sm:text-base font-black text-white">100% Equal</span>
            </div>
            <div className="p-2">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Seal Code</span>
              <span className="text-xs sm:text-xs font-mono font-bold text-[#C9A84C] block truncate">
                {profile.covenantSeal || 'UV-2026'}
              </span>
            </div>
          </div>

          {/* ── PRIMARY HERO CTA: CHAT DIRECTLY ── */}
          <div className="space-y-2 pt-1">
            <Link
              href={`/chat?recipientId=${profile.userId}&name=${encodeURIComponent(primaryName)}`}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C9A84C] via-[#e2c77d] to-[#C9A84C] hover:from-[#d4b460] hover:to-[#d4b460] text-[#0F1C3F] font-black text-sm sm:text-base shadow-xl shadow-[#C9A84C]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <MessageSquare className="w-5 h-5 fill-[#0F1C3F]" />
              <span>Chat with {primaryName.split(' ')[0]} Now</span>
            </Link>
            <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Direct real-time chat</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setChatModalOpen(true)
                  setMsgSentSuccess(false)
                }}
                className="text-[#C9A84C] hover:underline cursor-pointer"
              >
                Send quick note without login →
              </button>
            </div>
          </div>
        </div>

        {/* ── QUICK CONTACT & DIRECT REACH CARDS ── */}
        <div className="rounded-3xl bg-white/5 border border-white/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C9A84C]">
              Direct Contact & Social Profiles
            </span>
            <span className="text-[10px] text-gray-400">Verified Channels</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Email Contact Card */}
            <a
              href={`mailto:${email}?subject=Hello%20from%20Union%20Verify%20Bio`}
              className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center flex-shrink-0">
                  <Mail size={16} />
                </div>
                <div className="min-w-0 text-left">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Official Email</span>
                  <span className="text-xs font-semibold text-white truncate block">{email}</span>
                </div>
              </div>
              <ExternalLink size={13} className="text-gray-500 group-hover:text-white transition-colors" />
            </a>

            {/* WhatsApp / Phone Card */}
            <a
              href={`https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(primaryName)},%20I%20saw%20your%20Union%20Verify%20profile!`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={16} />
                </div>
                <div className="min-w-0 text-left">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">WhatsApp / SMS</span>
                  <span className="text-xs font-semibold text-white truncate block">{phone}</span>
                </div>
              </div>
              <ExternalLink size={13} className="text-gray-500 group-hover:text-white transition-colors" />
            </a>
          </div>

          {/* Social Media Link Handles */}
          <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
            {profile.socials?.instagram && (
              <a
                href={`https://instagram.com/${profile.socials.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-1.5"
              >
                <span>📸 @{profile.socials.instagram.replace('@', '')}</span>
              </a>
            )}
            {profile.socials?.tiktok && (
              <a
                href={`https://tiktok.com/@${profile.socials.tiktok.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-1.5"
              >
                <span>🎵 @{profile.socials.tiktok.replace('@', '')}</span>
              </a>
            )}
            {profile.socials?.twitter && (
              <a
                href={`https://x.com/${profile.socials.twitter.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-1.5"
              >
                <span>𝕏 @{profile.socials.twitter.replace('@', '')}</span>
              </a>
            )}
          </div>
        </div>

        {/* ── COUPLE MATRIMONIAL ACTIONS (Link in Bio conversions) ── */}
        <div className="space-y-2.5">
          <Link
            href="/registry"
            className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/20 text-[#C9A84C] flex items-center justify-center">
                <Heart size={18} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-white group-hover:text-[#C9A84C] transition-colors">
                  Wedding & Anniversary Cash Registry
                </h4>
                <p className="text-[11px] text-gray-400">
                  Send a cash gift compounding at 6.8% APY into our joint spousal vault
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-500 group-hover:text-[#C9A84C] transition-colors" />
          </Link>

          <Link
            href="/certificate"
            className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                <Award size={18} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                  Inspect Marriage Certificate Bond
                </h4>
                <p className="text-[11px] text-gray-400">
                  Seal {profile.covenantSeal || 'UV-2026'} · Union Verify Registry
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-500 group-hover:text-blue-300 transition-colors" />
          </Link>

          <Link
            href={`/join?partner=${encodeURIComponent(primaryName)}`}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 hover:from-emerald-500/20 hover:to-emerald-500/10 border border-emerald-500/20 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Start Your Own Couple Vault
                </h4>
                <p className="text-[11px] text-emerald-400">
                  Join Union Verify with {primaryName}&apos;s verified referral code
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-500 group-hover:text-emerald-300 transition-colors" />
          </Link>
        </div>

        {/* ── BIO FOOTER & SHARING BAR ── */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQrModalOpen(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
              title="Show QR Code"
            >
              <QrCode size={14} className="text-[#C9A84C]" />
              <span className="text-[11px] font-semibold">QR Code</span>
            </button>
            <span className="text-gray-600">|</span>
            <span className="text-[11px]">Add to Social Bio: <code className="text-[#C9A84C]">/u/{slug}</code></span>
          </div>

          <button
            onClick={handleCopyLink}
            className="text-[11px] font-bold text-[#C9A84C] hover:text-[#e2c77d] transition-colors flex items-center gap-1"
          >
            {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copiedLink ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="text-center pt-4">
          <p className="text-[10px] text-gray-500">
            © {new Date().getFullYear()} Union Verify. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── INTERACTIVE DIRECT CHAT MODAL ── */}
      {chatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0F1C3F] border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center text-[#C9A84C]">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Chat with {primaryName}</h3>
                  <p className="text-[10px] text-emerald-400 font-semibold">● Online · Direct Couple Inbox</p>
                </div>
              </div>
              <button
                onClick={() => setChatModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {msgSentSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Message Dispatched!</h4>
                <p className="text-xs text-gray-300 max-w-xs mx-auto">
                  Your message has been delivered directly to {primaryName}&apos;s verified Union Verify inbox.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Link
                    href={`/chat?recipientId=${profile.userId}&name=${encodeURIComponent(primaryName)}`}
                    className="px-5 py-2.5 rounded-xl bg-[#C9A84C] text-[#0F1C3F] font-bold text-xs hover:bg-[#d4b460] transition-colors"
                  >
                    Open in Real-Time Chat →
                  </Link>
                  <button
                    onClick={() => setChatModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Taylor"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A84C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Your Contact (Email, Instagram, or Phone)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. alex@gmail.com or @alex_taylor"
                    value={senderContact}
                    onChange={(e) => setSenderContact(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A84C]"
                  />
                </div>

                {/* Quick Conversation Starters */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5 flex items-center justify-between">
                    <span>Quick Starters (Tap to start)</span>
                    <span className="text-[10px] text-[#C9A84C] font-normal">Simple & direct</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      { label: '🎁 Wedding Gift', text: `Hi ${primaryName}, I want to contribute a wedding gift to your cash registry fund! 🎁` },
                      { label: '💰 $250 Deposit Match', text: `Hey ${primaryName}, let’s match a $250 deposit into the joint vault today! 💰` },
                      { label: '🥂 Congratulations', text: `Congratulations on your union and marriage covenant, ${primaryName}! Wishing you lifetime joy and wealth! 🥂` },
                      { label: '🤝 Partnership', text: `Hi ${primaryName}, reaching out regarding a partnership / collaboration inquiry.` },
                    ].map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setMessageText(s.text)}
                        className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-[#C9A84C]/20 hover:text-[#C9A84C] text-gray-300 text-[11px] font-medium transition-colors text-left"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Message
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder={`Write a note, congratulations, or inquiry to ${primaryName}...`}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A84C] resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={sendingMsg}
                    className="flex-1 py-3 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {sendingMsg ? (
                      <span className="w-4 h-4 border-2 border-[#0F1C3F]/30 border-t-[#0F1C3F] rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(primaryName)},%20I%20saw%20your%20Union%20Verify%20profile!`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    title="Open in WhatsApp"
                  >
                    <MessageCircle size={15} />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>
                </div>

                <div className="pt-2 text-center">
                  <Link
                    href="/chat"
                    className="text-[11px] text-gray-400 hover:text-white transition-colors underline"
                  >
                    Are you {spouseName}? Open your live Couple Portal Chat →
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── QR CODE MODAL ── */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#0F1C3F] border border-white/20 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">Profile QR Code</h3>
              <button onClick={() => setQrModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="bg-white p-6 rounded-2xl mx-auto w-fit shadow-inner">
              {/* Clean SVG QR Code Representation */}
              <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="180" height="180" fill="white" />
                {/* Position Markers */}
                <rect x="15" y="15" width="45" height="45" fill="#0F1C3F" rx="6" />
                <rect x="23" y="23" width="29" height="29" fill="white" rx="3" />
                <rect x="29" y="29" width="17" height="17" fill="#C9A84C" rx="2" />

                <rect x="120" y="15" width="45" height="45" fill="#0F1C3F" rx="6" />
                <rect x="128" y="23" width="29" height="29" fill="white" rx="3" />
                <rect x="134" y="29" width="17" height="17" fill="#C9A84C" rx="2" />

                <rect x="15" y="120" width="45" height="45" fill="#0F1C3F" rx="6" />
                <rect x="23" y="128" width="29" height="29" fill="white" rx="3" />
                <rect x="29" y="134" width="17" height="17" fill="#C9A84C" rx="2" />

                {/* Data Grid Pattern */}
                <rect x="75" y="20" width="10" height="25" fill="#0F1C3F" />
                <rect x="95" y="25" width="12" height="10" fill="#0F1C3F" />
                <rect x="75" y="60" width="30" height="10" fill="#C9A84C" />
                <rect x="20" y="75" width="15" height="25" fill="#0F1C3F" />
                <rect x="50" y="85" width="25" height="15" fill="#0F1C3F" />
                <rect x="90" y="80" width="20" height="20" fill="#0F1C3F" />
                <rect x="125" y="75" width="40" height="10" fill="#0F1C3F" />
                <rect x="140" y="95" width="20" height="25" fill="#C9A84C" />
                <rect x="75" y="115" width="25" height="15" fill="#0F1C3F" />
                <rect x="110" y="125" width="25" height="20" fill="#0F1C3F" />
                <rect x="80" y="145" width="25" height="15" fill="#C9A84C" />
                <rect x="145" y="135" width="15" height="25" fill="#0F1C3F" />
              </svg>
            </div>

            <p className="text-xs text-gray-300">
              Scan with camera to visit <strong>unionverify.com/u/{slug}</strong> and chat directly.
            </p>

            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
            >
              {copiedLink ? '✓ Copied Link' : 'Copy Profile Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
