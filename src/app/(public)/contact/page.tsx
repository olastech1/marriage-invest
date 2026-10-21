'use client'

import { useState } from 'react'
import { Send, CheckCircle2, Mail, AlertCircle, Loader2 } from 'lucide-react'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please enter your name, email and a message.')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      })
      const data: { success?: boolean; error?: string } = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setError(data.error || 'Your message could not be sent. Please try again.')
        return
      }
      setSent(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSending(false)
    }
  }

  const resetForm = () => {
    setName('')
    setEmail('')
    setPhone('')
    setSubject('')
    setMessage('')
    setSent(false)
  }

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] disabled:opacity-60'

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <section className="bg-[#0F1C3F] py-16 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider block mb-2">
            Contact
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Get in Touch</h1>
          <p className="text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
            Send us a message and we&apos;ll reply by email.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            {sent ? (
              <div className="text-center py-10 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h2 className="text-lg font-bold text-[#0F1C3F]">Thanks — we&apos;ll reply by email</h2>
                <p className="text-sm text-slate-500">
                  Your message has been sent. We&apos;ll get back to you at <strong>{email}</strong>.
                </p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-2 text-sm font-semibold text-[#0F1C3F] hover:text-[#C9A84C]"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={sending}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={sending}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-phone" className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Phone <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="Your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={sending}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Subject <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      placeholder="What is this about?"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={sending}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={6}
                    maxLength={5000}
                    placeholder="How can we help?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={sending}
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2c5e] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  ) : (
                    <Send className="w-4 h-4 text-[#C9A84C]" aria-hidden />
                  )}
                  {sending ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Details */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 h-fit">
            <h2 className="text-sm font-bold text-[#0F1C3F]">Email</h2>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <Mail className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
              <a href="mailto:support@unionverify.com" className="hover:text-[#0F1C3F] hover:underline">
                support@unionverify.com
              </a>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Please don&apos;t send passwords or card details in a message.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
