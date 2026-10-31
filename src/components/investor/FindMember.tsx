'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Search, UserPlus, Check, Mail } from 'lucide-react'
import LinkPartnerButton from '@/components/investor/LinkPartnerButton'
import { formatAccountNumber } from '@/lib/utils'
import UserAvatar from '@/components/investor/UserAvatar'

export type FoundMember = {
  id: string
  name: string
  username: string | null
  accountNumber: string | null
  avatarUrl?: string | null
  isSpouse: boolean
  added: boolean
}

const whatsappUrl = (note: string, link: string) =>
  `https://wa.me/?text=${encodeURIComponent(`${note.trim() || 'Join me on Union Verify, where we can invest and save together.'}\n\n${link}`)}`

/** WhatsApp's mark, for the share buttons */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  )
}

/**
 * Find one member by account ID (or email), then chat, add them or link as spouses.
 * An email that isn't a member can be invited by email (with my own note) or on WhatsApp.
 */
export default function FindMember({
  onChat,
  onChange,
}: {
  /** Open the chat in place (the chat page); otherwise go to /chat */
  onChat?: (member: FoundMember) => void
  /** Something changed (added, spouse request sent): refresh lists */
  onChange?: () => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState('')
  const [member, setMember] = useState<FoundMember | null>(null)
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)
  // Someone who isn't a member yet: invite them
  const [invite, setInvite] = useState<{ email: string; url: string } | null>(null)
  const [message, setMessage] = useState('')
  const [myLink, setMyLink] = useState('')

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((d) => d.user?.accountNumber && setMyLink(`${window.location.origin}/register?invite=${d.user.accountNumber}`))
      .catch(() => {})
  }, [])

  const post = async (url: string, body: Record<string, string>) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return res.json()
  }

  const find = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy('find')
    setMember(null)
    setNote(null)
    setInvite(null)
    try {
      const data = await post('/api/chat/start', { query })
      if (!data.success) setNote({ ok: false, text: data.error || 'Something went wrong.' })
      else if (data.contact) setMember(data.contact)
      else if (data.invite) setInvite({ email: data.email, url: data.inviteUrl })
    } catch {
      setNote({ ok: false, text: 'Something went wrong.' })
    } finally {
      setBusy('')
    }
  }

  const sendInvite = async () => {
    if (!invite) return
    setBusy('invite')
    try {
      const data = await post('/api/chat/start', { query: invite.email, send: '1', note: message })
      setNote({
        ok: !!data.success,
        text: data.success
          ? data.emailed
            ? `Invitation emailed to ${invite.email}. They'll appear in your chats when they join.`
            : `We couldn't email ${invite.email} right now. Share your link on WhatsApp instead.`
          : data.error || 'Something went wrong.',
      })
      if (data.success && data.emailed) {
        setInvite(null)
        setMessage('')
      }
    } catch {
      setNote({ ok: false, text: 'Something went wrong.' })
    } finally {
      setBusy('')
    }
  }

  const add = async () => {
    if (!member) return
    setBusy('add')
    try {
      const data = await post('/api/contacts', { userId: member.id })
      if (data.success) setMember({ ...member, added: true })
      setNote({ ok: !!data.success, text: data.message || data.error || 'Something went wrong.' })
      onChange?.()
    } catch {
      setNote({ ok: false, text: 'Something went wrong.' })
    } finally {
      setBusy('')
    }
  }

  const chat = () => {
    if (!member) return
    if (onChat) onChat(member)
    else router.push(`/chat?recipientId=${encodeURIComponent(member.id)}&name=${encodeURIComponent(member.name)}`)
  }

  return (
    <div className="space-y-3">
      <form onSubmit={find} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Account ID (8 digits) or email"
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C]"
          />
        </div>
        <button
          type="submit"
          disabled={!!busy}
          className="px-4 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2f64] text-white font-bold text-sm disabled:opacity-50 cursor-pointer"
        >
          {busy === 'find' ? '…' : 'Find'}
        </button>
      </form>

      {member && (
        <div className="p-3 rounded-2xl border border-gray-200 bg-white space-y-3">
          <div className="flex items-center gap-3">
            <UserAvatar name={member.name} src={member.avatarUrl} className="w-10 h-10 text-xs" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#0F1C3F] truncate">{member.name}</p>
              <p className="text-xs text-gray-500 font-mono">ID: {formatAccountNumber(member.accountNumber)}</p>
            </div>
          </div>
          <div className={`grid gap-2 ${member.isSpouse ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <button
              type="button"
              onClick={chat}
              className="py-2 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2f64] text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Chat
            </button>
            <button
              type="button"
              onClick={add}
              disabled={!!busy || member.added}
              className="py-2 rounded-xl border border-gray-300 bg-white text-[#0F1C3F] font-bold text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
            >
              {member.added ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <UserPlus className="w-3.5 h-3.5" />}
              {member.added ? 'Added' : 'Add'}
            </button>
            {!member.isSpouse && (
              <LinkPartnerButton
                userId={member.id}
                name={member.name}
                className="w-full h-full py-2 text-xs"
                label="Link"
                onDone={(r) => {
                  setNote({ ok: r.ok, text: r.text })
                  if (r.linked) setMember({ ...member, isSpouse: true })
                  onChange?.()
                }}
              />
            )}
          </div>
          {member.isSpouse && <p className="text-[11px] font-semibold text-emerald-700">You are already linked with {member.name}.</p>}
        </div>
      )}

      {invite && (
        <div className="p-3 rounded-2xl border border-gray-200 bg-white space-y-2.5">
          <p className="text-xs text-gray-600">
            <strong className="text-[#0F1C3F]">{invite.email}</strong> isn&apos;t a member yet. Invite them:
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Your message (optional), e.g. Hi Loya, come join me on Union Verify so we can save together."
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-sm focus:outline-none focus:border-[#C9A84C] resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={sendInvite}
              disabled={!!busy}
              className="py-2 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2f64] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Mail className="w-3.5 h-3.5" /> {busy === 'invite' ? 'Sending…' : 'Send email'}
            </button>
            <a
              href={whatsappUrl(message, invite.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 rounded-xl bg-[#25D366] hover:bg-[#1fb855] text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp
            </a>
          </div>
        </div>
      )}

      {note && <p className={`text-xs ${note.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{note.text}</p>}

      {myLink && !invite && (
        <a
          href={whatsappUrl('', myLink)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#128C7E] hover:underline"
        >
          <WhatsAppIcon className="w-3.5 h-3.5" /> Invite someone on WhatsApp
        </a>
      )}
    </div>
  )
}
