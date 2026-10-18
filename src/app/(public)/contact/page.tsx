'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, ShieldCheck, Send, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'INVESTMENT',
    subject: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry')
      }

      setStatus('success')
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: 'INVESTMENT',
        subject: '',
        message: '',
      })
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err.message || 'An error occurred. Please try again.')
    }
  }

  return (
    <div className="bg-white min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider block mb-2">
            Investor Support & Inquiries
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F1C3F] mb-4">
            Contact Union Verify
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Whether you have questions regarding official offer documents, joint account onboarding, or USD distribution schedules, our dedicated team is here to assist.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left 2 Cols: Contact Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-[#0F1C3F] mb-6">
              Submit an Official Inquiry
            </h2>

            {status === 'success' ? (
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-emerald-900 mb-1">Inquiry Dispatched Successfully</h3>
                <p className="text-xs text-emerald-700 max-w-md mx-auto">
                  Thank you for reaching out. An investor relations officer will review your ticket and respond within 24 business hours.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-4 px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800"
                >
                  Submit Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {status === 'error' && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Amélie & Sebastian Laurent"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent outline-none text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="investor@example.com"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent outline-none text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 012-3456"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent outline-none text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Department / Topic *
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent outline-none text-gray-900 bg-white"
                    >
                      <option value="INVESTMENT">Investment Opportunities & Terms</option>
                      <option value="COMPLIANCE">Legal, KYC & Regulatory Compliance</option>
                      <option value="FINANCE">USD Payments, Ledger & Withdrawals</option>
                      <option value="GENERAL">General Investor Support</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Subject Line *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Question regarding Series A Offer Document"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent outline-none text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Detailed Message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Please include any relevant investment reference or context..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent outline-none text-gray-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="px-8 py-3 rounded-xl bg-[#0F1C3F] hover:bg-[#162c5e] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-[#C9A84C]" />
                  {status === 'submitting' ? 'Transmitting Ticket...' : 'Send Inquiry'}
                </button>
              </form>
            )}
          </div>

          {/* Right Col: Operating Credentials & Office */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-[#0F1C3F] mb-4">
                Headquarters & Corporate Desk
              </h3>
              <div className="space-y-4 text-xs text-gray-600">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Union Verify Fiduciary AG</strong><br />
                    Bahnhofstrasse 45, 8001 Zurich, Switzerland<br />
                    <span className="text-gray-400">UK Fiduciary Desk: 30 St Mary Axe, City of London, EC3A 8EP</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                  <span>desk.zurich@unionverify.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                  <span>+41 44 214 8800 (Zurich) · +44 20 7946 0912 (London)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                  <span>Mon–Fri: 08:30 – 17:30 CET / GMT</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0F1C3F]/5 rounded-2xl border border-[#0F1C3F]/10 p-6">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-[#C9A84C]" />
                <h4 className="text-xs font-bold text-[#0F1C3F]">Direct Response Guarantee</h4>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                All regulatory, compliance, and withdrawal escalation inquiries receive an initial documented response within 24 business hours from a certified investment representative.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
