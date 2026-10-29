'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { formatAccountNumber } from '@/lib/utils'
import FindMember from '@/components/investor/FindMember'
import MyAccountId from '@/components/investor/MyAccountId'
import SpouseRequestBanner, { type SpouseRequest } from '@/components/investor/SpouseRequestBanner'

type Status = {
  spouse: { id: string; name: string; accountNumber: string | null } | null
  requests: SpouseRequest[]
  outgoing: { toUserId: string; toName: string }[]
}

/** Your account ID, and linking your spouse: who you're linked with, requests either way, and find by ID */
export default function SpouseLinkPanel() {
  const [status, setStatus] = useState<Status | null>(null)

  const load = useCallback(() => {
    fetch('/api/spouse')
      .then((res) => res.json())
      .then((data) => data.success && setStatus({ spouse: data.spouse, requests: data.requests || [], outgoing: data.outgoing || [] }))
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
          Your spouse
        </h2>
        <MyAccountId />
      </div>

      {!status ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : status.spouse ? (
        <p className="text-sm text-gray-700">
          You are linked with <strong>{status.spouse.name}</strong>
          {status.spouse.accountNumber && (
            <span className="font-mono text-gray-500"> (ID: {formatAccountNumber(status.spouse.accountNumber)})</span>
          )}
          .{' '}
          <Link
            href={`/chat?recipientId=${encodeURIComponent(status.spouse.id)}&name=${encodeURIComponent(status.spouse.name)}`}
            className="font-semibold text-[#0F1C3F] underline"
          >
            Open chat
          </Link>
        </p>
      ) : (
        <>
          <SpouseRequestBanner requests={status.requests} onDone={load} />
          {status.outgoing.map((o) => (
            <p key={o.toUserId} className="text-xs text-gray-600 p-3 rounded-xl bg-rose-50/60 border border-rose-100">
              Waiting for <strong>{o.toName}</strong> to accept your spouse request. They accept it on their dashboard or in your chat.
            </p>
          ))}
          <div className="space-y-1.5">
            <p className="text-xs text-gray-600">
              Find your spouse by their account ID (they see it here in their Settings) or email, then tap <strong>Link as spouse</strong>.
            </p>
            <FindMember hasSpouse={false} onChange={load} />
          </div>
        </>
      )}
    </div>
  )
}
