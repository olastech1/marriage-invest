'use client'

import { useState, useEffect } from 'react'
import {
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
  Copy,
} from 'lucide-react'

type Status = { type: 'success' | 'error'; message: string; details?: string } | null
type Tab = 'rates' | 'payments' | 'email' | 'system'

function StatusBox({ status }: { status: Status }) {
  if (!status) return null
  return (
    <div
      className={`p-4 rounded-xl text-xs space-y-1 ${
        status.type === 'success'
          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          : 'bg-red-50 border border-red-200 text-red-800'
      }`}
    >
      <div className="flex items-center gap-2 font-bold">
        {status.type === 'success' ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
        )}
        <span>{status.message}</span>
      </div>
      {status.details && <p className="text-[11px] opacity-90 pl-6 font-mono">{status.details}</p>}
    </div>
  )
}

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900'
const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('rates')

  // ── Platform rates (/api/admin/settings) ───────────────────────────────────
  const [rates, setRates] = useState({ vaultApy: '', bonusMatchRate: '' })
  const [ratesLoaded, setRatesLoaded] = useState(false)
  const [savingRates, setSavingRates] = useState(false)
  const [ratesStatus, setRatesStatus] = useState<Status>(null)

  // ── Stripe (/api/admin/payments) ───────────────────────────────────────────
  // Secret inputs always start empty; leaving one empty keeps the saved value.
  const [stripe, setStripe] = useState({
    secretKey: '',
    publishableKey: '',
    webhookSecret: '',
  })
  const [stripeInfo, setStripeInfo] = useState({
    loaded: false,
    mode: '',
    isLive: false,
    isPlaceholder: true,
    secretKeySaved: false,
    webhookSecretSaved: false,
    webhookUrl: '',
    supportedEvents: [] as string[],
  })
  const [showStripeSecret, setShowStripeSecret] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)
  const [testingPayment, setTestingPayment] = useState(false)
  const [savingPayment, setSavingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<Status>(null)
  const [copiedWebhook, setCopiedWebhook] = useState(false)

  // ── SMTP test (/api/admin/email/test) ──────────────────────────────────────
  const [smtpConfigured, setSmtpConfigured] = useState<boolean | null>(null)
  const [emailSettings, setEmailSettings] = useState({
    host: '',
    port: '465',
    encryption: 'SSL/TLS',
    user: '',
    pass: '',
    fromEmail: '',
    fromName: '',
    testRecipient: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState<Status>(null)
  const [copiedEnv, setCopiedEnv] = useState(false)

  // ── Database check (/api/admin/health) ─────────────────────────────────────
  const [testingDb, setTestingDb] = useState(false)
  const [dbStatus, setDbStatus] = useState<Status>(null)

  const loadRates = () => {
    fetch('/api/admin/settings')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.settings) throw new Error(data.error || 'Could not load platform rates.')
        setRates({
          vaultApy: String(data.settings.vaultApy),
          bonusMatchRate: String(data.settings.bonusMatchRate),
        })
        setRatesLoaded(true)
      })
      .catch((err) => setRatesStatus({ type: 'error', message: err.message }))
  }

  const loadPaymentSettings = () => {
    fetch('/api/admin/payments')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.success) return
        setStripe((prev) => ({ ...prev, publishableKey: data.publishableKey || '' }))
        setStripeInfo({
          loaded: true,
          mode: data.mode || '',
          isLive: Boolean(data.isLive),
          isPlaceholder: Boolean(data.isPlaceholder),
          secretKeySaved: Boolean(data.rawSecretKeyPresent),
          webhookSecretSaved: Boolean(data.rawWebhookSecretPresent),
          webhookUrl: data.webhookUrl || '',
          supportedEvents: Array.isArray(data.supportedEvents) ? data.supportedEvents : [],
        })
      })
      .catch((err) => console.error('Failed to load payment settings:', err))
  }

  useEffect(() => {
    loadRates()
    loadPaymentSettings()
    fetch('/api/admin/email/test')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return
        setSmtpConfigured(Boolean(data.configured))
        setEmailSettings((prev) => ({
          ...prev,
          host: data.host || '',
          port: data.port || '465',
          encryption: data.encryption || 'SSL/TLS',
          user: data.user || '',
          fromEmail: data.fromEmail || '',
          fromName: data.fromName || '',
        }))
      })
      .catch((err) => console.error('Failed to load SMTP settings:', err))
  }, [])

  const handleSaveRates = async () => {
    setSavingRates(true)
    setRatesStatus(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vaultApy: Number(rates.vaultApy),
          bonusMatchRate: Number(rates.bonusMatchRate),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setRates({
          vaultApy: String(data.settings.vaultApy),
          bonusMatchRate: String(data.settings.bonusMatchRate),
        })
        setRatesStatus({ type: 'success', message: 'Platform rates saved.' })
      } else {
        setRatesStatus({ type: 'error', message: data.error || 'Could not save platform rates.' })
      }
    } catch (err) {
      setRatesStatus({ type: 'error', message: err instanceof Error ? err.message : 'Network error.' })
    } finally {
      setSavingRates(false)
    }
  }

  const handleTestPayment = async () => {
    setTestingPayment(true)
    setPaymentStatus(null)
    try {
      const res = await fetch('/api/admin/payments/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // An empty key tells the server to test the saved key
        body: JSON.stringify({ secretKey: stripe.secretKey.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setPaymentStatus({ type: 'success', message: data.message })
      } else {
        setPaymentStatus({
          type: 'error',
          message: data.error || 'Stripe rejected the key.',
          details: data.code ? `Stripe code: ${data.code}` : undefined,
        })
      }
    } catch (err) {
      setPaymentStatus({ type: 'error', message: err instanceof Error ? err.message : 'Network error while contacting Stripe.' })
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
          // Empty secret fields are left out so the saved values stay unchanged
          secretKey: stripe.secretKey.trim() || undefined,
          publishableKey: stripe.publishableKey.trim(),
          webhookSecret: stripe.webhookSecret.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setPaymentStatus({ type: 'success', message: 'Stripe keys saved.' })
        setStripe((prev) => ({ ...prev, secretKey: '', webhookSecret: '' }))
        loadPaymentSettings()
      } else {
        setPaymentStatus({ type: 'error', message: data.error || 'Failed to save Stripe keys.' })
      }
    } catch (err) {
      setPaymentStatus({ type: 'error', message: err instanceof Error ? err.message : 'Network error saving Stripe keys.' })
    } finally {
      setSavingPayment(false)
    }
  }

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(stripeInfo.webhookUrl)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 3000)
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
          // Empty password means "use the saved SMTP_PASS"
          pass: emailSettings.pass,
          secure: emailSettings.encryption === 'SSL/TLS' || Number(emailSettings.port) === 465,
          fromEmail: emailSettings.fromEmail,
          fromName: emailSettings.fromName,
          toEmail: emailSettings.testRecipient,
          sendTest: sendActual,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setEmailStatus({ type: 'success', message: data.message })
      } else {
        setEmailStatus({
          type: 'error',
          message: data.error || 'Could not connect to the SMTP server.',
          details: data.details || (data.code ? `Error code: ${data.code}` : undefined),
        })
      }
    } catch (err) {
      setEmailStatus({ type: 'error', message: err instanceof Error ? err.message : 'Network error.' })
    } finally {
      setTestingEmail(false)
    }
  }

  const smtpEnvText = `SMTP_HOST=${emailSettings.host}
SMTP_PORT=${emailSettings.port}
SMTP_USER=${emailSettings.user}
SMTP_PASS=<your SMTP password>
EMAIL_FROM=${emailSettings.fromEmail}
EMAIL_FROM_NAME="${emailSettings.fromName}"`

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(smtpEnvText)
    setCopiedEnv(true)
    setTimeout(() => setCopiedEnv(false), 3000)
  }

  const handleTestDatabase = async () => {
    setTestingDb(true)
    setDbStatus(null)
    try {
      const res = await fetch('/api/admin/health')
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setDbStatus({ type: 'success', message: `Database answered a test query in ${data.latencyMs} ms.` })
      } else {
        setDbStatus({ type: 'error', message: data.error || 'The database check failed.' })
      }
    } catch {
      setDbStatus({ type: 'error', message: 'Could not reach the server to run the check.' })
    } finally {
      setTestingDb(false)
    }
  }

  const stripeBadge = !stripeInfo.loaded
    ? { label: '…', cls: 'bg-gray-100 text-gray-600' }
    : stripeInfo.isPlaceholder
    ? { label: 'NOT SET', cls: 'bg-amber-100 text-amber-800' }
    : stripeInfo.isLive
    ? { label: 'LIVE', cls: 'bg-emerald-100 text-emerald-800' }
    : { label: 'TEST', cls: 'bg-purple-100 text-purple-800' }

  const tabClass = (tab: Tab) =>
    `flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
      activeTab === tab ? 'border-[#C9A84C] text-[#0F1C3F]' : 'border-transparent text-gray-500 hover:text-gray-900'
    }`

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F1C3F]">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Platform rates, Stripe keys, email test, and service checks. Each section saves on its own.
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2">
        <button onClick={() => setActiveTab('rates')} className={tabClass('rates')}>
          <Sliders className="w-4 h-4" />
          Platform Rates
        </button>
        <button onClick={() => setActiveTab('payments')} className={tabClass('payments')}>
          <CreditCard className="w-4 h-4" />
          Payments & Stripe
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${stripeBadge.cls}`}>
            {stripeBadge.label}
          </span>
        </button>
        <button onClick={() => setActiveTab('email')} className={tabClass('email')}>
          <Mail className="w-4 h-4" />
          Email & SMTP
        </button>
        <button onClick={() => setActiveTab('system')} className={tabClass('system')}>
          <Server className="w-4 h-4" />
          System Checks
        </button>
      </div>

      {/* Tab: Platform rates */}
      {activeTab === 'rates' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-semibold text-gray-900">Platform Rates</h2>
            <p className="text-xs text-gray-500 mt-1">These values are saved to the database and used across the site.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>
                Joint vault rate, % per year — shown to members as variable, not guaranteed
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  disabled={!ratesLoaded}
                  value={rates.vaultApy}
                  onChange={(e) => setRates({ ...rates, vaultApy: e.target.value })}
                  className={`${inputClass} pr-8 disabled:bg-gray-50`}
                />
                <span className="absolute right-3.5 top-2.5 text-gray-400 font-medium">%</span>
              </div>
            </div>

            <div>
              <label className={labelClass}>Promotional cash match on deposits, % — 0 turns it off</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  disabled={!ratesLoaded}
                  value={rates.bonusMatchRate}
                  onChange={(e) => setRates({ ...rates, bonusMatchRate: e.target.value })}
                  className={`${inputClass} pr-8 disabled:bg-gray-50`}
                />
                <span className="absolute right-3.5 top-2.5 text-gray-400 font-medium">%</span>
              </div>
            </div>
          </div>

          <StatusBox status={ratesStatus} />

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleSaveRates}
              disabled={savingRates || !ratesLoaded}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F1C3F] text-white text-sm font-medium hover:bg-[#1a2c5e] transition-colors shadow-sm disabled:opacity-50"
            >
              {savingRates ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#C9A84C]" />
              ) : (
                <Save className="w-4 h-4 text-[#C9A84C]" />
              )}
              {savingRates ? 'Saving...' : 'Save Rates'}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Payments & Stripe */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Stripe API Keys & Webhook Secret</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Used to take card payments for deposits. Saved secrets are never shown here; leave a secret field
                  empty to keep the saved value.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${stripeBadge.cls}`}>
                  Mode: {stripeBadge.label}
                </span>
                <a
                  href="https://dashboard.stripe.com/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:border-[#C9A84C] flex items-center gap-1.5"
                >
                  <Lock size={12} />
                  Stripe keys ↗
                </a>
              </div>
            </div>

            <div className="space-y-5">
              {/* Secret Key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Stripe Secret Key (STRIPE_SECRET_KEY)
                  </label>
                  <span className="text-[11px] text-gray-500">
                    {stripeInfo.secretKeySaved ? 'A key is saved' : 'No key saved'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showStripeSecret ? 'text' : 'password'}
                    autoComplete="off"
                    value={stripe.secretKey}
                    onChange={(e) => setStripe((prev) => ({ ...prev, secretKey: e.target.value }))}
                    placeholder={stripeInfo.secretKeySaved ? 'Leave empty to keep the saved key' : 'sk_test_... or sk_live_...'}
                    className={`${inputClass} pr-11 font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowStripeSecret(!showStripeSecret)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showStripeSecret ? 'Hide key' : 'Show key'}
                  >
                    {showStripeSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Publishable Key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Stripe Publishable Key (STRIPE_PUBLISHABLE_KEY)
                  </label>
                  <span className="text-[11px] text-gray-400 font-mono">pk_test_ or pk_live_</span>
                </div>
                <input
                  type="text"
                  value={stripe.publishableKey}
                  onChange={(e) => setStripe((prev) => ({ ...prev, publishableKey: e.target.value }))}
                  placeholder="pk_test_... or pk_live_..."
                  className={`${inputClass} font-mono`}
                />
                <p className="text-[11px] text-gray-500 mt-1">Public key; safe to show in the browser.</p>
              </div>

              {/* Webhook Signing Secret */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Stripe Webhook Signing Secret (STRIPE_WEBHOOK_SECRET)
                  </label>
                  <span className="text-[11px] text-gray-500">
                    {stripeInfo.webhookSecretSaved ? 'A secret is saved' : 'No secret saved'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showWebhookSecret ? 'text' : 'password'}
                    autoComplete="off"
                    value={stripe.webhookSecret}
                    onChange={(e) => setStripe((prev) => ({ ...prev, webhookSecret: e.target.value }))}
                    placeholder={stripeInfo.webhookSecretSaved ? 'Leave empty to keep the saved secret' : 'whsec_...'}
                    className={`${inputClass} pr-11 font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showWebhookSecret ? 'Hide secret' : 'Show secret'}
                  >
                    {showWebhookSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Used by <code className="text-slate-800">/api/webhooks/stripe</code> to verify webhook signatures.
                </p>
              </div>
            </div>

            {/* Webhook Endpoint Box */}
            {stripeInfo.webhookUrl && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Server size={13} className="text-[#0F1C3F]" />
                    Webhook Endpoint URL
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
                  {stripeInfo.webhookUrl}
                </div>
                {stripeInfo.supportedEvents.length > 0 && (
                  <div className="text-[11px] text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">Events to select in Stripe webhook settings:</p>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {stripeInfo.supportedEvents.map((evt) => (
                        <span key={evt} className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-mono">
                          {evt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <StatusBox status={paymentStatus} />

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
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
                {testingPayment ? 'Testing...' : 'Test Stripe Key'}
              </button>

              <button
                type="button"
                onClick={handleSavePayment}
                disabled={savingPayment}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-gray-300 hover:border-[#C9A84C] text-gray-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {savingPayment ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save size={13} />}
                {savingPayment ? 'Saving...' : 'Save Stripe Keys'}
              </button>
            </div>
          </div>

          {/* Setup steps */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F1C3F]">Stripe Setup Steps</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
                <span className="font-bold text-[#0F1C3F] block">1. Get API keys</span>
                <p className="text-gray-600 text-[11px]">
                  Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer" className="text-blue-600 underline">Stripe API keys</a> and copy your secret and publishable keys.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
                <span className="font-bold text-[#0F1C3F] block">2. Add webhook</span>
                <p className="text-gray-600 text-[11px]">
                  In <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noreferrer" className="text-blue-600 underline">Stripe webhooks</a>, click <strong>Add endpoint</strong> and paste the webhook URL above.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
                <span className="font-bold text-[#0F1C3F] block">3. Copy signing secret</span>
                <p className="text-gray-600 text-[11px]">
                  Reveal the signing secret (<code className="text-slate-800">whsec_...</code>) and paste it into the field above.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
                <span className="font-bold text-[#0F1C3F] block">4. Save and test</span>
                <p className="text-gray-600 text-[11px]">
                  Click <strong>Save Stripe Keys</strong>, then <strong>Test Stripe Key</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Email & SMTP */}
      {activeTab === 'email' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-semibold text-gray-900">SMTP Test</h2>
            <p className="text-xs text-gray-500 mt-1">
              The site sends email using the SMTP_* environment variables
              {smtpConfigured === false && ' (currently not set)'}. Use this form to test settings; it does not save
              them. To change them, update the environment variables in your hosting provider and redeploy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>SMTP Server Hostname</label>
              <input
                type="text"
                value={emailSettings.host}
                onChange={(e) => setEmailSettings({ ...emailSettings, host: e.target.value })}
                placeholder="e.g. smtp.example.com"
                className={`${inputClass} font-mono`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>SMTP Port</label>
                <input
                  type="number"
                  value={emailSettings.port}
                  onChange={(e) => setEmailSettings({ ...emailSettings, port: e.target.value })}
                  placeholder="587"
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div>
                <label className={labelClass}>Encryption</label>
                <select
                  value={emailSettings.encryption}
                  onChange={(e) => setEmailSettings({ ...emailSettings, encryption: e.target.value })}
                  className={`${inputClass} bg-white`}
                >
                  <option value="STARTTLS">STARTTLS (Port 587)</option>
                  <option value="SSL/TLS">SSL / TLS (Port 465)</option>
                  <option value="NONE">None (Port 25)</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>SMTP Username</label>
              <input
                type="text"
                value={emailSettings.user}
                onChange={(e) => setEmailSettings({ ...emailSettings, user: e.target.value })}
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <label className={labelClass}>SMTP Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="off"
                  value={emailSettings.pass}
                  onChange={(e) => setEmailSettings({ ...emailSettings, pass: e.target.value })}
                  placeholder="Leave empty to use the saved password"
                  className={`${inputClass} pr-10 font-mono`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Sender Address (From)</label>
              <input
                type="email"
                value={emailSettings.fromEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <label className={labelClass}>Sender Name (From)</label>
              <input
                type="text"
                value={emailSettings.fromName}
                onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          {/* Test Panel */}
          <div className="pt-6 border-t border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-[#0F1C3F]">Run a Test</h3>
            <p className="text-xs text-gray-500">
              &quot;Check Connection&quot; connects and logs in without sending anything. &quot;Send Test Email&quot; also
              sends a short message to the address you enter.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="email"
                value={emailSettings.testRecipient}
                onChange={(e) => setEmailSettings({ ...emailSettings, testRecipient: e.target.value })}
                placeholder="Recipient email address"
                className="w-full sm:w-80 px-4 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-[#C9A84C] outline-none"
              />
              <button
                type="button"
                onClick={() => handleTestEmail(false)}
                disabled={testingEmail}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingEmail ? 'animate-spin' : ''}`} />
                Check Connection
              </button>
              <button
                type="button"
                onClick={() => handleTestEmail(true)}
                disabled={testingEmail || !emailSettings.testRecipient}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#0F1C3F] hover:bg-[#1a2c5e] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                <Send className="w-3.5 h-3.5 text-[#C9A84C]" />
                Send Test Email
              </button>
            </div>

            <StatusBox status={emailStatus} />
          </div>

          {/* Environment variable snippet */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">Environment variables for these settings:</span>
              <button
                type="button"
                onClick={handleCopyEnv}
                className="text-xs text-[#0F1C3F] hover:text-[#C9A84C] font-semibold flex items-center gap-1"
              >
                {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedEnv ? 'Copied!' : 'Copy Variables'}
              </button>
            </div>
            <pre className="p-3 bg-gray-900 text-gray-200 rounded-lg text-xs font-mono overflow-x-auto">{smtpEnvText}</pre>
          </div>
        </div>
      )}

      {/* Tab: System checks */}
      {activeTab === 'system' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-semibold text-gray-900">System Checks</h2>
            <p className="text-xs text-gray-500 mt-1">Run live checks against the services the site depends on.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Database */}
            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Database</h3>
                  <p className="text-xs text-gray-500">PostgreSQL</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestDatabase}
                disabled={testingDb}
                className="w-full text-xs font-medium py-2 px-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingDb ? 'animate-spin' : ''}`} />
                {testingDb ? 'Checking...' : 'Test Connection'}
              </button>
              <StatusBox status={dbStatus} />
            </div>

            {/* Stripe */}
            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-purple-100 text-purple-700">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Stripe</h3>
                    <p className="text-xs text-gray-500">Card payments</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stripeBadge.cls}`}>
                  {stripeBadge.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-[#0F1C3F] transition-colors"
              >
                Configure and test →
              </button>
            </div>

            {/* Email */}
            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Email</h3>
                    <p className="text-xs text-gray-500">SMTP</p>
                  </div>
                </div>
                {smtpConfigured !== null && (
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      smtpConfigured ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {smtpConfigured ? 'SET' : 'NOT SET'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('email')}
                className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-[#0F1C3F] transition-colors"
              >
                Test SMTP →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
