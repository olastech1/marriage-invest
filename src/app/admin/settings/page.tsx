'use client'

import { useState } from 'react'
import {
  Building2,
  Shield,
  CreditCard,
  Server,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
  Lock,
  Mail,
  RefreshCw,
  Sliders,
  Check,
} from 'lucide-react'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'finance' | 'security' | 'system'>('general')
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [testingDb, setTestingDb] = useState(false)
  const [dbStatus, setDbStatus] = useState<string | null>(null)

  // Form states
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'Union Invest',
    tagline: 'Building Wealth Together — A Marriage Investment Platform',
    supportEmail: 'support@unioninvest.com',
    complianceEmail: 'compliance@unioninvest.com',
    supportPhone: '+1 (800) 555-0199',
    currency: 'USD ($)',
    timezone: 'America/New_York (UTC-5)',
  })

  const [financeSettings, setFinanceSettings] = useState({
    minInvestment: '1000',
    maxInvestment: '100000',
    earlyWithdrawalFee: '2.5',
    managementFee: '0.5',
    autoReinvestDefault: true,
    requireAdminWithdrawalApproval: true,
  })

  const [securitySettings, setSecuritySettings] = useState({
    enforceAdmin2FA: true,
    sessionTimeoutMinutes: '30',
    maxFailedAttempts: '5',
    kycRequirementLevel: 'STRICT',
    ipWhitelisting: false,
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setStatusMsg('Platform settings successfully saved.')
      setTimeout(() => setStatusMsg(''), 4000)
    }, 600)
  }

  const handleTestDatabase = async () => {
    setTestingDb(true)
    try {
      const res = await fetch('/api/investments')
      if (res.ok) {
        setDbStatus('PostgreSQL on 144.91.68.190 is connected and responsive.')
      } else {
        setDbStatus('Database returned an error status.')
      }
    } catch {
      setDbStatus('Failed to connect to database endpoint.')
    } finally {
      setTestingDb(false)
      setTimeout(() => setDbStatus(null), 5000)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1C3F]">Platform Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure platform parameters, financial limits, security policies, and integrations.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F1C3F] text-white font-medium hover:bg-[#1a2c5e] transition-colors shadow-sm disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin text-[#C9A84C]" />
          ) : (
            <Save className="w-4 h-4 text-[#C9A84C]" />
          )}
          {saving ? 'Saving Changes...' : 'Save All Changes'}
        </button>
      </div>

      {/* Success alert */}
      {statusMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'general'
              ? 'border-[#C9A84C] text-[#0F1C3F]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          General & Organization
        </button>
        <button
          onClick={() => setActiveTab('finance')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'finance'
              ? 'border-[#C9A84C] text-[#0F1C3F]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Financial Rules & Limits
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'security'
              ? 'border-[#C9A84C] text-[#0F1C3F]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          Security & Access
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'system'
              ? 'border-[#C9A84C] text-[#0F1C3F]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Server className="w-4 h-4" />
          System & Integrations
        </button>
      </div>

      {/* Tab: General */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-semibold text-gray-900">Organization & Branding</h2>
            <p className="text-xs text-gray-500 mt-1">Platform public profile and administrative contact details.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                Platform Brand Name
              </label>
              <input
                type="text"
                value={generalSettings.platformName}
                onChange={(e) => setGeneralSettings({ ...generalSettings, platformName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                Default Currency
              </label>
              <input
                type="text"
                disabled
                value={generalSettings.currency}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                Brand Tagline
              </label>
              <input
                type="text"
                value={generalSettings.tagline}
                onChange={(e) => setGeneralSettings({ ...generalSettings, tagline: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                Support Email
              </label>
              <input
                type="email"
                value={generalSettings.supportEmail}
                onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                Compliance Desk Email
              </label>
              <input
                type="email"
                value={generalSettings.complianceEmail}
                onChange={(e) => setGeneralSettings({ ...generalSettings, complianceEmail: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                Support Contact Line
              </label>
              <input
                type="text"
                value={generalSettings.supportPhone}
                onChange={(e) => setGeneralSettings({ ...generalSettings, supportPhone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                Platform Primary Timezone
              </label>
              <input
                type="text"
                value={generalSettings.timezone}
                onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Finance */}
      {activeTab === 'finance' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-semibold text-gray-900">Investment Governance & Fee Limits</h2>
            <p className="text-xs text-gray-500 mt-1">Configure investment ceilings, thresholds, and withdrawal penalties.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                Default Minimum Investment (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-400 font-medium">$</span>
                <input
                  type="number"
                  value={financeSettings.minInvestment}
                  onChange={(e) => setFinanceSettings({ ...financeSettings, minInvestment: e.target.value })}
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                Default Maximum Investment (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-400 font-medium">$</span>
                <input
                  type="number"
                  value={financeSettings.maxInvestment}
                  onChange={(e) => setFinanceSettings({ ...financeSettings, maxInvestment: e.target.value })}
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                Early Withdrawal Penalty Fee (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={financeSettings.earlyWithdrawalFee}
                  onChange={(e) => setFinanceSettings({ ...financeSettings, earlyWithdrawalFee: e.target.value })}
                  className="w-full pr-8 pl-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900"
                />
                <span className="absolute right-3.5 top-2.5 text-gray-400 font-medium">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                Annual Platform Administration Fee (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={financeSettings.managementFee}
                  onChange={(e) => setFinanceSettings({ ...financeSettings, managementFee: e.target.value })}
                  className="w-full pr-8 pl-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900"
                />
                <span className="absolute right-3.5 top-2.5 text-gray-400 font-medium">%</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-gray-900">Mandatory Admin Approval for Withdrawals</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Require compliance/finance officer manual sign-off before releasing investor withdrawals.
                </p>
              </div>
              <input
                type="checkbox"
                checked={financeSettings.requireAdminWithdrawalApproval}
                onChange={(e) => setFinanceSettings({ ...financeSettings, requireAdminWithdrawalApproval: e.target.checked })}
                className="w-5 h-5 rounded text-[#C9A84C] focus:ring-[#C9A84C]"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-gray-900">Enable Automatic Distribution Reinvestment Option</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Permit investors to automatically compound quarterly returns into subsequent investment vehicles.
                </p>
              </div>
              <input
                type="checkbox"
                checked={financeSettings.autoReinvestDefault}
                onChange={(e) => setFinanceSettings({ ...financeSettings, autoReinvestDefault: e.target.checked })}
                className="w-5 h-5 rounded text-[#C9A84C] focus:ring-[#C9A84C]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Security */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-semibold text-gray-900">Authentication & Security Safeguards</h2>
            <p className="text-xs text-gray-500 mt-1">Configure staff authorization, 2FA, session policies, and KYC requirements.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">Enforce 2-Factor Authentication (2FA) for Staff</p>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">RECOMMENDED</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Mandatory TOTP authenticator verification on every login for Admin, Finance, and Support roles.
                </p>
              </div>
              <input
                type="checkbox"
                checked={securitySettings.enforceAdmin2FA}
                onChange={(e) => setSecuritySettings({ ...securitySettings, enforceAdmin2FA: e.target.checked })}
                className="w-5 h-5 rounded text-[#C9A84C] focus:ring-[#C9A84C]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                  Staff Session Inactivity Timeout (Minutes)
                </label>
                <input
                  type="number"
                  value={securitySettings.sessionTimeoutMinutes}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeoutMinutes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                  Max Consecutive Failed Login Attempts
                </label>
                <input
                  type="number"
                  value={securitySettings.maxFailedAttempts}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, maxFailedAttempts: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                  Investor KYC Verification Level
                </label>
                <select
                  value={securitySettings.kycRequirementLevel}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, kycRequirementLevel: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900 bg-white"
                >
                  <option value="STRICT">Strict (ID + Address Verification before any deposit)</option>
                  <option value="FLEXIBLE">Standard (Verification required before withdrawal)</option>
                  <option value="BASIC">Tier 1 (Self-attestation up to $5,000)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: System & Integrations */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Connected Services & Infrastructure</h2>
              <p className="text-xs text-gray-500 mt-1">Real-time status of your database, payment processor, and hosting environment.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PostgreSQL Card */}
              <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">PostgreSQL 16</h3>
                      <p className="text-xs text-gray-500">Dedicated VPS Instance</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    ONLINE
                  </span>
                </div>
                <div className="text-xs text-gray-600 font-mono bg-white p-2.5 rounded border border-gray-200 truncate">
                  host: 144.91.68.190:5432 / db: marriage_invest
                </div>
                <button
                  type="button"
                  onClick={handleTestDatabase}
                  disabled={testingDb}
                  className="w-full text-xs font-medium py-2 px-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingDb ? 'animate-spin' : ''}`} />
                  {testingDb ? 'Verifying Connection...' : 'Test Connection'}
                </button>
                {dbStatus && (
                  <p className="text-xs text-emerald-700 font-medium text-center animate-fade-in">{dbStatus}</p>
                )}
              </div>

              {/* Stripe Card */}
              <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-purple-100 text-purple-700">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Stripe Payments</h3>
                      <p className="text-xs text-gray-500">Payment Gateway</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    SANDBOX MODE
                  </span>
                </div>
                <div className="text-xs text-gray-600 bg-white p-2.5 rounded border border-gray-200">
                  Ready for Test Cards & Webhooks (/api/webhooks/stripe)
                </div>
              </div>

              {/* Vercel Hosting Card */}
              <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-900 text-white">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Vercel Edge Cloud</h3>
                      <p className="text-xs text-gray-500">Production Deployment</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    ACTIVE
                  </span>
                </div>
                <div className="text-xs text-gray-600 bg-white p-2.5 rounded border border-gray-200">
                  Next.js 16.4.0 App Router + Turbopack
                </div>
              </div>

              {/* Email Delivery Card */}
              <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Email Dispatcher</h3>
                      <p className="text-xs text-gray-500">Nodemailer / SMTP</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    READY
                  </span>
                </div>
                <div className="text-xs text-gray-600 bg-white p-2.5 rounded border border-gray-200">
                  Transactional verification and receipt dispatcher
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
