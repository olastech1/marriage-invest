'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Check, LogOut, Plus, Settings, X } from 'lucide-react'
import UserAvatar from '@/components/investor/UserAvatar'
import { formatAccountNumber } from '@/lib/utils'

export type DeviceAccount = { id: string; name: string; email: string; avatarUrl: string | null; accountNumber: string | null }

async function post(body: Record<string, string>) {
  const res = await fetch('/api/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return res.json()
}

/** Switch to another account kept on this device (full reload, so every page shows that account) */
export async function switchAccount(userId: string, next = '/dashboard'): Promise<string | null> {
  const data = await post({ action: 'switch', userId })
  if (!data.success) return data.error || 'Could not switch accounts.'
  // Only pages on this site (the sign-in page passes its ?callbackUrl here)
  window.location.href = next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/dashboard'
  return null
}

/** The photo in the top bar: who's signed in, other accounts on this device, add / sign out */
export default function AccountMenu({
  user,
}: {
  user: { name?: string | null; email?: string | null; avatarUrl?: string | null; accountNumber?: string | null }
}) {
  const [open, setOpen] = useState(false)
  const [accounts, setAccounts] = useState<DeviceAccount[]>([])
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    fetch('/api/accounts')
      .then((res) => res.json())
      .then((data) => setAccounts(data.accounts || []))
      .catch(() => {})
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const choose = async (id: string) => {
    setBusy(id)
    setError('')
    const problem = await switchAccount(id)
    if (problem) {
      setError(problem)
      setAccounts((list) => list.filter((a) => a.id !== id))
      setBusy('')
    }
  }

  const addAccount = async () => {
    setBusy('add')
    setError('')
    const data = await post({ action: 'add' }).catch(() => null)
    if (data?.success) window.location.href = data.next
    else {
      setError(data?.error || 'Something went wrong.')
      setBusy('')
    }
  }

  const forget = async (id: string) => {
    await post({ action: 'remove', userId: id }).catch(() => null)
    setAccounts((list) => list.filter((a) => a.id !== id))
  }

  const signOutAll = async () => {
    await post({ action: 'signout-all' }).catch(() => null)
    signOut({ callbackUrl: '/login' })
  }

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex rounded-full cursor-pointer" aria-label="Account menu" aria-expanded={open}>
        <UserAvatar name={user.name} src={user.avatarUrl} className="h-8 w-8 text-xs" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
          <div className="p-4 flex items-center gap-3 border-b border-gray-100">
            <UserAvatar name={user.name} src={user.avatarUrl} className="h-11 w-11 text-sm" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#0F1C3F] truncate">{user.name || 'Member'}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              {user.accountNumber && <p className="text-[11px] font-mono text-gray-400">ID {formatAccountNumber(user.accountNumber)}</p>}
            </div>
            <Check className="w-4 h-4 text-emerald-600 ml-auto flex-shrink-0" aria-label="Signed in" />
          </div>

          {accounts.length > 0 && (
            <div className="py-1 border-b border-gray-100">
              <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Switch account</p>
              {accounts.map((a) => (
                <div key={a.id} className="flex items-center gap-2 px-2">
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => choose(a.id)}
                    className="flex-1 min-w-0 flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 text-left cursor-pointer disabled:opacity-60"
                  >
                    <UserAvatar name={a.name} src={a.avatarUrl} className="h-9 w-9 text-xs" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[#0F1C3F] truncate">{busy === a.id ? 'Switching…' : a.name}</span>
                      <span className="block text-[11px] text-gray-500 truncate">{a.email}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => forget(a.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                    aria-label={`Remove ${a.name} from this device`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="py-1">
            <button
              type="button"
              disabled={!!busy}
              onClick={addAccount}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-60"
            >
              <Plus className="w-4 h-4 text-gray-500" /> {busy === 'add' ? 'Please wait…' : 'Add another account'}
            </button>
            <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
              <Settings className="w-4 h-4 text-gray-500" /> Settings
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-gray-500" /> Sign out{accounts.length > 0 ? ` of ${user.name?.split(' ')[0] || 'this account'}` : ''}
            </button>
            {accounts.length > 0 && (
              <button
                type="button"
                onClick={signOutAll}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-700 hover:bg-rose-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign out of all accounts
              </button>
            )}
          </div>
          {error && <p className="px-4 pb-3 text-xs font-semibold text-rose-700">{error}</p>}
        </div>
      )}
    </div>
  )
}
