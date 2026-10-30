'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart } from 'lucide-react'

export type SpouseRequest = { messageId: string; fromUserId: string; fromName: string }

/** "X wants to link as spouses" with Accept / Decline, wherever the member lands */
export default function SpouseRequestBanner({
  requests,
  onDone,
  stacked = false,
  onOpenChat,
}: {
  requests: SpouseRequest[]
  onDone?: () => void
  /** Keep the buttons under the text (narrow places like the chat list) */
  stacked?: boolean
  /** Open the requester's chat in place (on the chat page) */
  onOpenChat?: (request: SpouseRequest) => void
}) {
  const router = useRouter()
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  if (requests.length === 0) return null

  const answer = async (request: SpouseRequest, action: 'accept' | 'decline') => {
    if (action === 'decline' && !window.confirm(`Decline ${request.fromName}'s request to link as partners?`)) return
    setBusy(request.messageId)
    setError('')
    try {
      const res = await fetch('/api/spouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, messageId: request.messageId }),
      })
      const data = await res.json()
      if (!data.success) setError(data.error || 'Something went wrong.')
      if (onDone) onDone()
      else router.refresh()
    } catch {
      setError('Something went wrong.')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="space-y-2">
      {requests.map((request) => (
        <div
          key={request.messageId}
          className={`rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 flex flex-col justify-between gap-3 shadow-sm ${stacked ? '' : 'sm:flex-row sm:items-center'}`}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4" />
            </div>
            <div className="text-sm">
              <p className="font-bold text-rose-950">{request.fromName} wants to link your accounts as partners</p>
              <p className="text-xs text-rose-900/80">
                You&apos;ll share a joint vault, reciprocate each other&apos;s deposits and approve each other&apos;s joint withdrawals.{' '}
                {onOpenChat ? (
                  <button type="button" onClick={() => onOpenChat(request)} className="font-semibold underline cursor-pointer">
                    Open chat
                  </button>
                ) : (
                  <Link
                    href={`/chat?recipientId=${encodeURIComponent(request.fromUserId)}&name=${encodeURIComponent(request.fromName)}`}
                    className="font-semibold underline"
                  >
                    Open chat
                  </Link>
                )}
              </p>
            </div>
          </div>
          <div className={`grid grid-cols-2 gap-2 flex-shrink-0 ${stacked ? '' : 'sm:flex'}`}>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => answer(request, 'accept')}
              className="px-4 py-2.5 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2f64] text-white font-bold text-xs cursor-pointer disabled:opacity-60"
            >
              {busy === request.messageId ? 'Please wait…' : 'Accept'}
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => answer(request, 'decline')}
              className="px-4 py-2.5 rounded-xl border border-rose-300 bg-white text-rose-800 font-bold text-xs cursor-pointer disabled:opacity-60"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
      {error && <p className="text-xs font-semibold text-rose-700">{error}</p>}
    </div>
  )
}
