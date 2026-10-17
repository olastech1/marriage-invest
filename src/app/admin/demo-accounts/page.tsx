'use client'

import { useState, useEffect } from 'react'
import {
  Sparkles,
  User,
  Heart,
  Key,
  Mail,
  DollarSign,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  Trash2,
  RefreshCw,
  PlusCircle,
  FileText,
  AlertCircle,
} from 'lucide-react'

interface DemoUser {
  id: string
  name: string
  email: string
  plainPassword?: string
  partnerName: string
  partnerEmail: string
  marriageType: string
  initialDeposit: number
  inviteLink: string
  note: string
  createdAt: string
  exists: boolean
}

const PRESETS = [
  {
    name: 'Jane Doe',
    email: 'jane.doe@unioninvest.com',
    password: 'DemoPass2025!',
    partnerName: 'Marcus Vance',
    partnerEmail: 'marcus.vance@unioninvest.com',
    marriageType: 'Civil Marriage / Registered Union',
    initialDeposit: 50000,
    note: 'Executive demonstration for Joint Spousal Reserve',
  },
  {
    name: 'Alexander Roth',
    email: 'alexander.roth@unioninvest.ch',
    password: 'AlpineVault#99',
    partnerName: 'Elena Roth',
    partnerEmail: 'elena.roth@unioninvest.ch',
    marriageType: 'Civil Union / Registered Partnership',
    initialDeposit: 120000,
    note: 'High-net-worth partnership portfolio showcase',
  },
  {
    name: 'Noah Sterling',
    email: 'noah.sterling@unioninvest.ch',
    password: 'SterlingUnion!1',
    partnerName: 'Liam Chen',
    partnerEmail: 'liam.chen@unioninvest.ch',
    marriageType: 'Same-Sex Marriage (Gay/Lesbian)',
    initialDeposit: 30000,
    note: 'Early-stage couple marriage savings portfolio',
  },
]

export default function AdminDemoAccountsPage() {
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Form State
  const [name, setName] = useState('Jane Doe')
  const [email, setEmail] = useState('jane.doe@unioninvest.com')
  const [password, setPassword] = useState('DemoPass2025!')
  const [partnerName, setPartnerName] = useState('Marcus Vance')
  const [partnerEmail, setPartnerEmail] = useState('marcus.vance@unioninvest.com')
  const [marriageType, setMarriageType] = useState('Civil Marriage / Registered Union')
  const [initialDeposit, setInitialDeposit] = useState<number>(50000)
  const [note, setNote] = useState('Executive demo account for prospective couples')

  useEffect(() => {
    fetchDemoUsers()
  }, [])

  async function fetchDemoUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/demo-users')
      if (res.ok) {
        const data = await res.json()
        setDemoUsers(data.demoUsers || [])
      }
    } catch (err) {
      console.error('Error fetching demo users:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleApplyPreset(preset: typeof PRESETS[0]) {
    setName(preset.name)
    setEmail(preset.email)
    setPassword(preset.password)
    setPartnerName(preset.partnerName)
    setPartnerEmail(preset.partnerEmail)
    setMarriageType(preset.marriageType)
    setInitialDeposit(preset.initialDeposit)
    setNote(preset.note)
  }

  function handleGeneratePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
    let gen = ''
    for (let i = 0; i < 12; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(gen)
  }

  async function handleCreateDemoUser(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/admin/demo-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          partnerName,
          partnerEmail,
          marriageType,
          initialDeposit,
          note,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create demo account')
      }

      setSuccessMsg(`Demo account for ${name} (${email}) created successfully!`)
      fetchDemoUsers()
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteDemoUser(id: string) {
    if (!confirm('Are you sure you want to remove this demo account?')) return
    try {
      const res = await fetch(`/api/admin/demo-users?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDemoUsers((prev) => prev.filter((u) => u.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete demo user', err)
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2500)
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F1C3F] to-[#1e3a8a] flex items-center justify-center text-[#C9A84C] shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Demo Accounts Studio</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Generate and manage pre-funded investor credentials & spouse invitation links.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDemoUsers}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-semibold">Confidential Admin Panel Only:</span> Demo credentials and instant login
          buttons are strictly restricted to this Admin Panel. No demo buttons or demo credentials appear on the public
          login page (<code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-mono">/login</code>) or
          public homepage. You can provide these credentials directly to clients or prospective partners.
        </div>
      </div>

      {/* Preset Buttons */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
          Quick Preset Blueprints
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="text-left p-3.5 rounded-xl border border-gray-200 hover:border-[#C9A84C] hover:bg-amber-50/30 bg-white transition-all shadow-xs group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#0F1C3F] group-hover:text-amber-800">
                  {p.name} & {p.partnerName}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                  ${(p.initialDeposit / 1000).toFixed(0)}k
                </span>
              </div>
              <p className="text-[11px] text-gray-500 line-clamp-1">{p.marriageType}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Creation Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#C9A84C]" />
            <h2 className="text-base font-bold text-gray-900">Create New Demo Investor Account</h2>
          </div>
          <span className="text-xs text-gray-400">NextAuth & Prisma Synchronized</span>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleCreateDemoUser} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Investor Details */}
            <div className="space-y-3 p-4 rounded-xl bg-gray-50/70 border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F1C3F] uppercase tracking-wider">
                <User className="w-4 h-4 text-[#C9A84C]" />
                Primary Investor Details
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] bg-white"
                  placeholder="Julian Vance"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email (Login Username)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] bg-white"
                  placeholder="julian.vance@unioninvest.ch"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-700">Account Password</label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] text-[#C9A84C] hover:underline font-medium"
                  >
                    Generate Random
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] bg-white font-mono"
                    placeholder="Enter password"
                  />
                  <Key className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Spouse / Partner & Marriage Details */}
            <div className="space-y-3 p-4 rounded-xl bg-gray-50/70 border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F1C3F] uppercase tracking-wider">
                <Heart className="w-4 h-4 text-[#C9A84C]" />
                Spouse & Marriage Classification
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Partner / Spouse Name</label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] bg-white"
                  placeholder="Marcus Vance"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Partner Email (Optional)</label>
                <input
                  type="email"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] bg-white"
                  placeholder="marcus.vance@unioninvest.ch"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Marriage Type</label>
                <select
                  value={marriageType}
                  onChange={(e) => setMarriageType(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] bg-white"
                >
                  <option value="Same-Sex Marriage (Gay/Lesbian)">Same-Sex Marriage (Gay/Lesbian)</option>
                  <option value="Civil Union / Registered Partnership">Civil Union / Registered Partnership</option>
                  <option value="Opposite-Sex Marriage (Traditional)">Opposite-Sex Marriage (Traditional)</option>
                  <option value="Mutual Covenant Agreement">Mutual Covenant Agreement</option>
                </select>
              </div>
            </div>
          </div>

          {/* Capital & Memo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Pre-funded Portfolio Capital (USD)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(Number(e.target.value))}
                  className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] bg-white"
                  placeholder="50000"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Creates a verified COMPLETED deposit transaction ready to display on the dashboard.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Internal Note / Memo</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] bg-white"
                placeholder="Demonstration for prospect VIP couple"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-[#0F1C3F] bg-[#C9A84C] hover:bg-[#d4b460] active:scale-95 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating Demo Account...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Deploy Demo Investor Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Demo Accounts List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Active Demo Investor Accounts</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Available demo accounts ready for investor testing and spouse invitation.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700">
            {demoUsers.length} Configured
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-400 text-xs">Loading demo accounts...</div>
        ) : demoUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">No Demo Accounts Created Yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Use the form or quick presets above to generate a fully funded demo couple account.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {demoUsers.map((user) => {
              const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://marriage-invest.vercel.app/login'
              const credentialsText = `Union Invest Demo Credentials:\nEmail: ${user.email}\nPassword: ${user.plainPassword || 'DemoPass2025!'}\nLogin: ${loginUrl}\nPartner: ${user.partnerName}\nInvite Link: ${user.inviteLink}`
              return (
                <div key={user.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Couple & Marriage Details */}
                    <div className="space-y-1.5 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#0F1C3F]">{user.name}</span>
                        <span className="text-gray-400 text-xs">&</span>
                        <span className="font-bold text-sm text-[#0F1C3F]">{user.partnerName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Verified Demo
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium text-[11px]">
                          {user.marriageType}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="font-semibold text-emerald-700">
                          ${user.initialDeposit?.toLocaleString()} Pre-funded
                        </span>
                      </div>

                      {user.note && (
                        <p className="text-[11px] text-gray-400 italic line-clamp-1">"{user.note}"</p>
                      )}
                    </div>

                    {/* Middle: Credentials Box */}
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1 min-w-[280px]">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-[11px]">Email:</span>
                        <div className="flex items-center gap-1.5">
                          <code className="font-mono text-gray-900 font-bold">{user.email}</code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(user.email, `email-${user.id}`)}
                            className="text-gray-400 hover:text-gray-700 p-0.5"
                            title="Copy email"
                          >
                            {copiedKey === `email-${user.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-[11px]">Password:</span>
                        <div className="flex items-center gap-1.5">
                          <code className="font-mono text-amber-900 font-bold">
                            {user.plainPassword || 'DemoPass2025!'}
                          </code>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(user.plainPassword || 'DemoPass2025!', `pwd-${user.id}`)
                            }
                            className="text-gray-400 hover:text-gray-700 p-0.5"
                            title="Copy password"
                          >
                            {copiedKey === `pwd-${user.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(user.inviteLink, `invite-${user.id}`)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 flex items-center gap-1.5 transition-colors"
                        title="Copy Spouse Invitation Link"
                      >
                        {copiedKey === `invite-${user.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <Heart className="w-3.5 h-3.5 text-[#C9A84C]" />
                            <span>Copy Spouse Invite Link</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(credentialsText, `cred-${user.id}`)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1.5 transition-colors"
                        title="Copy full credentials dossier"
                      >
                        {copiedKey === `cred-${user.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Credentials Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Credentials</span>
                          </>
                        )}
                      </button>

                      <a
                        href="/login"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 flex items-center gap-1"
                        title="Open Login Page in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDeleteDemoUser(user.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Demo Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
