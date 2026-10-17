'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Heart,
  Send,
  Volume2,
  VolumeX,
  PiggyBank,
  Award,
  Play,
  Pause,
  Shield,
  Clock,
  X,
  CheckCircle2,
  ArrowLeft,
  Check,
  UserCheck,
  RefreshCw,
  Sparkles,
  DollarSign,
  Bell,
  Phone,
  Mail,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ChannelType = 'spouse' | 'advisor'

export interface ChatMessage {
  id: string
  threadId?: string
  senderId?: string
  senderName: string
  sender?: 'user' | 'partner' | 'advisor'
  text: string
  timestamp: string
  read: boolean
  reactions?: Record<string, number>
  type?: 'text' | 'proposal' | 'love_note' | 'voice_memo' | 'certificate' | 'system_reminder' | 'reminder'
  proposalData?: {
    goalName: string
    amount: number
    split: string
    status: 'pending' | 'approved' | 'rejected'
    proposedBy?: string
    approvedBy?: string
  }
  voiceDuration?: string
  loveNoteTitle?: string
}

export default function MutualChatPage() {
  const { data: session } = useSession()

  // -------------------------------------------------------------------------
  // Partner Identities (Jane Doe <-> Marcus Vance)
  // -------------------------------------------------------------------------
  const [activeUserId, setActiveUserId] = useState<string>('usr_jane_doe')

  // Set initial identity from session or localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('union_invest_active_partner')
      if (saved === 'usr_marcus_vance' || saved === 'usr_jane_doe') {
        setActiveUserId(saved)
        return
      }
    }
    if (session?.user?.id === 'usr_marcus_vance' || session?.user?.name?.includes('Marcus')) {
      setActiveUserId('usr_marcus_vance')
    } else {
      setActiveUserId('usr_jane_doe')
    }
  }, [session])

  // Derive Current User & Partner Info
  const isMarcus = activeUserId === 'usr_marcus_vance'
  const currentUserName = isMarcus ? 'Marcus Vance' : (session?.user?.name || 'Jane Doe')
  const partnerName = isMarcus ? 'Jane Doe' : 'Marcus Vance'
  const partnerInitials = isMarcus ? 'JD' : 'MV'
  const userInitials = isMarcus ? 'MV' : 'JD'
  const advisorName = 'Beatrix Von Stauffen, CFP®'

  // Switch Active Partner Toggle
  const handleSwitchPartner = () => {
    const nextId = isMarcus ? 'usr_jane_doe' : 'usr_marcus_vance'
    setActiveUserId(nextId)
    if (typeof window !== 'undefined') {
      localStorage.setItem('union_invest_active_partner', nextId)
    }
  }

  // Channels & Active Thread
  const [activeChannel, setActiveChannel] = useState<ChannelType>('spouse')
  const [mobileTab, setMobileTab] = useState<'channels' | 'chat'>('chat')

  // Notification settings
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Message input state
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const [isApprovingId, setIsApprovingId] = useState<string | null>(null)

  // Interactive Modals
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [proposalGoal, setProposalGoal] = useState('Family Dream Home Down Payment')
  const [proposalAmount, setProposalAmount] = useState('250')
  const [showLoveNoteModal, setShowLoveNoteModal] = useState(false)
  const [loveNoteText, setLoveNoteText] = useState('Adding $150 to our Amalfi Coast fund today. Loving our life together! ❤️')
  const [loveNotePreset, setLoveNotePreset] = useState('Vacation Nest Egg')

  // Instant Spousal Deposit Nudge
  const [isNudging, setIsNudging] = useState(false)
  const [nudgeBanner, setNudgeBanner] = useState('')

  // Scroll anchor
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)
  const lastMessageCountRef = useRef<number>(0)

  // -------------------------------------------------------------------------
  // Chat Messages State
  // -------------------------------------------------------------------------
  const [spouseMessages, setSpouseMessages] = useState<ChatMessage[]>([])
  const [advisorMessages, setAdvisorMessages] = useState<ChatMessage[]>([
    {
      id: 'adv-1',
      senderName: advisorName,
      text: 'Welcome to Union Invest! I am your dedicated matrimonial wealth concierge at Union Invest Zurich. I oversee your 50/50 mutual portfolio and legal survivorship docket. Feel free to ask any questions about your vaults, dual-signature governance, or compound distributions.',
      timestamp: 'Today',
      read: true,
      type: 'text',
      reactions: { '🏛️': 1 },
    },
  ])

  // Play pleasant notification chime
  const playNotificationChime = useCallback(() => {
    if (!soundEnabled) return
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return
      const audioCtx = new AudioCtx()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12) // A5

      gain.gain.setValueAtTime(0.12, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35)

      osc.connect(gain)
      gain.connect(audioCtx.destination)

      osc.start()
      osc.stop(audioCtx.currentTime + 0.35)
    } catch {
      // Audio playback restrictions fallback
    }
  }, [soundEnabled])

  // -------------------------------------------------------------------------
  // Load & Synchronize Messages from API
  // -------------------------------------------------------------------------
  const fetchSpouseMessages = useCallback(async (isInitial = false) => {
    try {
      const res = await fetch('/api/chat?thread=spouse')
      const data = await res.json()
      if (data.success && Array.isArray(data.messages)) {
        if (!isInitial && data.messages.length > lastMessageCountRef.current) {
          const latest = data.messages[data.messages.length - 1]
          if (latest && latest.senderId !== activeUserId && latest.senderName !== currentUserName) {
            playNotificationChime()
          }
        }
        lastMessageCountRef.current = data.messages.length
        setSpouseMessages(data.messages)
      }
    } catch (err) {
      console.error('Failed to sync chat messages:', err)
    }
  }, [activeUserId, currentUserName, playNotificationChime])

  // Initial load + Polling interval (Every 1.5 seconds)
  useEffect(() => {
    fetchSpouseMessages(true)

    const pollInterval = setInterval(() => {
      fetchSpouseMessages(false)
    }, 1500)

    // Cross-tab real-time broadcast channel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('union_invest_chat')
      broadcastChannelRef.current = channel
      channel.onmessage = () => {
        fetchSpouseMessages(false)
      }
    }

    return () => {
      clearInterval(pollInterval)
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close()
      }
    }
  }, [fetchSpouseMessages])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [spouseMessages, advisorMessages, isTyping])

  // -------------------------------------------------------------------------
  // Send Message (Spouse or Advisor)
  // -------------------------------------------------------------------------
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim()) return

    const messageText = inputText.trim()
    setInputText('')

    if (activeChannel === 'spouse') {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            threadId: 'spouse',
            text: messageText,
            senderId: activeUserId,
            senderName: currentUserName,
            type: 'text',
          }),
        })
        const data = await res.json()
        if (data.success && data.message) {
          setSpouseMessages((prev) => [...prev, data.message])
          lastMessageCountRef.current += 1
          broadcastChannelRef.current?.postMessage({ type: 'NEW_MESSAGE' })
        }
      } catch (err) {
        console.error('Failed to send message:', err)
      }
    } else {
      // Advisor Channel
      const newAdvisorMsg: ChatMessage = {
        id: `adv-user-${Date.now()}`,
        senderName: currentUserName,
        text: messageText,
        timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
        read: false,
        type: 'text',
      }
      setAdvisorMessages((prev) => [...prev, newAdvisorMsg])

      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        const advisorReply: ChatMessage = {
          id: `adv-reply-${Date.now()}`,
          senderName: advisorName,
          text: `Thank you for reaching out, ${currentUserName}. I have recorded this inquiry on your Zurich Matrimonial Wealth file. Under Swiss fiduciary protocol, both ${currentUserName} and ${partnerName} maintain equal governance rights.`,
          timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
          read: true,
          type: 'text',
        }
        setAdvisorMessages((prev) => [...prev, advisorReply])
        playNotificationChime()
      }, 1200)
    }
  }

  // -------------------------------------------------------------------------
  // Send Instant Spousal Deposit Nudge
  // -------------------------------------------------------------------------
  const handleSendInstantNudge = async () => {
    setIsNudging(true)
    try {
      const res = await fetch('/api/savings/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_now',
          amount: 500,
          targetPartnerName: partnerName,
          targetEmail: isMarcus ? 'jane.doe@unioninvest.com' : 'marcus.vance@unioninvest.com',
          vaultName: `${currentUserName} & ${partnerName} Spousal Contribution`,
          note: `Hey ${partnerName}, sending a deposit reminder to keep our joint compounding vault growing! ❤️`,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setNudgeBanner(`✓ Deposit reminder dispatched to ${partnerName} via Email, Notification, and Couple Chat!`)
        fetchSpouseMessages(false)
        setTimeout(() => setNudgeBanner(''), 4500)
      }
    } catch (err) {
      console.error('Failed to send instant nudge:', err)
    } finally {
      setIsNudging(false)
    }
  }

  // -------------------------------------------------------------------------
  // Interactive Partner Actions: Approve Proposal & Match
  // -------------------------------------------------------------------------
  const handleApproveProposal = async (msgId: string) => {
    setIsApprovingId(msgId)
    try {
      const res = await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: msgId,
          action: 'approve_proposal',
          approvedBy: currentUserName,
          partnerName: currentUserName,
        }),
      })
      const data = await res.json()
      if (data.success) {
        playNotificationChime()
        fetchSpouseMessages(false)
        broadcastChannelRef.current?.postMessage({ type: 'PROPOSAL_APPROVED' })
      }
    } catch (err) {
      console.error('Failed to approve proposal:', err)
    } finally {
      setIsApprovingId(null)
    }
  }

  // -------------------------------------------------------------------------
  // Propose Shared Vault Deposit (Modal Submit)
  // -------------------------------------------------------------------------
  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(proposalAmount) || 250
    setShowProposalModal(false)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: 'spouse',
          senderId: activeUserId,
          senderName: currentUserName,
          type: 'proposal',
          text: `Hey ${partnerName}, I propose adding $${amountNum.toFixed(2)} to our ${proposalGoal}. Will you approve our 50/50 contribution?`,
          proposalData: {
            goalName: proposalGoal,
            amount: amountNum,
            split: `50/50 Split ($${(amountNum / 2).toFixed(2)} each)`,
            status: 'pending',
            proposedBy: currentUserName,
          },
        }),
      })
      const data = await res.json()
      if (data.success && data.message) {
        setSpouseMessages((prev) => [...prev, data.message])
        lastMessageCountRef.current += 1
        broadcastChannelRef.current?.postMessage({ type: 'NEW_PROPOSAL' })
      }
    } catch (err) {
      console.error('Failed to create proposal:', err)
    }
  }

  // -------------------------------------------------------------------------
  // Send Matrimonial Love Note (Modal Submit)
  // -------------------------------------------------------------------------
  const handleSendLoveNote = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowLoveNoteModal(false)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: 'spouse',
          senderId: activeUserId,
          senderName: currentUserName,
          type: 'love_note',
          text: loveNoteText,
          loveNoteTitle: loveNotePreset,
        }),
      })
      const data = await res.json()
      if (data.success && data.message) {
        setSpouseMessages((prev) => [...prev, data.message])
        lastMessageCountRef.current += 1
        broadcastChannelRef.current?.postMessage({ type: 'NEW_LOVE_NOTE' })
      }
    } catch (err) {
      console.error('Failed to send love note:', err)
    }
  }

  // -------------------------------------------------------------------------
  // Emoji Reaction
  // -------------------------------------------------------------------------
  const handleToggleReaction = async (msgId: string, emoji: string) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: msgId,
          action: 'react',
          reaction: emoji,
        }),
      })
      const data = await res.json()
      if (data.success) {
        fetchSpouseMessages(false)
        broadcastChannelRef.current?.postMessage({ type: 'REACTION' })
      }
    } catch (err) {
      console.error('Failed to toggle reaction:', err)
    }
  }

  const currentMessages = activeChannel === 'spouse' ? spouseMessages : advisorMessages

  return (
    <div className="h-[calc(100dvh-5.5rem)] lg:h-[calc(100vh-5.5rem)] flex flex-col min-w-0 max-w-7xl mx-auto">
      {/* ── PARTNER IDENTITY & NOTIFICATION HEADER ── */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 mb-2 border-b border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard"
            className="p-1.5 -ml-1 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-base sm:text-lg font-black text-[#0F1C3F] tracking-tight">
              Matrimonial Real-Time Chat
            </h1>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
            Live Synchronized
          </span>
        </div>

        {/* ── INTERACTIVE PARTNER SWITCHER PILL ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs shadow-2xs">
            <UserCheck className="w-3.5 h-3.5 text-[#C9A84C]" />
            <span className="text-gray-500 text-[11px]">Chatting as:</span>
            <strong className="text-[#0F1C3F] font-bold">{currentUserName}</strong>
            <button
              type="button"
              onClick={handleSwitchPartner}
              className="ml-1 text-[11px] font-bold text-[#C9A84C] hover:text-[#b3933e] underline cursor-pointer flex items-center gap-0.5"
              title={`Switch perspective to test as ${partnerName}`}
            >
              ⇄ Switch to {partnerName}
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              soundEnabled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}
            title="Toggle notification chime"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{soundEnabled ? 'Chime Active' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {/* ── MAIN CHAT CANVAS ── */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xl overflow-hidden flex flex-col lg:flex-row relative">
        {/* ── LEFT SIDEBAR: THREADS & CHANNELS ── */}
        <div
          className={`w-full lg:w-80 xl:w-96 flex-shrink-0 border-r border-gray-100 bg-[#FCFBF7]/60 flex-col h-full ${
            mobileTab === 'channels' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="p-4 border-b border-gray-100 flex-shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-3">
              Encrypted Matrimonial Channels
            </span>

            <div className="space-y-2">
              {/* Channel 1: Married Partner */}
              <div
                onClick={() => {
                  setActiveChannel('spouse')
                  setMobileTab('chat')
                }}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-center gap-3 border ${
                  activeChannel === 'spouse'
                    ? 'bg-[#0F1C3F] text-white shadow-md border-transparent'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#C9A84C] to-[#ebd59b] text-[#0F1C3F] font-bold flex items-center justify-center text-sm shadow-sm">
                    {partnerInitials}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full ring-2 ring-emerald-400/30" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-sm font-bold truncate ${activeChannel === 'spouse' ? 'text-white' : 'text-[#0F1C3F]'}`}>
                      {partnerName} (Spouse)
                    </span>
                    <span className={`text-[10px] font-mono ${activeChannel === 'spouse' ? 'text-[#C9A84C]' : 'text-emerald-600 font-bold'}`}>
                      Online
                    </span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${activeChannel === 'spouse' ? 'text-gray-300' : 'text-gray-500'}`}>
                    {spouseMessages[spouseMessages.length - 1]?.text || 'Start chatting with your partner...'}
                  </p>
                </div>
              </div>

              {/* Channel 2: Zurich Wealth Concierge */}
              <div
                onClick={() => {
                  setActiveChannel('advisor')
                  setMobileTab('chat')
                }}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-center gap-3 border ${
                  activeChannel === 'advisor'
                    ? 'bg-[#0F1C3F] text-white shadow-md border-transparent'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-[#1b2b52] text-[#C9A84C] font-bold flex items-center justify-center text-sm shadow-sm border border-[#C9A84C]/40">
                    <Shield className="w-5 h-5 text-[#C9A84C]" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-sm font-bold truncate ${activeChannel === 'advisor' ? 'text-white' : 'text-[#0F1C3F]'}`}>
                      Zurich Wealth Concierge
                    </span>
                    <span className={`text-[10px] font-mono ${activeChannel === 'advisor' ? 'text-[#C9A84C]' : 'text-gray-400'}`}>
                      24/7 Desk
                    </span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${activeChannel === 'advisor' ? 'text-gray-300' : 'text-gray-500'}`}>
                    {advisorMessages[advisorMessages.length - 1]?.text || 'Beatrix Von Stauffen'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Spousal Contact Card */}
          <div className="p-4 flex-1 flex flex-col justify-end space-y-3">
            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0F1C3F] flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#C9A84C]" />
                  Verified Spouse Contact
                </span>
                <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                  Online
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] text-gray-600">
                <div className="font-bold text-gray-900">{partnerName}</div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Mail className="w-3 h-3 text-[#C9A84C] flex-shrink-0" />
                  <span className="truncate">{isMarcus ? 'jane.doe@unioninvest.com' : 'marcus.vance@unioninvest.com'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Phone className="w-3 h-3 text-[#C9A84C] flex-shrink-0" />
                  <span>{isMarcus ? '+1 (555) 349-8821' : '+1 (555) 782-9940'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSendInstantNudge}
                disabled={isNudging}
                className="w-full py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] transition-colors border border-amber-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Bell className="w-3.5 h-3.5 text-amber-600" />
                <span>{isNudging ? 'Dispatching Nudge...' : 'Send Deposit Nudge'}</span>
              </button>
            </div>

            {/* Matrimonial Covenant Snapshot Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0F1C3F]/5 to-[#C9A84C]/10 border border-[#C9A84C]/30 text-xs text-gray-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0F1C3F] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#C9A84C]" />
                  Covenant Status
                </span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Both spouses hold 50/50 mutual beneficial rights with instant notification triggers for all deposits and chats.
              </p>
              <div className="pt-1 flex items-center justify-between text-[11px] font-mono">
                <span className="text-gray-500">Registry Seal:</span>
                <strong className="text-[#0F1C3F]">CH-MIC-2026-98420</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT AREA: ACTIVE CHAT THREAD ── */}
        <div
          className={`flex-1 min-w-0 flex-col h-full bg-white ${
            mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Thread Header */}
          <div className="px-4 sm:px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-white/90 backdrop-blur-sm sticky top-0 z-10 flex-shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileTab('channels')}
                className="lg:hidden p-2 -ml-1 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 flex items-center gap-1 text-xs font-bold transition-colors"
                title="Back to Channels"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-[11px] hidden xs:inline">Channels</span>
              </button>

              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#0F1C3F] to-[#24376b] text-[#C9A84C] font-bold flex items-center justify-center text-xs sm:text-sm shadow-sm flex-shrink-0">
                {activeChannel === 'spouse' ? partnerInitials : <Shield className="w-5 h-5 text-[#C9A84C]" />}
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-[#0F1C3F] flex items-center gap-2 truncate">
                  <span className="truncate">{activeChannel === 'spouse' ? `${partnerName} (Spouse)` : advisorName}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                </h3>
                <span className="text-[10px] sm:text-[11px] text-gray-400 block truncate">
                  {activeChannel === 'spouse'
                    ? `Encrypted Matrimonial Line · ${currentUserName} & ${partnerName}`
                    : 'Senior Matrimonial Wealth Manager'}
                </span>
              </div>
            </div>

            {/* Quick action triggers */}
            {activeChannel === 'spouse' && (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <button
                  onClick={handleSendInstantNudge}
                  disabled={isNudging}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors border border-amber-200 disabled:opacity-50"
                  title="Send instant deposit reminder to spouse via Email, Notification, and Chat"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden xs:inline">{isNudging ? 'Nudging...' : 'Deposit Nudge'}</span>
                  <span className="xs:hidden">Nudge</span>
                </button>
                <button
                  onClick={() => setShowProposalModal(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-[#C9A84C]/15 text-[#0F1C3F] hover:bg-[#C9A84C]/25 transition-colors border border-[#C9A84C]/30"
                >
                  <PiggyBank className="w-3.5 h-3.5 text-[#C9A84C]" />
                  <span className="hidden xs:inline">Propose Deposit</span>
                  <span className="xs:hidden">Deposit</span>
                </button>
                <button
                  onClick={() => setShowLoveNoteModal(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden xs:inline">Love Note</span>
                  <span className="xs:hidden">Note</span>
                </button>
              </div>
            )}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/50">
            {/* Instant Nudge Feedback Banner */}
            {nudgeBanner && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in-50 slide-in-from-top-2 duration-200 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{nudgeBanner}</span>
              </div>
            )}

            {/* Encryption Notice */}
            <div className="text-center my-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-[10px] text-gray-500 shadow-xs">
                <Shield className="w-3 h-3 text-[#C9A84C]" />
                End-to-End Encrypted Matrimonial Line · Direct Two-Way Communication
              </span>
            </div>

            {currentMessages.length === 0 && (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0F1C3F]/5 border border-[#0F1C3F]/10 flex items-center justify-center mx-auto text-[#C9A84C]">
                  {activeChannel === 'spouse' ? <Heart className="w-6 h-6 text-rose-500 fill-rose-500/20" /> : <Shield className="w-6 h-6 text-[#C9A84C]" />}
                </div>
                <h4 className="text-sm font-bold text-[#0F1C3F]">
                  {activeChannel === 'spouse' ? `Start Your Matrimonial Chat with ${partnerName}` : 'Matrimonial Wealth Concierge Desk'}
                </h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                  {activeChannel === 'spouse'
                    ? 'Propose shared deposits, send mutual love notes, or discuss your joint financial goals in real time.'
                    : 'Your dedicated advisor Beatrix Von Stauffen is on standby to assist with your portfolio and covenants.'}
                </p>
              </div>
            )}

            {currentMessages.map((msg) => {
              // Determine if message belongs to current user
              const isMe = msg.senderId
                ? msg.senderId === activeUserId
                : (msg.senderName === currentUserName || msg.sender === 'user')

              const isPartnerProposal = msg.type === 'proposal' && !isMe

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                >
                  <div className="flex items-baseline gap-2 mb-1 px-1">
                    <span className="text-[11px] font-bold text-gray-500">
                      {isMe ? `${currentUserName} (You)` : msg.senderName}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">{msg.timestamp}</span>
                  </div>

                  {/* Message Bubble Rendering */}
                  <div className="max-w-[88%] sm:max-w-[75%] relative">
                    {/* STANDARD TEXT */}
                    {(!msg.type || msg.type === 'text') && (
                      <div
                        className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-[#0F1C3F] text-white rounded-tr-none'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}

                    {/* INTERACTIVE PROPOSAL CARD */}
                    {msg.type === 'proposal' && msg.proposalData && (
                      <div className="p-4 rounded-2xl bg-white border-2 border-[#C9A84C] shadow-lg text-xs space-y-3 min-w-[270px] sm:min-w-[340px]">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9A84C] flex items-center gap-1.5">
                            <PiggyBank className="w-4 h-4 text-[#C9A84C]" />
                            Shared Deposit Proposal
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              msg.proposalData.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}
                          >
                            {msg.proposalData.status === 'approved' ? '✓ Approved & Funded' : 'Awaiting Consent'}
                          </span>
                        </div>

                        <div>
                          <span className="text-gray-500 block text-[11px]">Vault Destination</span>
                          <strong className="text-[#0F1C3F] text-sm block">{msg.proposalData.goalName}</strong>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-xl">
                          <div>
                            <span className="text-gray-400 block text-[10px]">Total Contribution</span>
                            <span className="text-base font-bold text-[#0F1C3F]">
                              ${Number(msg.proposalData.amount).toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px]">Split Ratio</span>
                            <span className="text-xs font-semibold text-emerald-700">
                              {msg.proposalData.split}
                            </span>
                          </div>
                        </div>

                        {/* Proposal Actions */}
                        {msg.proposalData.status === 'pending' ? (
                          isPartnerProposal ? (
                            <button
                              onClick={() => handleApproveProposal(msg.id)}
                              disabled={isApprovingId === msg.id}
                              className="w-full py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {isApprovingId === msg.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              <span>Approve & Match Deposit (${(Number(msg.proposalData.amount) / 2).toFixed(2)})</span>
                            </button>
                          ) : (
                            <div className="p-2 rounded-lg bg-amber-50 text-amber-800 text-[11px] text-center font-medium border border-amber-200">
                              ⏳ Waiting for {partnerName} to approve & match deposit
                            </div>
                          )
                        ) : (
                          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] text-center font-semibold flex items-center justify-center gap-1.5 border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Approved by Both Partners · Vault Updated
                          </div>
                        )}
                      </div>
                    )}

                    {/* OFFICIAL SYSTEM DEPOSIT REMINDER CARD */}
                    {(msg.type === 'system_reminder' || msg.type === 'reminder') && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0F1C3F] via-[#162752] to-[#0F1C3F] text-white border-2 border-[#C9A84C] shadow-xl text-xs space-y-3 min-w-[280px] sm:min-w-[340px]">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-[#C9A84C] flex items-center gap-1.5">
                            <Bell className="w-4 h-4 text-[#C9A84C] animate-bounce" />
                            Official System Deposit Reminder
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30">
                            Covenant Priority
                          </span>
                        </div>

                        <p className="text-xs text-slate-200 leading-relaxed font-medium">
                          {msg.text}
                        </p>

                        <div className="p-3 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Target Deposit</span>
                            <span className="text-base font-black text-[#C9A84C]">
                              ${Number(msg.proposalData?.amount || 500).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Compounding</span>
                            <span className="text-xs font-bold text-emerald-400">6.8% APY Active</span>
                          </div>
                        </div>

                        <div className="pt-1">
                          <Link
                            href={`/save?amount=${msg.proposalData?.amount || 500}&target=joint`}
                            className="w-full py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Go to Vault & Deposit ${Number(msg.proposalData?.amount || 500).toLocaleString()} ↗</span>
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* MATRIMONIAL LOVE NOTE */}
                    {msg.type === 'love_note' && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 border border-rose-200 shadow-md text-xs space-y-2 min-w-[250px]">
                        <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs uppercase tracking-wider">
                          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                          <span>{msg.loveNoteTitle || 'Matrimonial Love Note'}</span>
                        </div>
                        <p className="text-sm font-serif italic text-gray-800 leading-relaxed">
                          &ldquo;{msg.text}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* CERTIFICATE SEAL NOTICE */}
                    {msg.type === 'certificate' && (
                      <div className="p-4 rounded-2xl bg-white border border-[#C9A84C]/40 shadow-md text-xs space-y-2 min-w-[250px]">
                        <div className="flex items-center gap-2 text-[#C9A84C] font-bold">
                          <Award className="w-4 h-4" />
                          <span>Official Matrimonial Seal</span>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">{msg.text}</p>
                        <Link
                          href="/certificate"
                          className="inline-flex items-center gap-1 text-[11px] text-[#0F1C3F] font-bold hover:underline"
                        >
                          View Official Certificate ↗
                        </Link>
                      </div>
                    )}

                    {/* VOICE MEMO SIMULATOR */}
                    {msg.type === 'voice_memo' && (
                      <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center gap-3 min-w-[220px]">
                        <button
                          onClick={() => setPlayingVoiceId(playingVoiceId === msg.id ? null : msg.id)}
                          className="w-9 h-9 rounded-full bg-[#0F1C3F] text-[#C9A84C] flex items-center justify-center flex-shrink-0 shadow-sm cursor-pointer"
                        >
                          {playingVoiceId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-gray-800 block truncate">{msg.text}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{msg.voiceDuration || '0:34'}</span>
                        </div>
                      </div>
                    )}

                    {/* Reactions Display */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {Object.entries(msg.reactions).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-gray-200 text-xs shadow-2xs hover:bg-gray-50 transition-colors"
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px] font-bold text-gray-600">{count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-gray-400 italic py-1">
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-ping" />
                <span>{activeChannel === 'spouse' ? `${partnerName} is typing…` : 'Advisor is typing…'}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Chips */}
          <div className="px-4 py-2 border-t border-gray-100 bg-white flex items-center gap-2 overflow-x-auto text-xs no-scrollbar flex-shrink-0">
            <span className="text-[10px] uppercase font-bold text-gray-400 flex-shrink-0">
              Quick:
            </span>
            {[
              'Approved, let’s deposit! 💰',
              'Love this goal ❤️',
              'Checking our savings vault now 📊',
              'I’ll match 50% tonight 💍',
              'Let’s consult our Zurich advisor 🏛️',
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => setInputText(chip)}
                className="flex-shrink-0 px-2.5 py-1 rounded-full bg-gray-100 hover:bg-[#C9A84C]/20 hover:text-[#0F1C3F] text-gray-600 text-[11px] font-medium transition-colors cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Message Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 border-t border-gray-200 bg-white flex items-center gap-2 sm:gap-3 flex-shrink-0"
          >
            {activeChannel === 'spouse' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowProposalModal(true)}
                  className="p-2 sm:p-2.5 rounded-xl text-gray-500 hover:text-[#C9A84C] hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Propose Joint Deposit"
                >
                  <PiggyBank className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoveNoteModal(true)}
                  className="p-2 sm:p-2.5 rounded-xl text-gray-500 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Send Matrimonial Love Note"
                >
                  <Heart className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  activeChannel === 'spouse'
                    ? `Message ${partnerName}… (instant mutual sync)`
                    : 'Ask your Zurich wealth concierge…'
                }
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent bg-gray-50/50"
              />
            </div>

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-3 rounded-2xl bg-[#0F1C3F] hover:bg-[#1a2c5e] text-white disabled:opacity-40 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="hidden sm:inline text-xs font-bold">Send</span>
              <Send className="w-4 h-4 text-[#C9A84C]" />
            </button>
          </form>
        </div>
      </div>

      {/* ── MODAL 1: PROPOSE SHARED DEPOSIT ── */}
      {showProposalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/20 flex items-center justify-center">
                  <PiggyBank className="w-4 h-4 text-[#C9A84C]" />
                </div>
                <h3 className="text-base font-bold text-[#0F1C3F]">Propose Shared Vault Deposit</h3>
              </div>
              <button
                onClick={() => setShowProposalModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Destination Matrimonial Vault
                </label>
                <select
                  value={proposalGoal}
                  onChange={(e) => setProposalGoal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#C9A84C] focus:outline-none bg-white"
                >
                  <option value="Family Dream Home Down Payment">Family Dream Home Down Payment</option>
                  <option value="First Baby & Education Nest Egg">First Baby & Education Nest Egg</option>
                  <option value="10-Year Anniversary Trip (Amalfi Coast)">10-Year Anniversary Trip (Amalfi Coast)</option>
                  <option value="Joint Emergency Liquid Buffer">Joint Emergency Liquid Buffer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Total Contribution Amount ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    required
                    value={proposalAmount}
                    onChange={(e) => setProposalAmount(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold focus:ring-2 focus:ring-[#C9A84C] focus:outline-none"
                  />
                </div>
              </div>

              {/* Split Breakdown */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Your Share (50%):</span>
                  <strong className="text-[#0F1C3F]">${((parseFloat(proposalAmount) || 0) / 2).toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{partnerName}&apos;s Share (50%):</span>
                  <strong className="text-[#0F1C3F]">${((parseFloat(proposalAmount) || 0) / 2).toFixed(2)}</strong>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-xs tracking-wide transition-all shadow-md cursor-pointer"
              >
                Send Proposal to {partnerName}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: SEND MATRIMONIAL LOVE NOTE ── */}
      {showLoveNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
                </div>
                <h3 className="text-base font-bold text-[#0F1C3F]">Send Matrimonial Love Note</h3>
              </div>
              <button
                onClick={() => setShowLoveNoteModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendLoveNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Card Category
                </label>
                <select
                  value={loveNotePreset}
                  onChange={(e) => setLoveNotePreset(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#C9A84C] focus:outline-none bg-white"
                >
                  <option value="Vacation Nest Egg">Vacation Nest Egg Voucher</option>
                  <option value="Anniversary Love Voucher">Anniversary Love Voucher</option>
                  <option value="Family Home Milestone">Family Home Milestone</option>
                  <option value="Romantic Matrimonial Covenant">Romantic Matrimonial Covenant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Personal Love Message
                </label>
                <textarea
                  rows={3}
                  required
                  value={loveNoteText}
                  onChange={(e) => setLoveNoteText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-300 text-xs font-serif leading-relaxed focus:ring-2 focus:ring-[#C9A84C] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs tracking-wide transition-all shadow-md cursor-pointer"
              >
                Post Love Note to {partnerName}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
