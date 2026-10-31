'use client'

import VerifiedTick from '@/components/VerifiedTick'
import ProfilePosts from '@/components/investor/ProfilePosts'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  MessageSquare,
  MessageCircle,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  Check,
  Share2,
  ExternalLink,
  X,
  Globe,
  UserX,
  Pencil,
  Eye,
} from 'lucide-react'

interface PublicProfile {
  userId: string
  name: string
  username: string
  avatar: string
  avatarUrl?: string | null
  accountNumber?: string
  bio: string
  identityVerified: boolean
  memberSince: string
  publicChatEnabled: boolean
  contact: { email: string | null; phone: string | null; whatsapp: string }
  socials: { instagram: string; tiktok: string; twitter: string; linkedin: string; website: string }
}

function handle(value: string) {
  return value.trim().replace(/^@/, '')
}

function websiteHref(value: string) {
  const v = value.trim()
  return /^https?:\/\//i.test(v) ? v : `https://${v}`
}

export default function UserPublicProfilePage() {
  const params = useParams()
  const slug = ((params?.slug as string) || '').toLowerCase()

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(Boolean(slug))
  const [loadError, setLoadError] = useState<'not_found' | 'failed' | null>(null)

  // Message modal state
  const [chatModalOpen, setChatModalOpen] = useState(false)
  const [senderName, setSenderName] = useState('')
  const [senderContact, setSenderContact] = useState('')
  const [messageText, setMessageText] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [msgSentSuccess, setMsgSentSuccess] = useState(false)
  // Set for visitors without an account: where to sign up to keep the conversation
  const [registerUrl, setRegisterUrl] = useState<string | null>(null)
  const [msgError, setMsgError] = useState<string | null>(null)

  const [copiedLink, setCopiedLink] = useState(false)

  // Who is looking: the owner, another signed-in member, or a visitor without an account
  const { data: session, status: sessionStatus } = useSession()
  const [previewAsVisitor, setPreviewAsVisitor] = useState(false)
  const [tab, setTab] = useState<'posts' | 'about'>('posts')
  const [postCount, setPostCount] = useState<number | null>(null)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/user/profile/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (res.status === 404) {
          setLoadError('not_found')
        } else if (res.ok && data.success && data.profile) {
          setProfile(data.profile)
        } else {
          setLoadError('failed')
        }
      })
      .catch((err) => {
        console.error(err)
        setLoadError('failed')
      })
      .finally(() => setLoading(false))
  }, [slug])

  const handleCopyLink = () => {
    const url = `${window.location.origin}/u/${slug}`
    navigator.clipboard.writeText(url).catch(() => {})
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim()) return

    setSendingMsg(true)
    setMsgError(null)
    try {
      const res = await fetch(`/api/user/profile/${encodeURIComponent(slug)}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: senderName || 'Visitor',
          senderEmail: senderContact,
          message: messageText,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to send message')
      setRegisterUrl(data.registerUrl || null)
      setMsgSentSuccess(true)
      setMessageText('')
      setSenderName('')
      setSenderContact('')
    } catch (err) {
      setMsgError(err instanceof Error ? err.message : 'Error sending message')
    } finally {
      setSendingMsg(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1C3F] flex items-center justify-center text-white p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-[#C9A84C] font-semibold">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    const notFound = loadError !== 'failed'
    return (
      <div className="min-h-screen bg-[#0F1C3F] flex items-center justify-center text-white p-6">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-center space-y-4">
          <UserX className="w-12 h-12 text-[#C9A84C] mx-auto opacity-60" />
          <h2 className="text-xl font-bold">{notFound ? 'Member not found' : 'Profile unavailable'}</h2>
          <p className="text-xs text-gray-300">
            {notFound
              ? 'There is no Union Verify member with this username.'
              : 'This profile could not be loaded. Please try again later.'}
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

  const primaryName = profile.name
  const firstName = primaryName.split(' ')[0]
  // Who is looking: the owner (unless previewing as a visitor), another signed-in member, or a visitor
  const isOwner = !!session?.user?.id && session.user.id === profile.userId
  const viewer: 'loading' | 'owner' | 'member' | 'visitor' =
    sessionStatus === 'loading' ? 'loading' : isOwner && !previewAsVisitor ? 'owner' : session?.user?.id && !isOwner ? 'member' : 'visitor'
  const email = profile.contact.email
  const phone = profile.contact.phone
  const whatsappDigits = (profile.contact.whatsapp || '').replace(/[^0-9]/g, '')
  const socials = profile.socials
  const hasSocials = Boolean(
    socials.instagram || socials.tiktok || socials.twitter || socials.linkedin || socials.website,
  )
  const hasContact = Boolean(email || phone || whatsappDigits || hasSocials)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1C3F] via-[#14234b] to-[#0A1329] text-white py-12 px-4 sm:px-6 relative overflow-hidden flex flex-col items-center justify-start">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg z-10 space-y-6">
        {/* Previewing my own profile as visitors see it */}
        {isOwner && previewAsVisitor && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-[#C9A84C]/15 border border-[#C9A84C]/40 text-xs text-[#f3e2b3]">
            <span>You&apos;re seeing your profile as visitors do.</span>
            <button type="button" onClick={() => setPreviewAsVisitor(false)} className="font-bold text-white underline flex-shrink-0 cursor-pointer">
              Back
            </button>
          </div>
        )}

        {/* Header: photo, name, numbers, bio, actions */}
        <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-[#C9A84C] via-[#e2c77d] to-[#C9A84C] p-0.5 shadow-xl flex-shrink-0">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- small photo from our own API
                <img src={profile.avatarUrl} alt={`${primaryName}'s photo`} className="w-full h-full rounded-full object-cover bg-[#0F1C3F]" />
              ) : (
                <div translate="no" className="w-full h-full rounded-full bg-[#0F1C3F] flex items-center justify-center font-bold text-2xl text-white">
                  {profile.avatar || primaryName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 translate="no" className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-1.5 min-w-0">
                <span className="truncate">{primaryName}</span>
                {profile.identityVerified && <VerifiedTick className="w-5 h-5 sm:w-6 sm:h-6" />}
              </h1>
              <p translate="no" className="text-xs text-gray-400 truncate">
                {profile.username ? `@${profile.username}` : profile.accountNumber ? `ID ${profile.accountNumber.slice(0, 4)} ${profile.accountNumber.slice(4)}` : ''}
              </p>
              <div className="flex gap-5 mt-2 text-xs">
                <span>
                  <strong className="text-white text-sm">{postCount ?? '–'}</strong> <span className="text-gray-400">{postCount === 1 ? 'post' : 'posts'}</span>
                </span>
                <span className="text-gray-400">Joined {profile.memberSince}</span>
              </div>
            </div>
          </div>

          {profile.bio && <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">{profile.bio}</p>}

          {/* Owner: edit or share; members and visitors: message or share */}
          <div className="flex gap-2">
            {viewer === 'owner' ? (
              <Link href="/settings" className="flex-1 py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-sm flex items-center justify-center gap-1.5">
                <Pencil className="w-4 h-4" /> Edit profile
              </Link>
            ) : viewer === 'member' && profile.publicChatEnabled ? (
              <Link
                href={`/chat?recipientId=${encodeURIComponent(profile.userId)}&name=${encodeURIComponent(primaryName)}`}
                className="flex-1 py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-sm flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" /> Message
              </Link>
            ) : viewer === 'visitor' && profile.publicChatEnabled ? (
              <button
                type="button"
                onClick={() => {
                  setChatModalOpen(true)
                  setMsgSentSuccess(false)
                  setMsgError(null)
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" /> Message
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              {copiedLink ? 'Copied' : 'Share'}
            </button>
            {viewer === 'owner' && (
              <button
                type="button"
                onClick={() => setPreviewAsVisitor(true)}
                className="px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white cursor-pointer"
                aria-label="See it as a visitor"
                title="See it as a visitor"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
          </div>
          {viewer === 'visitor' && profile.publicChatEnabled && !previewAsVisitor && (
            <p className="text-[11px] text-gray-400">
              Have an account?{' '}
              <Link href={`/login?callbackUrl=${encodeURIComponent(`/u/${profile.username || profile.accountNumber}`)}`} className="font-bold text-[#C9A84C] hover:underline">
                Sign in
              </Link>{' '}
              to chat in the app.
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['posts', 'about'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-bold border-b-2 -mb-px cursor-pointer ${tab === t ? 'border-[#C9A84C] text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
              {t === 'posts' ? 'Posts' : 'About'}
            </button>
          ))}
        </div>

        {/* Posts stay loaded when switching tabs */}
        <div className={tab === 'posts' ? '' : 'hidden'}>
          <ProfilePosts userId={profile.userId} slug={slug} ownerView={viewer === 'owner'} onCount={setPostCount} />
          {postCount === 0 && viewer !== 'owner' && <p className="py-10 text-center text-sm text-gray-400">No posts yet.</p>}
        </div>

        {tab === 'about' && (
          <div className="space-y-3">
            <div className="rounded-3xl bg-white/5 border border-white/10 p-5 space-y-2 text-sm">
              {profile.bio ? <p className="text-gray-200 whitespace-pre-line">{profile.bio}</p> : <p className="text-gray-400">No bio yet.</p>}
              <p className="text-xs text-gray-400">Joined {profile.memberSince}</p>
              {profile.identityVerified && <p className="text-xs text-gray-300 flex items-center gap-1.5"><VerifiedTick className="w-4 h-4" /> Identity verified</p>}
            </div>
        {/* Contact & socials (only what the member chose to share) */}
            {hasContact && (
          <div className="rounded-3xl bg-white/5 border border-white/10 p-5 space-y-3">

            {(email || phone || whatsappDigits) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center flex-shrink-0">
                        <Mail size={16} />
                      </div>
                      <div className="min-w-0 text-left">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Email</span>
                        <span className="text-xs font-semibold text-white truncate block">{email}</span>
                      </div>
                    </div>
                    <ExternalLink size={13} className="text-gray-500 group-hover:text-white transition-colors" />
                  </a>
                )}

                {phone && (
                  <a
                    href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-500/20 text-slate-200 flex items-center justify-center flex-shrink-0">
                        <Phone size={16} />
                      </div>
                      <div className="min-w-0 text-left">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Phone</span>
                        <span className="text-xs font-semibold text-white truncate block">{phone}</span>
                      </div>
                    </div>
                    <ExternalLink size={13} className="text-gray-500 group-hover:text-white transition-colors" />
                  </a>
                )}

                {whatsappDigits && (
                  <a
                    href={`https://wa.me/${whatsappDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0">
                        <MessageCircle size={16} />
                      </div>
                      <div className="min-w-0 text-left">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">WhatsApp</span>
                        <span className="text-xs font-semibold text-white truncate block">{profile.contact.whatsapp}</span>
                      </div>
                    </div>
                    <ExternalLink size={13} className="text-gray-500 group-hover:text-white transition-colors" />
                  </a>
                )}
              </div>
            )}

            {hasSocials && (
              <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
                {socials.instagram && (
                  <a
                    href={`https://instagram.com/${handle(socials.instagram)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-200 hover:text-white transition-all"
                  >
                    Instagram @{handle(socials.instagram)}
                  </a>
                )}
                {socials.tiktok && (
                  <a
                    href={`https://tiktok.com/@${handle(socials.tiktok)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-200 hover:text-white transition-all"
                  >
                    TikTok @{handle(socials.tiktok)}
                  </a>
                )}
                {socials.twitter && (
                  <a
                    href={`https://x.com/${handle(socials.twitter)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-200 hover:text-white transition-all"
                  >
                    X @{handle(socials.twitter)}
                  </a>
                )}
                {socials.linkedin && (
                  <a
                    href={websiteHref(
                      socials.linkedin.includes('linkedin.com')
                        ? socials.linkedin
                        : `linkedin.com/in/${handle(socials.linkedin)}`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-200 hover:text-white transition-all"
                  >
                    LinkedIn
                  </a>
                )}
                {socials.website && (
                  <a
                    href={websiteHref(socials.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Globe size={12} />
                    Website
                  </a>
                )}
              </div>
            )}
          </div>
        )}
          </div>
        )}

        <div className="text-center pt-4">
          <p className="text-[10px] text-gray-500">
            © {new Date().getFullYear()} Union Verify. All rights reserved.
          </p>
        </div>
      </div>

      {/* Message modal */}
      {chatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0F1C3F] border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center text-[#C9A84C]">
                  <MessageSquare size={16} />
                </div>
                <h3 className="text-sm font-bold text-white">Message {primaryName}</h3>
              </div>
              <button
                onClick={() => setChatModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {msgSentSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Message sent</h4>
                <p className="text-xs text-gray-300 max-w-xs mx-auto">
                  Your message has been sent to {primaryName}.
                  {registerUrl && ' Replies will be emailed to you.'}
                </p>
                {registerUrl && (
                  <div className="max-w-xs mx-auto rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-gray-300 space-y-2">
                    <p>Create a free account with the same email to keep track of the whole conversation and reply in the app.</p>
                    <Link
                      href={registerUrl}
                      className="inline-block px-4 py-2 rounded-xl bg-[#C9A84C] text-[#0F1C3F] font-bold"
                    >
                      Create account
                    </Link>
                  </div>
                )}
                <button
                  onClick={() => setChatModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-3.5">
                {msgError && (
                  <p role="alert" className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                    {msgError}
                  </p>
                )}
                <div>
                  <label htmlFor="msg-name" className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Your Name
                  </label>
                  <input
                    id="msg-name"
                    type="text"
                    required
                    placeholder="Your full name"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A84C]"
                  />
                </div>

                <div>
                  <label htmlFor="msg-contact" className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Your Email
                  </label>
                  <input
                    id="msg-contact"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={senderContact}
                    onChange={(e) => setSenderContact(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A84C]"
                  />
                </div>

                <div>
                  <label htmlFor="msg-text" className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Message
                  </label>
                  <textarea
                    id="msg-text"
                    rows={4}
                    required
                    placeholder={`Write a message to ${firstName}...`}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A84C] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingMsg}
                  className="w-full py-3 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
