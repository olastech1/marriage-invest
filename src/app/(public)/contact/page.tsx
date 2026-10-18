'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Sparkles,
  Heart,
  ShieldCheck,
  Award,
  PiggyBank,
  Gift,
  MapPin,
  Mail,
  Phone,
  Clock,
  ArrowRight,
  ExternalLink,
  User,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface ChatEntry {
  id: string
  senderId?: string
  senderName: string
  text: string
  timestamp: string
  type?: string
  proposalData?: {
    action?: {
      label: string
      href: string
      icon: string
    }
    suggestions?: Array<{
      id: string
      label: string
      prompt: string
    }>
  }
}

interface ConversationStarter {
  id: string
  icon: any
  badge: string
  title: string
  description: string
  prompt: string
  leadsTo: string
  color: string
  borderColor: string
}

const CONVERSATION_STARTERS: ConversationStarter[] = [
  {
    id: 'start_marriage',
    icon: Heart,
    badge: 'Popular',
    title: 'Get Married Online ($500)',
    description: 'Complete your online marriage application, invite partner to co-sign, and unlock joint investing.',
    prompt: 'We want to legally marry online and set up our joint 6.8% compounding savings vault.',
    leadsTo: 'Unlocks digital civil marriage & joint high-yield vault',
    color: 'bg-rose-50 text-rose-700',
    borderColor: 'border-rose-200 hover:border-rose-400',
  },
  {
    id: 'spousal_vault',
    icon: PiggyBank,
    badge: '6.8% APY',
    title: 'Joint Compounding Vault',
    description: 'Understand how 50/50 dual savings, daily compounding, and Rule 4.2 spousal match work.',
    prompt: 'How does the 50/50 spousal deposit matching rule and 6.8% APY compounding work?',
    leadsTo: 'Explains daily compounding & reciprocal matching',
    color: 'bg-amber-50 text-amber-800',
    borderColor: 'border-amber-200 hover:border-[#C9A84C]',
  },
  {
    id: 'wedding_registry',
    icon: Gift,
    badge: '0% Fees',
    title: 'Wedding Cash Registry',
    description: 'Contribute a cash gift directly to a couple’s honeymoon or home down payment fund.',
    prompt: 'I want to contribute a wedding gift to a couple\'s cash registry fund.',
    leadsTo: 'Direct cash contribution with custom dedication card',
    color: 'bg-emerald-50 text-emerald-800',
    borderColor: 'border-emerald-200 hover:border-emerald-400',
  },
  {
    id: 'verify_certificate',
    icon: Award,
    badge: 'Legal Seal',
    title: 'Verify Marriage Certificate',
    description: 'Validate an authenticated certificate reference number or inspect legal covenant seals.',
    prompt: 'I have a certificate docket number and want to verify its authenticity.',
    leadsTo: 'Authenticity lookup on official Union Verify registry',
    color: 'bg-purple-50 text-purple-800',
    borderColor: 'border-purple-200 hover:border-purple-400',
  },
  {
    id: 'member_bio',
    icon: User,
    badge: 'Social Link',
    title: 'Connect with a Member',
    description: 'Find a verified member through their public bio link and start a direct conversation.',
    prompt: 'I want to connect with a verified member through their public bio profile.',
    leadsTo: 'Direct social chat with verified profile badge',
    color: 'bg-indigo-50 text-indigo-800',
    borderColor: 'border-indigo-200 hover:border-indigo-400',
  },
]

export default function ContactPage() {
  // Live Chat State
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      id: 'seed-adv',
      senderName: 'Union Verify Support',
      text: 'Welcome to Union Verify! How can we help you today? Choose one of our quick conversation starters below, or send us a message directly.',
      timestamp: 'Active Now',
      type: 'advisor_response',
    },
  ])
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [showContactDetails, setShowContactDetails] = useState(false)

  // Optional Contact Details
  const [visitorName, setVisitorName] = useState('')
  const [visitorEmail, setVisitorEmail] = useState('')
  const [visitorPhone, setVisitorPhone] = useState('')

  // Traditional Ticket Toggle
  const [showTraditionalForm, setShowTraditionalForm] = useState(false)
  const [ticketStatus, setTicketStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [ticketError, setTicketError] = useState('')
  const [ticketDepartment, setTicketDepartment] = useState('INVESTMENT')
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketMessage, setTicketMessage] = useState('')

  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Load existing chat history from API on mount
  useEffect(() => {
    fetch('/api/contact')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages)
        }
      })
      .catch((err) => console.error('Failed to load contact chat:', err))
  }, [])

  // Auto scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle sending a message or conversation starter
  const handleSendMessage = async (textToSend?: string, starterId?: string) => {
    const content = textToSend || inputText.trim()
    if (!content || sending) return

    const now = new Date()
    const formattedTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(now)

    const optimisticUserMsg: ChatEntry = {
      id: `local-${Date.now()}`,
      senderName: visitorName || 'You',
      text: content,
      timestamp: formattedTime,
      type: 'user_message',
    }

    setMessages((prev) => [...prev, optimisticUserMsg])
    setInputText('')
    setSending(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: visitorName || 'Live Visitor',
          email: visitorEmail || '',
          phone: visitorPhone || '',
          message: content,
          starterId,
          department: starterId || 'GENERAL',
        }),
      })

      const data = await res.json()
      if (data.success && data.advisorMessage) {
        setMessages((prev) => [...prev, data.advisorMessage])
      }
    } catch (err) {
      console.error('Error sending chat message:', err)
    } finally {
      setSending(false)
    }
  }

  // Handle traditional formal ticket submission
  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTicketStatus('submitting')
    setTicketError('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: visitorName,
          email: visitorEmail,
          phone: visitorPhone,
          department: ticketDepartment,
          subject: ticketSubject,
          message: ticketMessage,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit ticket.')

      setTicketStatus('success')
      if (data.advisorMessage) {
        setMessages((prev) => [...prev, data.advisorMessage])
      }
      setTicketSubject('')
      setTicketMessage('')
    } catch (err: any) {
      setTicketStatus('error')
      setTicketError(err.message || 'Submission failed.')
    }
  }

  return (
    <div className="bg-white min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Page Header ── */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F1C3F]/5 border border-[#0F1C3F]/10 text-[#0F1C3F] text-xs font-bold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Concierge Desk · Connected to Chat System
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0F1C3F] tracking-tight">
            Connect Directly with Union Verify
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2 leading-relaxed">
            Start a conversation that leads directly to your goal — digital marriage, compounding savings, wedding gifts, or official legal verification. Simple, clear, and immediate.
          </p>
        </div>

        {/* ── Section 1: Simple & Easy Conversation Starters ── */}
        <div className="mb-12 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-[#0F1C3F] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C9A84C]" />
              Start a Conversation (Choose a Goal)
            </h2>
            <span className="text-xs text-gray-400">One-click immediate answer</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CONVERSATION_STARTERS.map((starter) => {
              const Icon = starter.icon
              return (
                <button
                  key={starter.id}
                  onClick={() => handleSendMessage(starter.prompt, starter.id)}
                  className={`p-4 rounded-2xl border text-left bg-white transition-all hover:shadow-md hover:-translate-y-0.5 group flex flex-col justify-between ${starter.borderColor}`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${starter.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 uppercase tracking-wide">
                        {starter.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#0F1C3F] group-hover:text-[#C9A84C] transition-colors">
                        {starter.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 leading-snug">
                        {starter.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-700 font-semibold truncate pr-2">
                      ✓ {starter.leadsTo}
                    </span>
                    <span className="text-[#0F1C3F] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5 flex-shrink-0">
                      Start <ArrowRight size={12} />
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Section 2: Live Chat Desk (Connected to Chat System) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-16">
          {/* Main 2 Cols: Live Interactive Chat Window */}
          <div className="lg:col-span-2 rounded-3xl border-2 border-[#0F1C3F]/15 bg-white shadow-xl overflow-hidden flex flex-col h-[650px] relative">
            {/* Chat Header */}
            <div className="px-5 py-4 bg-[#0F1C3F] text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C9A84C] to-[#ecd7a2] text-[#0F1C3F] font-black flex items-center justify-center text-sm shadow-md">
                    UV
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0F1C3F] rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Union Verify Support</h3>
                    <span className="text-[10px] font-semibold text-[#C9A84C] bg-white/10 px-2 py-0.5 rounded-full">
                      Live Support Desk
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online · Connected to Union Verify Live Chat System
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/chat"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                  title="Open in Fullscreen Mutual Chat Hub"
                >
                  <MessageSquare size={13} />
                  <span>Open Full Hub</span>
                </Link>
              </div>
            </div>

            {/* Optional Contact Details Drawer Toggle */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <button
                type="button"
                onClick={() => setShowContactDetails(!showContactDetails)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#0F1C3F] hover:text-[#C9A84C] transition-colors"
              >
                <span>{visitorName || visitorEmail ? `Chatting as: ${visitorName || visitorEmail}` : '+ Attach your name or email for follow-up'}</span>
                {showContactDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <span className="text-[11px] text-slate-400">Encrypted transmission</span>
            </div>

            {/* Expandable Contact Fields */}
            {showContactDetails && (
              <div className="p-4 bg-slate-100/70 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in slide-in-from-top-2 duration-150 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="e.g. Alex Sterling"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#C9A84C]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Email</label>
                  <input
                    type="email"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#C9A84C]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={visitorPhone}
                    onChange={(e) => setVisitorPhone(e.target.value)}
                    placeholder="+1 (555) 012-3456"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#C9A84C]"
                  />
                </div>
              </div>
            )}

            {/* Live Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
              {messages.map((m) => {
                const isAdvisor = m.senderId === 'advisor_zurich' || m.senderId === 'advisor_support' || m.senderName.includes('Support')
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isAdvisor ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[11px] font-bold text-slate-700">
                        {isAdvisor ? 'Union Verify Support' : m.senderName}
                      </span>
                      <span className="text-[10px] text-slate-400">{m.timestamp}</span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl max-w-[88%] text-xs leading-relaxed shadow-sm ${
                        isAdvisor
                          ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                          : 'bg-[#0F1C3F] text-white rounded-tr-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.text}</p>

                      {/* Actionable Button Recommended by Advisor */}
                      {isAdvisor && m.proposalData?.action && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                          <Link
                            href={m.proposalData.action.href}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F1C3F] text-[#C9A84C] font-bold text-xs hover:bg-[#1a2f64] shadow-sm transition-all"
                          >
                            <span>{m.proposalData.action.icon}</span>
                            <span>{m.proposalData.action.label}</span>
                            <ArrowRight size={13} />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {sending && (
                <div className="flex items-center gap-2 text-xs text-slate-400 pl-2">
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-[#C9A84C] rounded-full animate-spin" />
                  <span>Support is preparing your response…</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex-shrink-0">Ask:</span>
              {[
                'How does reciprocal matching work?',
                'What is needed to marry online?',
                'Can wedding guests gift cash?',
                'How do I find a member profile?',
              ].map((chip, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-[#C9A84C]/15 hover:text-[#0F1C3F] text-slate-600 text-[11px] font-medium transition-colors flex-shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2.5 flex-shrink-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your question or message here… (e.g. 'I want to ask about joint savings')"
                className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:bg-white text-slate-900 transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="px-5 py-2.5 rounded-xl bg-[#0F1C3F] text-white font-bold text-xs hover:bg-[#1a2f64] disabled:opacity-40 transition-colors flex items-center gap-2 shadow-sm flex-shrink-0"
              >
                <span>Send</span>
                <Send size={13} className="text-[#C9A84C]" />
              </button>
            </form>
          </div>

          {/* Right Col: Desk Information & Traditional Ticket Accordion */}
          <div className="space-y-6">
            {/* Headquarters Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-[#0F1C3F]/5 text-[#0F1C3F] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-[#C9A84C]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F1C3F]">Union Verify Support Team</h3>
                  <p className="text-[11px] text-slate-400">Available Monday – Friday</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-slate-600">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Union Verify</strong><br />
                    Digital Couples Investment Platform<br />
                    <span className="text-slate-400">Available to members worldwide</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                  <span>support@unionverify.com</span>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                  <span>Available via live chat 24/7</span>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                  <span>Mon–Fri: 09:00 – 18:00 UTC</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <Link
                  href="/community"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#C9A84C] text-[#0F1C3F] font-bold text-xs flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <User size={13} className="text-[#C9A84C]" />
                    <span>Browse Member Community</span>
                  </span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>

            {/* Official Written Ticket Accordion */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <button
                type="button"
                onClick={() => setShowTraditionalForm(!showTraditionalForm)}
                className="w-full flex items-center justify-between text-left text-sm font-bold text-[#0F1C3F]"
              >
                <span>Prefer to Submit an Official Ticket?</span>
                {showTraditionalForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showTraditionalForm && (
                <form onSubmit={handleTicketSubmit} className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
                  {ticketStatus === 'success' ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                      <p className="text-xs font-bold text-emerald-800">Official Ticket Logged in Chat System!</p>
                      <p className="text-[11px] text-emerald-700">Check the live chat stream on the left to review your ticket status and advisor reply.</p>
                    </div>
                  ) : (
                    <>
                      {ticketStatus === 'error' && (
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                          <AlertCircle size={14} />
                          <span>{ticketError}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Department</label>
                        <select
                          value={ticketDepartment}
                          onChange={(e) => setTicketDepartment(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
                        >
                          <option value="MARRIAGE">Marriage Registration</option>
                          <option value="SAVINGS">Compounding Savings & Reciprocation</option>
                          <option value="REGISTRY">Wedding Cash Registry</option>
                          <option value="CERTIFICATE">Certificate Verification</option>
                          <option value="GENERAL">General Investor Support</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Subject</label>
                        <input
                          type="text"
                          required
                          value={ticketSubject}
                          onChange={(e) => setTicketSubject(e.target.value)}
                          placeholder="e.g. Question on reciprocal matching rule"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Message</label>
                        <textarea
                          required
                          rows={3}
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                          placeholder="Please provide full details..."
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-800"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={ticketStatus === 'submitting'}
                        className="w-full py-2.5 rounded-xl bg-[#0F1C3F] text-white font-bold text-xs hover:bg-[#1a2f64] transition-colors"
                      >
                        {ticketStatus === 'submitting' ? 'Submitting to Chat Desk...' : 'Dispatch to Chat Desk'}
                      </button>
                    </>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
