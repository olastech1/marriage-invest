'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Lock,
  Sparkles,
  ArrowRight,
  Shield,
  KeyRound,
  Users,
  Award,
  ExternalLink,
  Music,
} from 'lucide-react'
import { CELEBRITY_ARTISTS } from '@/types/fanbase'

export default function FanbaseGatewayPage() {
  const router = useRouter()
  const [accessCode, setAccessCode] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const code = accessCode.trim().toUpperCase()
    const matchedArtist = CELEBRITY_ARTISTS.find(
      (a) => a.accessCode === code || a.slug.toLowerCase() === accessCode.trim().toLowerCase()
    )

    if (matchedArtist) {
      router.push(`/fanbase/${matchedArtist.slug}`)
    } else {
      setErrorMsg('Invalid or expired private access link. Please verify your invitation code.')
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-center">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#C9A84C]/15 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto w-full relative z-10 text-center space-y-8">
        {/* Private Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#C9A84C] text-xs font-bold uppercase tracking-wider backdrop-blur-md">
          <Lock className="w-3.5 h-3.5 text-[#C9A84C]" />
          Private Unlisted Fiduciary Gateway · Accessible Only Via Link
        </div>

        {/* Main Headline */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-white leading-tight">
            Celebrity Fanbase & <br />
            <span className="text-[#C9A84C]">Artist Royalty Syndicates</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-lg mx-auto leading-relaxed">
            Celebrity fanbase rounds and tour equity syndicates are strictly private and unlisted. They are not displayed on the public investment board and can only be accessed through an official direct link or private access code.
          </p>
        </div>

        {/* Code Input Form */}
        <form
          onSubmit={handleUnlock}
          className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl max-w-md mx-auto space-y-4 shadow-2xl"
        >
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#C9A84C]" />
              Enter Artist Access Link / Code
            </label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="e.g. TIMELESS2026 or davido-timeless-tour"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent placeholder:text-gray-500 font-mono"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 font-medium text-left leading-snug">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-sm tracking-wide transition-all shadow-md shadow-[#C9A84C]/20 flex items-center justify-center gap-2"
          >
            <span>Unlock Private Syndicate</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Available Private Artist Links for Testing */}
        <div className="pt-6 border-t border-white/10 max-w-lg mx-auto space-y-3">
          <span className="text-xs uppercase tracking-wider font-bold text-gray-400 block">
            Verified Private Artist Links (Click to preview via direct link):
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {CELEBRITY_ARTISTS.map((artist) => (
              <Link
                key={artist.id}
                href={`/fanbase/${artist.slug}`}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#C9A84C] hover:bg-white/10 transition-all group flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/15 text-[#C9A84C] flex items-center justify-center font-bold text-base flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Music className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-white group-hover:text-[#C9A84C] transition-colors block truncate">
                    {artist.stageName}
                  </span>
                  <span className="text-[11px] text-gray-400 truncate block">
                    {artist.offering.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Fiduciary Guarantee */}
        <div className="text-xs text-gray-500 max-w-md mx-auto flex items-center justify-center gap-2">
          <Shield className="w-4 h-4 text-[#C9A84C]" />
          <span>Zurich Escrow Protected · Bankruptcy-Remote Master Rights</span>
        </div>
      </div>
    </div>
  )
}
