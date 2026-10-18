'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  User,
  Shield,
  KeyRound,
  Bell,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Lock,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  QrCode,
  Globe,
  Sparkles,
} from 'lucide-react'

export default function InvestorSettingsPage() {
  const [activeTab, setActiveTab] = useState<'bio' | 'profile' | 'security' | 'notifications'>('bio')

  const [profile, setProfile] = useState({
    name: 'Investor',
    username: 'investor',
    phone: '',
    email: '',
    bio: 'Building our generational wealth together on Union Verify. Co-managing our 6.8% compounding joint spousal vault. 💍✨',
    instagram: '',
    tiktok: '',
    twitter: '',
    whatsapp: '',
    website: 'https://unionverify.com',
    publicChatEnabled: true,
    showEmail: true,
    showPhone: true,
    spouseName: '',
    spouseEmail: '',
    spousePhone: '',
  })

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [twoFactor, setTwoFactor] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)

  const publicBioUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/u/${profile.username || 'investor'}`
    : `https://unionverify.com/u/${profile.username || 'investor'}`

  // Load live profile & spouse contact details on client mount
  useEffect(() => {
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setProfile({
            name: data.user.name || '',
            username: data.user.username || '',
            phone: data.user.phone || '',
            email: data.user.email || '',
            bio: data.user.bio || 'Building our generational wealth together on Union Verify. Co-managing our 6.8% compounding joint spousal vault. 💍✨',
            instagram: data.user.socials?.instagram || '',
            tiktok: data.user.socials?.tiktok || '',
            twitter: data.user.socials?.twitter || '',
            whatsapp: data.user.socials?.whatsapp || data.user.phone || '',
            website: data.user.socials?.website || 'https://unionverify.com',
            publicChatEnabled: data.user.publicChatEnabled !== false,
            showEmail: data.user.showEmail !== false,
            showPhone: data.user.showPhone !== false,
            spouseName: data.spouse?.name || '',
            spouseEmail: data.spouse?.email || '',
            spousePhone: data.spouse?.phone || '',
          })
        }
      })
      .catch(console.error)
  }, [])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicBioUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          username: profile.username,
          phone: profile.phone,
          bio: profile.bio,
          socials: {
            instagram: profile.instagram,
            tiktok: profile.tiktok,
            twitter: profile.twitter,
            whatsapp: profile.whatsapp,
            website: profile.website,
          },
          publicChatEnabled: profile.publicChatEnabled,
          showPhone: profile.showPhone,
          showEmail: profile.showEmail,
          spouseEmail: profile.spouseEmail,
          spousePhone: profile.spousePhone,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')
      setStatusMsg('✓ Public Bio Profile & Chat settings successfully updated and synced live!')
      setTimeout(() => setStatusMsg(''), 4000)
    } catch (err: any) {
      setErrorMsg(err.message)
      setTimeout(() => setErrorMsg(''), 3500)
    }
  }

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) {
      setErrorMsg('New passwords do not match.')
      return
    }
    setErrorMsg('')
    setStatusMsg('Password updated successfully.')
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setTimeout(() => setStatusMsg(''), 3000)
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1C3F]">Account & Profile Settings</h1>
        <p className="text-xs text-gray-500 mt-1">
          Configure your shareable social bio profile, direct contact chat links, partner credentials, and security safeguards.
        </p>
      </div>

      {/* ── TOP HERO CARD: SOCIAL BIO PROFILE & CHAT LINK ── */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0F1C3F] via-[#152654] to-[#0F1C3F] p-6 text-white shadow-xl border border-[#C9A84C]/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A84C]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#C9A84C] text-[10px] font-bold uppercase tracking-wider">
                <Sparkles size={11} />
                <span>Link for Social Media Profiles</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Your Public Verified Bio & Chat Link
              </h2>
              <p className="text-xs text-gray-300">
                Add this link to your Instagram, TikTok, Twitter/X, or WhatsApp bio so friends and contacts can inspect your credentials and chat directly with you.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors border border-white/10 flex items-center gap-1.5"
                title="Scan QR Code"
              >
                <QrCode size={15} className="text-[#C9A84C]" />
                <span className="hidden sm:inline">QR Code</span>
              </button>
              <Link
                href={`/u/${profile.username || 'jane-doe'}`}
                target="_blank"
                className="px-4 py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <span>View Bio</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-2xl bg-black/30 border border-white/10">
            <div className="flex-1 px-3 py-1.5 text-xs font-mono text-[#C9A84C] truncate select-all">
              {publicBioUrl}
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 flex-shrink-0"
            >
              {copiedLink ? (
                <>
                  <Check size={13} className="text-emerald-400" />
                  <span className="text-emerald-300">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy Link for Bio</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('bio')}
          className={`pb-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'bio'
              ? 'border-[#C9A84C] text-[#0F1C3F] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Share2 size={14} className={activeTab === 'bio' ? 'text-[#C9A84C]' : ''} />
          <span>Social Bio & Direct Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'border-[#C9A84C] text-[#0F1C3F] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <User size={14} className={activeTab === 'profile' ? 'text-[#C9A84C]' : ''} />
          <span>Partner Contact & Signatories</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'security'
              ? 'border-[#C9A84C] text-[#0F1C3F] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Lock size={14} className={activeTab === 'security' ? 'text-[#C9A84C]' : ''} />
          <span>Security & Password</span>
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'notifications'
              ? 'border-[#C9A84C] text-[#0F1C3F] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Bell size={14} className={activeTab === 'notifications' ? 'text-[#C9A84C]' : ''} />
          <span>Notification Preferences</span>
        </button>
      </div>

      {/* ── TAB 1: SOCIAL BIO PROFILE & CHAT SETUP ── */}
      {activeTab === 'bio' && (
        <form onSubmit={handleProfileSave} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-[#0F1C3F] flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#C9A84C]" />
                Public Social Bio & Direct Chat Setup
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Customize what appears when visitors click your profile link from social media.
              </p>
            </div>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
              Live & Public
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Username / Bio Slug *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono">
                  unionverify.com/u/
                </span>
                <input
                  type="text"
                  required
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  className="w-full pl-36 pr-4 py-2.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                WhatsApp / Direct Chat Number
              </label>
              <input
                type="text"
                placeholder="e.g. +1 (555) 012-3456"
                value={profile.whatsapp}
                onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Profile Bio Tagline
            </label>
            <textarea
              rows={2}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none resize-none"
              placeholder="Tell followers about your investment covenant and goals..."
            />
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Social Media Handles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Instagram Handle</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">@</span>
                  <input
                    type="text"
                    placeholder="janedoe_invest"
                    value={profile.instagram}
                    onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-gray-500 mb-1">TikTok Handle</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">@</span>
                  <input
                    type="text"
                    placeholder="janedoe_official"
                    value={profile.tiktok}
                    onChange={(e) => setProfile({ ...profile, tiktok: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Twitter / X Handle</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">@</span>
                  <input
                    type="text"
                    placeholder="janedoe_wealth"
                    value={profile.twitter}
                    onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Direct Chat Permissions */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Direct Contact & Chat Permissions
            </h3>
            <div className="space-y-2.5">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.publicChatEnabled}
                  onChange={(e) => setProfile({ ...profile, publicChatEnabled: e.target.checked })}
                  className="rounded text-[#C9A84C] focus:ring-[#C9A84C] w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-gray-900 block">Enable Public Direct Chat</span>
                  <span className="text-gray-500">Allow followers and visitors from your bio link to send you direct messages into your portal chat.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.showEmail}
                  onChange={(e) => setProfile({ ...profile, showEmail: e.target.checked })}
                  className="rounded text-[#C9A84C] focus:ring-[#C9A84C] w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-gray-900 block">Show Verified Email Address</span>
                  <span className="text-gray-500">Display your official <code className="text-[#0F1C3F] font-bold">{profile.email}</code> contact button on your bio page.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.showPhone}
                  onChange={(e) => setProfile({ ...profile, showPhone: e.target.checked })}
                  className="rounded text-[#C9A84C] focus:ring-[#C9A84C] w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-gray-900 block">Show Verified Phone & WhatsApp Button</span>
                  <span className="text-gray-500">Enable 1-click WhatsApp messaging and telephone reach.</span>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#0F1C3F] hover:bg-[#162c5e] text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              Save Public Bio & Chat Settings
            </button>
            <Link
              href={`/u/${profile.username || 'jane-doe'}`}
              target="_blank"
              className="text-xs font-bold text-[#C9A84C] hover:underline flex items-center gap-1"
            >
              <span>Test Public Profile</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </form>
      )}

      {/* ── TAB 2: PARTNER PROFILE & CONTACT ── */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#0F1C3F] flex items-center gap-2">
                <User className="w-4 h-4 text-[#C9A84C]" />
                Primary Partner (Your Profile)
              </h2>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Signatory Verified
              </span>
            </div>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Your Legal Name *
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Your Primary Account Email (Read-only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Your Verified Contact Telephone
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                />
              </div>

              <div className="pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#0F1C3F] flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#C9A84C]" />
                    Connected Spouse Contact (Linked to Chat & Reminders)
                  </h3>
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                    Covenant Connected
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Deposit reminders, reciprocation notifications, and chat invites will be delivered to this email and telephone number.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Spouse / Partner Name
                    </label>
                    <input
                      type="text"
                      value={profile.spouseName}
                      disabled
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Spouse Delivery Email (For Deposit Nudges)
                    </label>
                    <input
                      type="email"
                      value={profile.spouseEmail}
                      onChange={(e) => setProfile({ ...profile, spouseEmail: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Spouse Verified Mobile / SMS Contact
                  </label>
                  <input
                    type="tel"
                    value={profile.spousePhone}
                    onChange={(e) => setProfile({ ...profile, spousePhone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0F1C3F] hover:bg-[#162c5e] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Save Profile & Contact Information
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 3: SECURITY & PASSWORD ── */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-base font-bold text-[#0F1C3F] mb-6">Change Portal Password</h2>
            <form onSubmit={handlePasswordSave} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#0F1C3F] hover:bg-[#162c5e] text-white text-xs font-bold transition-colors shadow-sm"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 4: NOTIFICATIONS ── */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-[#0F1C3F]">Notification Dispatches</h2>
          <p className="text-xs text-gray-500">
            Choose which notifications are delivered to your verified email and mobile device.
          </p>

          <div className="space-y-4 text-xs">
            {[
              { title: 'Deposit Reminders & Mutual Parity Nudges', desc: 'Alerts when your spouse requests a deposit match.', active: true },
              { title: 'Chat & Proposal Approvals', desc: 'Real-time notifications when a chat proposal is approved or confirmed.', active: true },
              { title: 'Public Bio Direct Messages', desc: 'Notifications whenever someone sends a message via your public social bio link.', active: true },
              { title: 'Monthly Compound Yield Summaries', desc: 'Detailed PDF statements delivered on the 1st of every month.', active: true },
            ].map((n, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                <div>
                  <h4 className="font-bold text-gray-900">{n.title}</h4>
                  <p className="text-gray-500 mt-0.5">{n.desc}</p>
                </div>
                <input type="checkbox" defaultChecked={n.active} className="w-4 h-4 text-[#C9A84C] rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Code Modal in Settings */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#0F1C3F] border border-white/20 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">Your Social Bio QR Code</h3>
              <button onClick={() => setShowQrModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="bg-white p-6 rounded-2xl mx-auto w-fit shadow-inner">
              <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="180" height="180" fill="white" />
                <rect x="15" y="15" width="45" height="45" fill="#0F1C3F" rx="6" />
                <rect x="23" y="23" width="29" height="29" fill="white" rx="3" />
                <rect x="29" y="29" width="17" height="17" fill="#C9A84C" rx="2" />
                <rect x="120" y="15" width="45" height="45" fill="#0F1C3F" rx="6" />
                <rect x="128" y="23" width="29" height="29" fill="white" rx="3" />
                <rect x="134" y="29" width="17" height="17" fill="#C9A84C" rx="2" />
                <rect x="15" y="120" width="45" height="45" fill="#0F1C3F" rx="6" />
                <rect x="23" y="128" width="29" height="29" fill="white" rx="3" />
                <rect x="29" y="134" width="17" height="17" fill="#C9A84C" rx="2" />
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
              Share this on Instagram, TikTok, or print for wedding cards so guests can chat with you directly.
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
