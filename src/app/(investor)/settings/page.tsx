'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import SpouseLinkPanel from '@/components/investor/SpouseLinkPanel'
import ProfilePhotoPicker from '@/components/investor/ProfilePhotoPicker'
import {
  User,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Share2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react'

interface SpouseInfo {
  name: string
  email: string
  phone: string
}

export default function InvestorSettingsPage() {
  const [activeTab, setActiveTab] = useState<'bio' | 'profile'>('bio')

  const [profile, setProfile] = useState({
    name: '',
    username: '',
    phone: '',
    email: '',
    bio: '',
    instagram: '',
    tiktok: '',
    twitter: '',
    whatsapp: '',
    linkedin: '',
    website: '',
    publicChatEnabled: true,
    showEmail: true,
    showPhone: true,
  })
  // Saved on the server (null until the member has a username)
  const [publicBioPath, setPublicBioPath] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [partners, setPartners] = useState<SpouseInfo[]>([])

  const [statusMsg, setStatusMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const publicBioUrl =
    publicBioPath && typeof window !== 'undefined' ? `${window.location.origin}${publicBioPath}` : publicBioPath

  const loadProfile = useCallback(() => {
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setProfile({
            name: data.user.name || '',
            username: data.user.username || '',
            phone: data.user.phone || '',
            email: data.user.email || '',
            bio: data.user.bio || '',
            instagram: data.user.socials?.instagram || '',
            tiktok: data.user.socials?.tiktok || '',
            twitter: data.user.socials?.twitter || '',
            whatsapp: data.user.socials?.whatsapp || '',
            linkedin: data.user.socials?.linkedin || '',
            website: data.user.socials?.website || '',
            publicChatEnabled: data.user.publicChatEnabled !== false,
            showEmail: data.user.showEmail !== false,
            showPhone: data.user.showPhone !== false,
          })
          setPublicBioPath(data.user.publicBioUrl || null)
          setAvatarUrl(data.user.avatarUrl || null)
          setPartners(
            (data.partners || []).map((p: SpouseInfo) => ({ name: p.name || '', email: p.email || '', phone: p.phone || '' }))
          )
        }
      })
      .catch(console.error)
  }, [])

  // Load the member's own profile and their partners' contact details
  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleCopyLink = () => {
    if (!publicBioUrl) return
    navigator.clipboard.writeText(publicBioUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
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
            linkedin: profile.linkedin,
            website: profile.website,
          },
          publicChatEnabled: profile.publicChatEnabled,
          showPhone: profile.showPhone,
          showEmail: profile.showEmail,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.success === false) throw new Error(data.error || 'Failed to update profile')
      setStatusMsg('Settings saved.')
      setTimeout(() => setStatusMsg(''), 4000)
      // Pick up the cleaned username and the public bio link
      loadProfile()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update profile')
      setTimeout(() => setErrorMsg(''), 3500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1C3F]">Account & Profile Settings</h1>
        <p className="text-xs text-gray-500 mt-1">
          Edit your public bio page, your contact details and who can message you.
        </p>
      </div>

      {/* ── PROFILE PHOTO ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <ProfilePhotoPicker name={profile.name} avatarUrl={avatarUrl} onChange={setAvatarUrl} />
      </div>

      {/* ── ACCOUNT ID & SPOUSE LINK ── */}
      <SpouseLinkPanel />

      {/* ── PUBLIC BIO LINK (only once a username is saved) ── */}
      {publicBioPath && publicBioUrl && (
        <div className="rounded-3xl bg-gradient-to-r from-[#0F1C3F] via-[#152654] to-[#0F1C3F] p-6 text-white shadow-xl border border-[#C9A84C]/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A84C]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Your Public Bio Link
                </h2>
                <p className="text-xs text-gray-300">
                  Add this link to your social media bios so people can see your public profile and message you.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={publicBioPath}
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
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
          <span>Public Bio & Chat</span>
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
          <span>Profile & Partner</span>
        </button>
      </div>

      {/* ── TAB 1: PUBLIC BIO & CHAT ── */}
      {activeTab === 'bio' && (
        <form onSubmit={handleProfileSave} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-[#0F1C3F] flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#C9A84C]" />
                Public Bio & Chat
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                What visitors see when they open your bio link.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Username (your bio link)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono">
                  /u/
                </span>
                <input
                  type="text"
                  value={profile.username}
                  placeholder="your-name"
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Lowercase letters, numbers, - and _ only.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                WhatsApp Number
              </label>
              <input
                type="text"
                placeholder="e.g. +1 555 000 0000"
                value={profile.whatsapp}
                onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Bio
            </label>
            <textarea
              rows={2}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none resize-none"
              placeholder="A short line about you"
            />
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Social Media
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                ['instagram', 'Instagram'],
                ['tiktok', 'TikTok'],
                ['twitter', 'Twitter / X'],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-[11px] text-gray-500 mb-1">{label} handle</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">@</span>
                    <input
                      type="text"
                      placeholder="handle"
                      value={profile[key]}
                      onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Website</label>
              <input
                type="url"
                placeholder="https://"
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#C9A84C] outline-none"
              />
            </div>
          </div>

          {/* Privacy & chat permissions */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Contact & Chat Permissions
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
                  <span className="font-bold text-gray-900 block">Allow messages from your bio page</span>
                  <span className="text-gray-500">Visitors to your bio link can send you messages.</span>
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
                  <span className="font-bold text-gray-900 block">Show my email address</span>
                  <span className="text-gray-500">Show <code className="text-[#0F1C3F] font-bold">{profile.email}</code> on your bio page.</span>
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
                  <span className="font-bold text-gray-900 block">Show my phone and WhatsApp</span>
                  <span className="text-gray-500">Show call and WhatsApp buttons on your bio page.</span>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-[#0F1C3F] hover:bg-[#162c5e] text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {publicBioPath && (
              <Link
                href={publicBioPath}
                target="_blank"
                className="text-xs font-bold text-[#C9A84C] hover:underline flex items-center gap-1"
              >
                <span>View public profile</span>
                <ExternalLink size={12} />
              </Link>
            )}
          </div>
        </form>
      )}

      {/* ── TAB 2: PROFILE & SPOUSE ── */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#0F1C3F] flex items-center gap-2">
                <User className="w-4 h-4 text-[#C9A84C]" />
                Your Profile
              </h2>
            </div>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Name
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
                    Email (read-only)
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
                  Phone
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#0F1C3F] hover:bg-[#162c5e] text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#0F1C3F] flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#C9A84C]" />
                Your partners
              </h3>
              {partners.length > 0 && (
                <span className="text-[10px] font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  {partners.length} linked
                </span>
              )}
            </div>

            {partners.length > 0 ? (
              <>
                <p className="text-xs text-gray-500 mb-4">Each partner edits these details from their own account.</p>
                <div className="space-y-2">
                  {partners.map((p) => (
                    <div key={p.email} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-700">
                      <span className="font-semibold truncate">{p.name}</span>
                      <span className="truncate">{p.email}</span>
                      <span className="truncate">{p.phone || 'No phone'}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-500">No partner is linked yet. Link one under &ldquo;Your partners&rdquo; at the top of this page.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
