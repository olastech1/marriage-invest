'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageSquare, Search, UserPlus, Check } from 'lucide-react'
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

/**
 * Find one member by account ID (or email), then chat, add them or link as spouses.
 * An email that isn't a member gets an invitation to join.
 */
export default function FindMember({
  hasSpouse,
  onChat,
  onChange,
}: {
  hasSpouse: boolean
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

  const post = async (url: string, body: Record<string, string>) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return res.json()
  }

  const find = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy('find')
    setMember(null)
    setNote(null)
    try {
      const data = await post('/api/chat/start', { query })
      if (!data.success) setNote({ ok: false, text: data.error || 'Something went wrong.' })
      else if (data.contact) setMember(data.contact)
      else
        setNote({
          ok: true,
          text: data.emailed
            ? `${query} isn't a member yet, so we emailed them an invitation to join.`
            : `${query} isn't a member yet. Send them this link to join: ${data.inviteUrl}`,
        })
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

  const linkSpouse = async () => {
    if (!member) return
    if (!window.confirm(`Ask ${member.name} (ID ${formatAccountNumber(member.accountNumber)}) to link your accounts as partners? You'll share a joint vault and approve each other's joint withdrawals.`)) return
    setBusy('spouse')
    try {
      const data = await post('/api/spouse', { action: 'request', userId: member.id })
      setNote({
        ok: !!data.success,
        text: !data.success
          ? data.error || 'Something went wrong.'
          : data.linked
            ? `You are now linked with ${member.name} as partners.`
            : `Partner request sent to ${member.name}. They accept it on their dashboard or in your chat.`,
      })
      if (data.linked) setMember({ ...member, isSpouse: true })
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
          <div className={`grid gap-2 ${hasSpouse || member.isSpouse ? 'grid-cols-2' : 'grid-cols-3'}`}>
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
            {!hasSpouse && !member.isSpouse && (
              <button
                type="button"
                onClick={linkSpouse}
                disabled={!!busy}
                className="py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
              >
                <Heart className="w-3.5 h-3.5" /> Link as partner
              </button>
            )}
          </div>
          {member.isSpouse && <p className="text-[11px] font-semibold text-emerald-700">This is your partner.</p>}
        </div>
      )}

      {note && <p className={`text-xs ${note.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{note.text}</p>}
    </div>
  )
}
