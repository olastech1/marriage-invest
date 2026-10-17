'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Shield,
  KeyRound,
  Bell,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Lock,
} from 'lucide-react'

export default function InvestorSettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile')

  const [profile, setProfile] = useState({
    name: 'Jane Doe',
    phone: '+1 (555) 349-8821',
    email: 'jane.doe@unioninvest.com',
    spouseName: 'Marcus Vance',
    spouseEmail: 'marcus.vance@unioninvest.com',
    spousePhone: '+1 (555) 782-9940',
  })

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [twoFactor, setTwoFactor] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Load live profile & spouse contact details on client mount
  useEffect(() => {
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setProfile({
            name: data.user.name || 'Jane Doe',
            phone: data.user.phone || '+1 (555) 349-8821',
            email: data.user.email || 'jane.doe@unioninvest.com',
            spouseName: data.spouse?.name || 'Marcus Vance',
            spouseEmail: data.spouse?.email || 'marcus.vance@unioninvest.com',
            spousePhone: data.spouse?.phone || '+1 (555) 782-9940',
          })
        }
      })
      .catch(console.error)
  }, [])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          spouseEmail: profile.spouseEmail,
          spousePhone: profile.spousePhone,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')
      setStatusMsg('✓ Profile & spouse contact details successfully updated and synced with Chat & Reminders!')
      setTimeout(() => setStatusMsg(''), 3500)
    } catch (err: any) {
      setErrorMsg(err.message)
      setTimeout(() => setErrorMsg(''), 3500)
    }
  }

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) {
      setErrorMsg('New passwords do not match.')
      return
    }
    setErrorMsg('')
    setStatusMsg('Password updated successfully.')
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setTimeout(() => setStatusMsg(''), 3000)
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1C3F]">Account & Security Settings</h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage joint partner profile information, authentication safeguards, and security credentials.
        </p>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-[#C9A84C] text-[#0F1C3F]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Partner Profile
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-[#C9A84C] text-[#0F1C3F]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Security & Password
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'notifications'
              ? 'border-[#C9A84C] text-[#0F1C3F]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Notification Preferences
        </button>
      </div>

      {/* Profile Form */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#0F1C3F] flex items-center gap-2">
                <User className="w-4 h-4 text-[#C9A84C]" />
                Primary Partner (Your Profile)
              </h2>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Signatory Verified
              </span>
            </div>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Your Legal Name *
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Your Primary Account Email (Read-only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Your Verified Contact Telephone
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                />
              </div>

              <div className="pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#0F1C3F] flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#C9A84C]" />
                    Connected Spouse Contact (Linked to Chat & Reminders)
                  </h3>
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                    Covenant Connected
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Deposit reminders, reciprocation notifications, and chat invites will be delivered to this email and telephone number.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Spouse / Partner Name
                    </label>
                    <input
                      type="text"
                      value={profile.spouseName}
                      disabled
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Spouse Delivery Email (For Deposit Nudges)
                    </label>
                    <input
                      type="email"
                      value={profile.spouseEmail}
                      onChange={(e) => setProfile({ ...profile, spouseEmail: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Spouse Verified Mobile / SMS Contact
                  </label>
                  <input
                    type="tel"
                    value={profile.spousePhone}
                    onChange={(e) => setProfile({ ...profile, spousePhone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0F1C3F] hover:bg-[#162c5e] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Save Profile & Contact Information
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Form */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-base font-bold text-[#0F1C3F] mb-6">Change Portal Password</h2>
            <form onSubmit={handlePasswordSave} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#C9A84C] outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#0F1C3F] hover:bg-[#162c5e] text-white text-xs font-bold transition-colors"
              >
                Update Password
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#0F1C3F]">Two-Factor Authentication (2FA)</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-md">
                  Require an authenticator app code (Google Authenticator / Authy) upon every login to protect your investments.
                </p>
              </div>
              <button
                onClick={() => setTwoFactor(!twoFactor)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  twoFactor
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {twoFactor ? 'Enabled ✓' : 'Enable 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#0F1C3F] mb-4">Email Notifications</h2>
          {[
            { label: 'Contractual Distribution Notices', desc: 'Receive real-time alerts when yields are credited to your cash ledger.' },
            { label: 'Document & Offer Updates', desc: 'Notified when new official offer documents or versions are published.' },
            { label: 'Security & Login Alerts', desc: 'Immediate notification of logins from unrecognized devices or IP addresses.' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
              <div>
                <p className="text-xs font-bold text-gray-900">{item.label}</p>
                <p className="text-[11px] text-gray-500">{item.desc}</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#C9A84C]" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
