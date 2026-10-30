'use client'

import { useEffect, useState } from 'react'
import UserAvatar from '@/components/investor/UserAvatar'
import { switchAccount, type DeviceAccount } from '@/components/investor/AccountMenu'

/** On the sign-in page: accounts still signed in on this device, one tap to continue */
export default function DeviceAccounts({ next }: { next: string }) {
  const [accounts, setAccounts] = useState<DeviceAccount[]>([])
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/accounts')
      .then((res) => res.json())
      .then((data) => setAccounts(data.accounts || []))
      .catch(() => {})
  }, [])

  if (accounts.length === 0) return null

  const choose = async (id: string) => {
    setBusy(id)
    setError('')
    const problem = await switchAccount(id, next)
    if (problem) {
      setError(problem)
      setAccounts((list) => list.filter((a) => a.id !== id))
      setBusy('')
    }
  }

  return (
    <div className="mb-6 space-y-2">
      <p className="text-xs font-semibold text-slate-500">Continue as</p>
      {accounts.map((a) => (
        <button
          key={a.id}
          type="button"
          disabled={!!busy}
          onClick={() => choose(a.id)}
          className="w-full flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left hover:border-[#0F1C3F] transition-colors cursor-pointer disabled:opacity-60"
        >
          <UserAvatar name={a.name} src={a.avatarUrl} className="h-9 w-9 text-xs" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-[#0F1C3F] truncate">{busy === a.id ? 'Opening…' : a.name}</span>
            <span className="block text-xs text-slate-500 truncate">{a.email}</span>
          </span>
        </button>
      ))}
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      <p className="pt-2 text-xs text-slate-400 text-center">or sign in to another account</p>
    </div>
  )
}
