'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, MessageSquare, PiggyBank } from 'lucide-react'
import { formatAccountNumber } from '@/lib/utils'
import FindMember from '@/components/investor/FindMember'
import MyAccountId from '@/components/investor/MyAccountId'
import UserAvatar from '@/components/investor/UserAvatar'
import SpouseRequestBanner, { type SpouseRequest } from '@/components/investor/SpouseRequestBanner'

export type PartnerItem = {
  id: string
  name: string
  accountNumber: string | null
  avatarUrl: string | null
  relation: string
  relationLabel: string
}

type Status = {
  partners: PartnerItem[]
  requests: SpouseRequest[]
  outgoing: { toUserId: string; toName: string }[]
}

/** Your account ID and your partners: each has a joint vault with you; requests either way; link another */
export default function SpouseLinkPanel() {
  const [status, setStatus] = useState<Status | null>(null)

  const load = useCallback(() => {
    fetch('/api/spouse')
      .then((res) => res.json())
      .then((data) => data.success && setStatus({ partners: data.partners || [], requests: data.requests || [], outgoing: data.outgoing || [] }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div id="spouse" className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-[#0F1C3F] flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-600" />
          Your partners
        </h2>
        <MyAccountId />
      </div>

      {!status ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : (
        <>
          {status.partners.length > 0 ? (
            <ul className="space-y-2">
              {status.partners.map((p) => (
                <li key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/60">
                  <UserAvatar name={p.name} src={p.avatarUrl} className="w-10 h-10 text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#0F1C3F] truncate">{p.name}</p>
                    <p className="text-[11px] text-gray-500">
                      {p.relationLabel}
                      {p.accountNumber && <span className="font-mono"> · ID {formatAccountNumber(p.accountNumber)}</span>}
                    </p>
                  </div>
                  <Link
                    href={`/save?partner=${encodeURIComponent(p.id)}`}
                    className="p-2 rounded-lg border border-gray-200 bg-white text-[#0F1C3F] hover:border-[#C9A84C]"
                    aria-label={`Joint vault with ${p.name}`}
                    title="Joint vault"
                  >
                    <PiggyBank className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/chat?recipientId=${encodeURIComponent(p.id)}&name=${encodeURIComponent(p.name)}`}
                    className="p-2 rounded-lg border border-gray-200 bg-white text-[#0F1C3F] hover:border-[#C9A84C]"
                    aria-label={`Chat with ${p.name}`}
                    title="Chat"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500">No partners linked yet.</p>
          )}

          <SpouseRequestBanner requests={status.requests} onDone={load} />
          {status.outgoing.map((o) => (
            <p key={o.toUserId} className="text-xs text-gray-600 p-3 rounded-xl bg-rose-50/60 border border-rose-100">
              Waiting for <strong>{o.toName}</strong> to accept your request. They accept it on their dashboard or in your chat.
            </p>
          ))}
          <div className="space-y-1.5 pt-1">
            <p className="text-xs text-gray-600">
              {status.partners.length ? 'Link another partner: a spouse, a friend, family…' : 'Link a partner: a spouse, a friend, family…'} Find them by
              their account ID (they see it here in their Settings) or email, then tap <strong>Link</strong>. Each partner has a separate joint vault with you.
            </p>
            <FindMember onChange={load} />
          </div>
        </>
      )}
    </div>
  )
}
