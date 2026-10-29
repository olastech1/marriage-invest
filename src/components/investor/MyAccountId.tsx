'use client'

import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { formatAccountNumber } from '@/lib/utils'

/** "Your account ID: 4821 3907 [Copy]" (loads it when not passed in) */
export default function MyAccountId({ accountId: initial }: { accountId?: string | null }) {
  const [accountId, setAccountId] = useState(initial || '')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (initial) return
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => setAccountId(data.user?.accountNumber || ''))
      .catch(() => {})
  }, [initial])

  if (!accountId) return null

  const copy = () => {
    navigator.clipboard.writeText(accountId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
      <span className="text-gray-500">Your account ID:</span>
      <strong className="font-mono text-[#0F1C3F] tracking-wide">{formatAccountNumber(accountId)}</strong>
      <button type="button" onClick={copy} className="text-gray-500 hover:text-[#0F1C3F] cursor-pointer" aria-label="Copy account ID">
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}
