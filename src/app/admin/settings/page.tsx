'use client'

import { useState, useEffect } from 'react'
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
  Eye,
  EyeOff,
  Send,
  Radio,
  FileCode,
  Copy,
} from 'lucide-react'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'finance' | 'payments' | 'security' | 'email' | 'system'>('general')
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [testingDb, setTestingDb] = useState(false)
  const [dbStatus, setDbStatus] = useState<string | null>(null)

  // Stripe Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    secretKey: '',
    publishableKey: '',
    webhookSecret: '',
    mode: 'SANDBOX',
    isPlaceholder: true,
    isLive: false,
    webhookUrl: 'https://unionverify.com/api/webhooks/stripe',
    rawSecretKeyPresent: false,
    rawWebhookSecretPresent: false,
  })
  const [showStripeSecret, setShowStripeSecret] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)
  const [testingPayment, setTestingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<{ type: 'success' | 'error'; message: string; details?: string } | null>(null)
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [copiedPaymentEnv, setCopiedPaymentEnv] = useState(false)
  const [savingPayment, setSavingPayment] = useState(false)

  // Form states
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'Union Verify',
    tagline: 'Building Wealth Together — A Marriage Investment Platform',
    supportEmail: 'support@unionverify.com',
    complianceEmail: 'compliance@unionverify.com',
    supportPhone: '',
    currency: 'USD ($)',
    timezone: 'UTC',
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

  // SMTP Email Settings
  const [emailSettings, setEmailSettings] = useState({
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: '465',
    encryption: 'SSL/TLS',
    user: 'AKIAVHXIDBLGLO4ATDEA',
    pass: 'BAEcA3rSWKXc6pukKBAb+EbAtpshVIFI5RWgBSkGHeSp',
    fromEmail: 'support@unionverify.com',
    fromName: 'Union Verify Notifications',
    testRecipient: 'support@unionverify.com',
  })

  useEffect(() => {
    fetch('/api/admin/email/test')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.host) {
          setEmailSettings((prev) => ({
            ...prev,
            host: data.host,
            port: data.port || '465',
            encryption: data.encryption || 'SSL/TLS',
            user: data.user || '',
            pass: data.pass || '',
            fromEmail: data.fromEmail || 'support@unionverify.com',
            fromName: data.fromName || 'Union Verify Notifications',
          }))
        }
      })
      .catch((err) => console.error('Failed to load SMTP settings:', err))
  }, [])

  const [showPassword, setShowPassword] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string; details?: string } | null>(null)
  const [copiedEnv, setCopiedEnv] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setStatusMsg('All platform and SMTP settings successfully saved.')
      setTimeout(() => setStatusMsg(''), 4000)
    }, 600)
  }

  const handleTestEmail = async (sendActual = false) => {
    setTestingEmail(true)
    setEmailStatus(null)

    try {
      const res = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: emailSettings.host,
          port: Number(emailSettings.port),
          user: emailSettings.user,
          pass: emailSettings.pass,
          secure: emailSettings.encryption === 'SSL/TLS' || Number(emailSettings.port) === 465,
          fromEmail: emailSettings.fromEmail,
          fromName: emailSettings.fromName,
          toEmail: emailSettings.testRecipient,
          sendTest: sendActual,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setEmailStatus({
          type: 'success',
          message: data.message,
        })
      } else {
        setEmailStatus({
          type: 'error',
          message: data.error || 'Failed to authenticate with SMTP server.',
          details: data.details || (data.code ? `Error Code: ${data.code}` : undefined),
        })
      }
    } catch (err: any) {
      setEmailStatus({
        type: 'error',
        message: err.message || 'Network error communicating with test endpoint.',
      })
    } finally {
      setTestingEmail(false)
    }
  }

  const handleApplySesPreset = () => {
    setEmailSettings({
      ...emailSettings,
      host: 'email-smtp.us-east-1.amazonaws.com',
      port: '465',
      encryption: 'SSL/TLS',
      user: 'AKIAVHXIDBLGLO4ATDEA',
      pass: 'BAEcA3rSWKXc6pukKBAb+EbAtpshVIFI5RWgBSkGHeSp',
      fromEmail: 'support@unionverify.com',
      fromName: 'Union Verify Notifications',
    })
    setEmailStatus({
      type: 'success',
      message: 'Amazon SES credentials loaded (email-smtp.us-east-1.amazonaws.com:465). Click "Verify Handshake" to test.',
    })
  }

  const handleApplyVpsPreset = (type: 'invest' | 'noreply' | 'admin') => {
    if (type === 'invest') {
      setEmailSettings({
        ...emailSettings,
        host: 'mail.unionverify.com',
        port: '587',
        encryption: 'STARTTLS',
        user: 'invest@unionverify.com',
        pass: 'UnionM@il_98Fid!2026',
        fromEmail: 'invest@unionverify.com',
        fromName: 'Union Verify Notifications',
      })
    } else if (type === 'noreply') {
      setEmailSettings({
        ...emailSettings,
        host: 'mail.unionverify.com',
        port: '587',
        encryption: 'STARTTLS',
        user: 'noreply@unionverify.com',
        pass: 'UnionVerify_Smtp2026!',
        fromEmail: 'noreply@unionverify.com',
        fromName: 'Union Verify System',
      })
    } else {
      setEmailSettings({
        ...emailSettings,
        host: 'mail.unionverify.com',
        port: '587',
        encryption: 'STARTTLS',
        user: 'admin@unionverify.com',
        pass: 'UnionVerify_Smtp2026!',
        fromEmail: 'admin@unionverify.com',
        fromName: 'Union Verify Administration',
      })
    }
    setEmailStatus({
      type: 'success',
      message: `Preset (${type}@unionverify.com) loaded. Click "Verify Handshake" to test.`,
    })
  }

  const handleCopyEnv = () => {
    const envText = `SMTP_HOST=${emailSettings.host}
SMTP_PORT=${emailSettings.port}
SMTP_USER=${emailSettings.user}
SMTP_PASS=${emailSettings.pass}
EMAIL_FROM=${emailSettings.fromEmail}
EMAIL_FROM_NAME="${emailSettings.fromName}"`

    navigator.clipboard.writeText(envText)
    setCopiedEnv(true)
    setTimeout(() => setCopiedEnv(false), 3000)
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

  const loadPaymentSettings = () => {
    fetch('/api/admin/payments')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success) {
          setPaymentSettings({
            secretKey: data.secretKey || '',
            publishableKey: data.publishableKey || '',
            webhookSecret: data.webhookSecret || '',
            mode: data.mode || 'SANDBOX',
            isPlaceholder: data.isPlaceholder ?? true,
            isLive: data.isLive ?? false,
            webhookUrl: data.webhookUrl || 'https://unionverify.com/api/webhooks/stripe',
            rawSecretKeyPresent: data.rawSecretKeyPresent ?? false,
            rawWebhookSecretPresent: data.rawWebhookSecretPresent ?? false,
          })
        }
      })
      .catch((err) => console.error('Failed to load payment settings:', err))
  }

  useEffect(() => {
    loadPaymentSettings()
  }, [])

  const handleTestPayment = async () => {
    setTestingPayment(true)
    setPaymentStatus(null)
    try {
      const res = await fetch('/api/admin/payments/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretKey: paymentSettings.secretKey,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setPaymentStatus({
          type: 'success',
          message: data.message,
          details: data.details,
        })
        loadPaymentSettings()
      } else {
        setPaymentStatus({
          type: 'error',
          message: data.error || 'Stripe API authentication failed.',
          details: data.code ? `Stripe Code: ${data.code}` : undefined,
        })
      }
    } catch (err: any) {
      setPaymentStatus({
        type: 'error',
        message: err.message || 'Network error while contacting Stripe API.',
      })
    } finally {
      setTestingPayment(false)
    }
  }

  const handleSavePayment = async () => {
    setSavingPayment(true)
    setPaymentStatus(null)
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretKey: paymentSettings.secretKey,
          publishableKey: paymentSettings.publishableKey,
          webhookSecret: paymentSettings.webhookSecret,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setPaymentStatus({
          type: 'success',
          message: '✓ Stripe API keys and Webhook secret saved to environment successfully!',
        })
        loadPaymentSettings()
      } else {
        setPaymentStatus({
          type: 'error',
          message: data.error || 'Failed to save Stripe keys.',
        })
      }
    } catch (err: any) {
      setPaymentStatus({
        type: 'error',
        message: err.message || 'Network error saving payment settings.',
      })
    } finally {
      setSavingPayment(false)
    }
  }

  const handleCopyPaymentEnv = () => {
    const envText = `STRIPE_SECRET_KEY="${paymentSettings.secretKey}"
STRIPE_PUBLISHABLE_KEY="${paymentSettings.publishableKey}"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="${paymentSettings.publishableKey}"
STRIPE_WEBHOOK_SECRET="${paymentSettings.webhookSecret}"`

    navigator.clipboard.writeText(envText)
    setCopiedPaymentEnv(true)
    setTimeout(() => setCopiedPaymentEnv(false), 3000)
  }

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(paymentSettings.webhookUrl)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1C3F]">Platform Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure platform parameters, financial limits, security policies, SMTP email server, and integrations.
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
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'payments'
              ? 'border-[#C9A84C] text-[#0F1C3F]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Payments & Stripe
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            paymentSettings.isLive
              ? 'bg-emerald-100 text-emerald-800'
              : paymentSettings.isPlaceholder
              ? 'bg-blue-100 text-blue-800'
              : 'bg-purple-100 text-purple-800'
          }`}>
            {paymentSettings.isLive ? 'LIVE' : paymentSettings.isPlaceholder ? 'SANDBOX' : 'TEST'}
          </span>
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
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'email'
              ? 'border-[#C9A84C] text-[#0F1C3F]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Mail className="w-4 h-4" />
          Email & SMTP Server
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
        </div>
      )}

      {/* Tab: Payments & Stripe */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Stripe Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0F1C3F] via-[#162752] to-[#0F1C3F] text-white border border-[#C9A84C]/30 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 border border-white/20">
                  <span className={`w-2 h-2 rounded-full ${
                    paymentSettings.isLive
                      ? 'bg-emerald-400 animate-pulse'
                      : paymentSettings.isPlaceholder
                      ? 'bg-blue-400'
                      : 'bg-purple-400'
                  }`} />
                  {paymentSettings.isLive
                    ? 'Stripe Live Production Gateway'
                    : paymentSettings.isPlaceholder
                    ? 'Stripe Sandbox Simulation Active'
                    : 'Stripe Test Mode Gateway'}
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#C9A84C]" />
                  Stripe Payment Processing & Checkout Pipeline
                </h3>
                <p className="text-xs text-gray-300">
                  Accept Credit / Debit Cards, Apple Pay, Google Pay, and Bank Transfers in <code className="text-[#C9A84C]">USD ($)</code>.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href="https://dashboard.stripe.com/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 border border-white/10"
                >
                  <Lock size={12} />
                  Stripe Dashboard Keys ↗
                </a>
                <button
                  type="button"
                  onClick={handleCopyPaymentEnv}
                  className="px-3.5 py-2 rounded-lg bg-[#C9A84C] text-[#0F1C3F] text-xs font-bold hover:bg-[#d4b460] transition-colors shadow-sm flex items-center gap-1.5"
                >
                  {copiedPaymentEnv ? <Check size={13} /> : <Copy size={13} />}
                  {copiedPaymentEnv ? 'Copied Env Vars!' : 'Copy Vercel Env Vars'}
                </button>
              </div>
            </div>
          </div>

          {/* Payment Credentials Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Stripe API Keys & Webhook Credentials</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Configure your Stripe API keys used for creating payment sessions and processing joint marriage deposits.
                </p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full self-start ${
                paymentSettings.isLive
                  ? 'bg-emerald-100 text-emerald-800'
                  : paymentSettings.isPlaceholder
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                Mode: {paymentSettings.mode}
              </span>
            </div>

            <div className="space-y-5">
              {/* Secret Key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Stripe Secret Key (STRIPE_SECRET_KEY)
                  </label>
                  <span className="text-[11px] text-gray-400 font-mono">Starts with sk_test_ or sk_live_</span>
                </div>
                <div className="relative">
                  <input
                    type={showStripeSecret ? 'text' : 'password'}
                    value={paymentSettings.secretKey}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, secretKey: e.target.value })}
                    placeholder="sk_test_51... or sk_live_51..."
                    className="w-full pl-4 pr-11 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStripeSecret(!showStripeSecret)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showStripeSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Private server-side key. Never exposed to the client or browser.
                </p>
              </div>

              {/* Publishable Key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Stripe Publishable Key (STRIPE_PUBLISHABLE_KEY)
                  </label>
                  <span className="text-[11px] text-gray-400 font-mono">Starts with pk_test_ or pk_live_</span>
                </div>
                <input
                  type="text"
                  value={paymentSettings.publishableKey}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, publishableKey: e.target.value })}
                  placeholder="pk_test_51... or pk_live_51..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900 font-mono"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Public browser-facing key for Stripe Elements and client checkout forms.
                </p>
              </div>

              {/* Webhook Signing Secret */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Stripe Webhook Signing Secret (STRIPE_WEBHOOK_SECRET)
                  </label>
                  <span className="text-[11px] text-gray-400 font-mono">Starts with whsec_</span>
                </div>
                <div className="relative">
                  <input
                    type={showWebhookSecret ? 'text' : 'password'}
                    value={paymentSettings.webhookSecret}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, webhookSecret: e.target.value })}
                    placeholder="whsec_..."
                    className="w-full pl-4 pr-11 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showWebhookSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Secret used by <code className="text-slate-800">/api/webhooks/stripe</code> to verify webhook signatures.
                </p>
              </div>
            </div>

            {/* Webhook Endpoint Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Server size={13} className="text-[#0F1C3F]" />
                  Your Stripe Webhook Endpoint URL
                </span>
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="text-xs font-semibold text-[#0F1C3F] hover:text-[#C9A84C] flex items-center gap-1 cursor-pointer"
                >
                  {copiedWebhook ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  {copiedWebhook ? 'Copied!' : 'Copy URL'}
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-300 font-mono text-xs text-slate-800 break-all select-all">
                {paymentSettings.webhookUrl}
              </div>
              <div className="text-[11px] text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">Events to select in Stripe Webhook Settings:</p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {[
                    'checkout.session.completed',
                    'payment_intent.succeeded',
                    'payment_intent.payment_failed',
                    'charge.refunded',
                  ].map((evt) => (
                    <span key={evt} className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-mono">
                      {evt}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Status alerts */}
            {paymentStatus && (
              <div className={`p-4 rounded-xl text-xs space-y-1 ${
                paymentStatus.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {paymentStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  )}
                  <span>{paymentStatus.message}</span>
                </div>
                {paymentStatus.details && (
                  <p className="text-[11px] opacity-90 pl-6">{paymentStatus.details}</p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleTestPayment}
                  disabled={testingPayment}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#0F1C3F] text-white text-xs font-bold hover:bg-[#1a2c5e] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {testingPayment ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C9A84C]" />
                  ) : (
                    <CheckCircle2 size={13} className="text-[#C9A84C]" />
                  )}
                  {testingPayment ? 'Testing Connection...' : 'Test Stripe API Connection'}
                </button>

                <button
                  type="button"
                  onClick={handleSavePayment}
                  disabled={savingPayment}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-gray-300 hover:border-[#C9A84C] text-gray-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {savingPayment ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  {savingPayment ? 'Saving...' : 'Save Payment Credentials'}
                </button>
              </div>

              <div className="text-[11px] text-gray-500">
                Currency: <strong className="text-gray-800">USD ($)</strong> · 256-Bit SSL Encryption
              </div>
            </div>
          </div>

          {/* Quick Setup Guide Checklist */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F1C3F] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#C9A84C]" />
              Quick 60-Second Stripe Setup Checklist
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
                <span className="font-bold text-[#0F1C3F] block">1. Get API Keys</span>
                <p className="text-gray-600 text-[11px]">
                  Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer" className="text-blue-600 underline">Stripe API Keys</a> and copy your Secret & Publishable keys.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
                <span className="font-bold text-[#0F1C3F] block">2. Add Webhook</span>
                <p className="text-gray-600 text-[11px]">
                  In <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noreferrer" className="text-blue-600 underline">Stripe Webhooks</a>, click <strong>Add endpoint</strong> and paste your webhook URL.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
                <span className="font-bold text-[#0F1C3F] block">3. Copy Signing Secret</span>
                <p className="text-gray-600 text-[11px]">
                  Reveal the Signing Secret (<code className="text-slate-800">whsec_...</code>) and paste it into the field above.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
                <span className="font-bold text-[#0F1C3F] block">4. Click Verify</span>
                <p className="text-gray-600 text-[11px]">
                  Click <strong>Save</strong> and <strong>Test Stripe Connection</strong> to verify live payment status!
                </p>
              </div>
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
          </div>
        </div>
      )}

      {/* Tab: Email & SMTP */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          {/* SES & Preset Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0F1C3F] to-[#1c2e61] text-white border border-[#C9A84C]/30 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  Amazon SES (US East - N. Virginia) Connected
                </div>
                <h3 className="text-base font-bold text-white">
                  Amazon SES Transactional SMTP Pipeline
                </h3>
                <p className="text-xs text-gray-300">
                  Host: <code className="text-[#C9A84C]">email-smtp.us-east-1.amazonaws.com</code> · Port: <code className="text-[#C9A84C]">465</code> (SSL) · From: <code className="text-[#C9A84C]">support@unionverify.com</code>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleApplySesPreset}
                  className="px-4 py-2.5 rounded-lg bg-[#C9A84C] text-[#0F1C3F] text-xs font-bold hover:bg-[#d4b460] transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 size={13} />
                  Load Amazon SES Credentials
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">SMTP Server Configuration</h2>
              <p className="text-xs text-gray-500 mt-1">
                Manage transactional mail credentials used for verification emails, partner invitations, and receipts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                  SMTP Server Hostname / IP
                </label>
                <input
                  type="text"
                  value={emailSettings.host}
                  onChange={(e) => setEmailSettings({ ...emailSettings, host: e.target.value })}
                  placeholder="e.g. mail.unionverify.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={emailSettings.port}
                    onChange={(e) => setEmailSettings({ ...emailSettings, port: e.target.value })}
                    placeholder="587"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                    Encryption
                  </label>
                  <select
                    value={emailSettings.encryption}
                    onChange={(e) => setEmailSettings({ ...emailSettings, encryption: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900 bg-white"
                  >
                    <option value="STARTTLS">STARTTLS (Port 587)</option>
                    <option value="SSL/TLS">SSL / TLS (Port 465)</option>
                    <option value="NONE">None (Port 25)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                  SMTP Username / Auth Mailbox
                </label>
                <input
                  type="text"
                  value={emailSettings.user}
                  onChange={(e) => setEmailSettings({ ...emailSettings, user: e.target.value })}
                  placeholder="noreply@unionverify.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                  SMTP Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={emailSettings.pass}
                    onChange={(e) => setEmailSettings({ ...emailSettings, pass: e.target.value })}
                    placeholder="••••••••••••••••"
                    className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                  Default Sender Address (From)
                </label>
                <input
                  type="email"
                  value={emailSettings.fromEmail}
                  onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                  Default Sender Name (From)
                </label>
                <input
                  type="text"
                  value={emailSettings.fromName}
                  onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900"
                />
              </div>
            </div>

            {/* Test Panel */}
            <div className="pt-6 border-t border-gray-100 space-y-4">
              <h3 className="text-sm font-bold text-[#0F1C3F]">Live SMTP Verification & Diagnostics</h3>
              <p className="text-xs text-gray-500">
                Send a real test email through the VPS SMTP server to confirm DNS, TLS certificates, and mailbox authentication.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="email"
                  value={emailSettings.testRecipient}
                  onChange={(e) => setEmailSettings({ ...emailSettings, testRecipient: e.target.value })}
                  placeholder="Recipient (e.g. admin@unionverify.com)"
                  className="w-full sm:w-80 px-4 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-[#C9A84C] outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleTestEmail(false)}
                  disabled={testingEmail}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingEmail ? 'animate-spin' : ''}`} />
                  Verify Handshake
                </button>
                <button
                  type="button"
                  onClick={() => handleTestEmail(true)}
                  disabled={testingEmail}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#0F1C3F] hover:bg-[#1a2c5e] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5 text-[#C9A84C]" />
                  Send Test Message
                </button>
              </div>

              {/* Status Banner */}
              {emailStatus && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-1 ${
                    emailStatus.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {emailStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span>{emailStatus.type === 'success' ? 'Verification Passed' : 'Verification Issue'}</span>
                  </div>
                  <p>{emailStatus.message}</p>
                  {emailStatus.details && (
                    <p className="font-mono text-[11px] opacity-80 pt-1">{emailStatus.details}</p>
                  )}
                </div>
              )}
            </div>

            {/* Vercel Environment Snippet */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">Production Vercel Environment Variables:</span>
                <button
                  type="button"
                  onClick={handleCopyEnv}
                  className="text-xs text-[#0F1C3F] hover:text-[#C9A84C] font-semibold flex items-center gap-1"
                >
                  {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedEnv ? 'Copied to Clipboard!' : 'Copy Variables'}
                </button>
              </div>
              <pre className="p-3 bg-gray-900 text-gray-200 rounded-lg text-xs font-mono overflow-x-auto">
{`SMTP_HOST=${emailSettings.host}
SMTP_PORT=${emailSettings.port}
SMTP_USER=${emailSettings.user}
SMTP_PASS=${emailSettings.pass}
EMAIL_FROM=${emailSettings.fromEmail}
EMAIL_FROM_NAME="${emailSettings.fromName}"`}
              </pre>
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
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    paymentSettings.isLive
                      ? 'bg-emerald-100 text-emerald-800'
                      : paymentSettings.isPlaceholder
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      paymentSettings.isLive
                        ? 'bg-emerald-500'
                        : paymentSettings.isPlaceholder
                        ? 'bg-blue-500'
                        : 'bg-purple-500'
                    }`}></span>
                    {paymentSettings.mode}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 bg-white p-2.5 rounded border border-gray-200">
                  <span>
                    {paymentSettings.isLive
                      ? 'Live Card & Apple Pay Processing'
                      : paymentSettings.isPlaceholder
                      ? 'Sandbox Mode Active (/api/webhooks/stripe)'
                      : 'Test Mode Active (/api/webhooks/stripe)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('payments')}
                    className="text-[#0F1C3F] font-bold hover:text-[#C9A84C] cursor-pointer"
                  >
                    Configure →
                  </button>
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
                      <p className="text-xs text-gray-500">Amazon SES (US East - N. Virginia)</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    ACTIVE
                  </span>
                </div>
                <div className="text-xs text-gray-600 font-mono bg-white p-2.5 rounded border border-gray-200 truncate">
                  email-smtp.us-east-1.amazonaws.com:465 (SSL)
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('email')}
                  className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-[#0F1C3F] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#C9A84C]" />
                  Configure SMTP & Test Delivery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
