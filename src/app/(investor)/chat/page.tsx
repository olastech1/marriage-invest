'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Heart,
  Send,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  Bell,
  Volume2,
  VolumeX,
  CreditCard,
  PiggyBank,
  Award,
  Sparkles,
  Play,
  Pause,
  MessageSquare,
  Shield,
  User,
  Users,
  Clock,
  ThumbsUp,
  X,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  Headphones,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ChannelType = 'spouse' | 'advisor'

export interface ChatReaction {
  emoji: string
  count: number
  users: string[]
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'partner' | 'advisor'
  senderName: string
  senderAvatar?: string
  text: string
  timestamp: string
  read: boolean
  reactions?: Record<string, number>
  type?: 'text' | 'proposal' | 'love_note' | 'voice_memo' | 'certificate'
  proposalData?: {
    goalName: string
    amount: number
    split: string
    status: 'pending' | 'approved'
  }
  voiceDuration?: string
  loveNoteTitle?: string
}

export default function MutualChatPage() {
  const { data: session } = useSession()
  const userName = session?.user?.name || 'Julian Sterling'
  const partnerName = 'Marcus Vance'
  const advisorName = 'Beatrix Von Stauffen, CFP®'

  // Channels & Active Thread
  const [activeChannel, setActiveChannel] = useState<ChannelType>('spouse')

  // Notification settings
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [inAppNotifEnabled, setInAppNotifEnabled] = useState(true)
  const [desktopNotifGranted, setDesktopNotifGranted] = useState(false)
  const [incomingToast, setIncomingToast] = useState<{
    id: string
    title: string
    body: string
    sender: string
    time: string
  } | null>(null)

  // Message input state
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)

  // Interactive Modals
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [proposalGoal, setProposalGoal] = useState('Family Dream Home Down Payment')
  const [proposalAmount, setProposalAmount] = useState('250')
  const [showLoveNoteModal, setShowLoveNoteModal] = useState(false)
  const [loveNoteText, setLoveNoteText] = useState('Adding $150 to our Amalfi Coast fund today. Loving our life together! ❤️')
  const [loveNotePreset, setLoveNotePreset] = useState('Vacation Nest Egg')

  // Scroll to bottom anchor
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // -------------------------------------------------------------------------
  // Initial Chat Messages for Spouse Channel
  // -------------------------------------------------------------------------
  const [spouseMessages, setSpouseMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'partner',
      senderName: partnerName,
      text: 'Good morning Julian! Did you see the monthly dividend payout landed in our Joint Vault?',
      timestamp: '9:15 AM',
      read: true,
      type: 'text',
      reactions: { '❤️': 1, '💰': 1 },
    },
    {
      id: 'msg-2',
      sender: 'user',
      senderName: userName,
      text: 'Yes! $85.00 from the Zurich Prime yield fund. That compound interest is really adding up.',
      timestamp: '9:18 AM',
      read: true,
      type: 'text',
      reactions: { '🥂': 1 },
    },
    {
      id: 'msg-3',
      sender: 'partner',
      senderName: partnerName,
      text: 'I just reviewed our Marriage Investment Certificate as well. Both our signatures look incredible with the gold embossed seal.',
      timestamp: '9:22 AM',
      read: true,
      type: 'certificate',
    },
    {
      id: 'msg-4',
      sender: 'partner',
      senderName: partnerName,
      text: 'Voice memo on our weekend savings plan',
      timestamp: '9:30 AM',
      read: true,
      type: 'voice_memo',
      voiceDuration: '0:34',
      reactions: { '❤️': 1 },
    },
    {
      id: 'msg-5',
      sender: 'partner',
      senderName: partnerName,
      text: 'Should we add another deposit to the Family Dream Home vault before the weekend rate lock?',
      timestamp: '9:45 AM',
      read: true,
      type: 'proposal',
      proposalData: {
        goalName: 'Family Dream Home Down Payment',
        amount: 250,
        split: '50/50 Split ($125 each)',
        status: 'pending',
      },
    },
  ])

  // -------------------------------------------------------------------------
  // Initial Chat Messages for Zurich Concierge Channel
  // -------------------------------------------------------------------------
  const [advisorMessages, setAdvisorMessages] = useState<ChatMessage[]>([
    {
      id: 'adv-1',
      sender: 'advisor',
      senderName: advisorName,
      text: 'Welcome Julian & Marcus! I am your dedicated matrimonial wealth concierge at Union Invest Zurich. I oversee your 50/50 mutual portfolio and legal survivorship docket.',
      timestamp: 'Yesterday',
      read: true,
      type: 'text',
      reactions: { '🏛️': 1 },
    },
    {
      id: 'adv-2',
      sender: 'user',
      senderName: userName,
      text: 'Thank you Beatrix. Could you confirm when our 6.8% compounding interest distributions process each month?',
      timestamp: 'Yesterday',
      read: true,
      type: 'text',
    },
    {
      id: 'adv-3',
      sender: 'advisor',
      senderName: advisorName,
      text: 'Interest distributions calculate daily and automatically credit to your liquid ledger on the 1st of each calendar month. Both spouses have equal withdrawal authorization.',
      timestamp: 'Yesterday',
      read: true,
      type: 'text',
      reactions: { '👍': 1 },
    },
  ])

  // Web Audio chime generator (crisp, pleasant, zero dependencies)
  const playNotificationChime = () => {
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
  }

  // Request browser desktop push permission
  const requestDesktopPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        setDesktopNotifGranted(true)
        new Notification('Union Invest Mutual Chat Enabled', {
          body: 'You will receive instant alerts when your spouse or advisor messages you.',
          icon: '/favicon.ico',
        })
      }
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setDesktopNotifGranted(true)
      }
    }
  }, [])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [spouseMessages, advisorMessages, isTyping])

  // Trigger incoming notification (Sound + In-App Toast + Browser Notification + DB Notification)
  const dispatchIncomingNotification = async (sender: string, text: string) => {
    playNotificationChime()

    if (inAppNotifEnabled) {
      const toastId = 'toast-' + Date.now()
      setIncomingToast({
        id: toastId,
        title: `New Message from ${sender}`,
        body: text,
        sender,
        time: 'Just now',
      })
      setTimeout(() => {
        setIncomingToast((prev) => (prev?.id === toastId ? null : prev))
      }, 5000)
    }

    if (desktopNotifGranted && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        new Notification(`Union Invest · ${sender}`, {
          body: text,
          icon: '/favicon.ico',
        })
      } catch {
        // Notification error fallback
      }
    }

    // Persist notification to backend DB
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `New Message from ${sender}`,
          message: text,
          link: '/chat',
          type: 'INFO',
        }),
      })
    } catch {
      // Offline fallback
    }
  }

  // Handle User Send Message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim()) return

    const newMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      senderName: userName,
      text: inputText.trim(),
      timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
      read: false,
      type: 'text',
    }

    if (activeChannel === 'spouse') {
      setSpouseMessages((prev) => [...prev, newMsg])
      const userQuery = inputText
      setInputText('')

      // Simulate realistic partner reply after a realistic delay
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        let replyText = 'That sounds fantastic! Let’s do it. ❤️'
        const lower = userQuery.toLowerCase()

        if (lower.includes('deposit') || lower.includes('money') || lower.includes('save') || lower.includes('fund')) {
          replyText = 'Agreed! I will match your deposit 50/50 from my side right now. 💰'
        } else if (lower.includes('love') || lower.includes('heart') || lower.includes('kiss') || lower.includes('babe')) {
          replyText = 'I love you so much! Truly grateful we are building our future and marriage as equal partners. 💍'
        } else if (lower.includes('certificate') || lower.includes('sign') || lower.includes('wedding')) {
          replyText = 'Our digital covenant is officially locked in the registry. Happy to have our survivorship protected. 📜'
        } else if (lower.includes('trip') || lower.includes('amalfi') || lower.includes('vacation')) {
          replyText = 'Packing my bags already! Let’s make sure we allocate our next yield bonus to that vault. ✈️'
        }

        const partnerReply: ChatMessage = {
          id: `ptn-${Date.now()}`,
          sender: 'partner',
          senderName: partnerName,
          text: replyText,
          timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
          read: true,
          type: 'text',
          reactions: { '❤️': 1 },
        }

        setSpouseMessages((prev) => [...prev, partnerReply])
        dispatchIncomingNotification(partnerName, replyText)
      }, 1600)
    } else {
      // Advisor Channel
      setAdvisorMessages((prev) => [...prev, newMsg])
      setInputText('')

      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        const advisorReply: ChatMessage = {
          id: `adv-${Date.now()}`,
          sender: 'advisor',
          senderName: advisorName,
          text: 'Thank you for reaching out, Julian. I have noted this request on your Zurich fiduciary file. Both partners will receive confirmation documentation shortly.',
          timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
          read: true,
          type: 'text',
        }
        setAdvisorMessages((prev) => [...prev, advisorReply])
        dispatchIncomingNotification(advisorName, advisorReply.text)
      }, 1500)
    }
  }

  // Quick Reaction Toggle on Message
  const handleToggleReaction = (msgId: string, emoji: string) => {
    const updateList = (list: ChatMessage[]) =>
      list.map((msg) => {
        if (msg.id !== msgId) return msg
        const reactions = { ...(msg.reactions || {}) }
        reactions[emoji] = (reactions[emoji] || 0) + 1
        return { ...msg, reactions }
      })

    if (activeChannel === 'spouse') {
      setSpouseMessages(updateList)
    } else {
      setAdvisorMessages(updateList)
    }
  }

  // Handle Approve Deposit Proposal in Chat
  const handleApproveProposal = (msgId: string) => {
    setSpouseMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId || !msg.proposalData) return msg
        return {
          ...msg,
          proposalData: {
            ...msg.proposalData,
            status: 'approved',
          },
        }
      })
    )

    // Partner celebrates and confirms
    setTimeout(() => {
      const confirmMsg: ChatMessage = {
        id: `conf-${Date.now()}`,
        sender: 'partner',
        senderName: partnerName,
        text: 'Awesome! Both $125.00 shares have been deposited into our Family Dream Home Down Payment vault! 🎉 High-five!',
        timestamp: 'Just now',
        read: true,
        type: 'text',
        reactions: { '🎉': 2, '❤️': 1 },
      }
      setSpouseMessages((prev) => [...prev, confirmMsg])
      dispatchIncomingNotification(partnerName, confirmMsg.text)
    }, 1200)
  }

  // Send Deposit Proposal from modal
  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(proposalAmount) || 250
    const proposalMsg: ChatMessage = {
      id: `prop-${Date.now()}`,
      sender: 'user',
      senderName: userName,
      text: `Hey Marcus, I propose adding $${amountNum.toFixed(2)} to our ${proposalGoal}. Will you approve our 50/50 contribution?`,
      timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
      read: true,
      type: 'proposal',
      proposalData: {
        goalName: proposalGoal,
        amount: amountNum,
        split: `50/50 Split ($${(amountNum / 2).toFixed(2)} each)`,
        status: 'pending',
      },
    }

    setSpouseMessages((prev) => [...prev, proposalMsg])
    setShowProposalModal(false)

    // Partner auto-approves and reacts
    setTimeout(() => {
      handleApproveProposal(proposalMsg.id)
    }, 2500)
  }

  // Send Matrimonial Love Note from modal
  const handleSendLoveNote = (e: React.FormEvent) => {
    e.preventDefault()
    const noteMsg: ChatMessage = {
      id: `note-${Date.now()}`,
      sender: 'user',
      senderName: userName,
      text: loveNoteText,
      timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
      read: true,
      type: 'love_note',
      loveNoteTitle: loveNotePreset,
    }

    setSpouseMessages((prev) => [...prev, noteMsg])
    setShowLoveNoteModal(false)

    // Partner replies with love
    setTimeout(() => {
      const partnerReply: ChatMessage = {
        id: `love-reply-${Date.now()}`,
        sender: 'partner',
        senderName: partnerName,
        text: 'You always know how to make my day! Thank you for being the most loving partner in life and prosperity. ❤️💍',
        timestamp: 'Just now',
        read: true,
        type: 'text',
        reactions: { '❤️': 2, '✨': 1 },
      }
      setSpouseMessages((prev) => [...prev, partnerReply])
      dispatchIncomingNotification(partnerName, partnerReply.text)
    }, 1800)
  }

  // Trigger a test partner message (great for testing the notification sound & toast!)
  const triggerTestPartnerMessage = () => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const testReplies = [
        'Hey Julian! Just checking in on our 6.8% compounding interest yield. Everything looks right on target!',
        'Just reviewed our joint savings progress! We are over 60% of the way to our Amalfi Coast goal. 🏖️',
        'Hey love! Hope work is going well today. Our Marriage Certificate is looking sharp in the portal. ❤️',
        'Should we allocate another $500 toward our liquid emergency buffer before the month ends?',
      ]
      const chosen = testReplies[Math.floor(Math.random() * testReplies.length)]
      const testMsg: ChatMessage = {
        id: `test-${Date.now()}`,
        sender: 'partner',
        senderName: partnerName,
        text: chosen,
        timestamp: 'Just now',
        read: true,
        type: 'text',
        reactions: { '❤️': 1 },
      }
      setSpouseMessages((prev) => [...prev, testMsg])
      dispatchIncomingNotification(partnerName, chosen)
    }, 1200)
  }

  const currentMessages = activeChannel === 'spouse' ? spouseMessages : advisorMessages

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ── TOP NOTIFICATION TOAST ── */}
      {incomingToast && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full bg-white rounded-2xl shadow-2xl border-2 border-[#C9A84C] p-4 flex items-start gap-3 animate-slide-up">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0F1C3F] to-[#253970] text-[#C9A84C] flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-md">
            {incomingToast.sender[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-xs font-bold text-[#0F1C3F] truncate">
                {incomingToast.title}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">{incomingToast.time}</span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
              {incomingToast.body}
            </p>
          </div>
          <button
            onClick={() => setIncomingToast(null)}
            className="text-gray-400 hover:text-gray-600 text-xs p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── HEADER & NOTIFICATION SETTINGS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A84C]/15 text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-2">
            <Heart className="w-3.5 h-3.5 fill-[#C9A84C]" />
            Spouse & Fiduciary Mutual Chat
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F1C3F]">
            Matrimonial Real-Time Chat
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Private, encrypted communication between spouses and your Zurich matrimonial wealth advisor with instant notifications.
          </p>
        </div>

        {/* Interactive Controls Pill */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled)
              if (!soundEnabled) playNotificationChime()
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              soundEnabled
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-gray-100 border-gray-200 text-gray-500'
            }`}
            title="Toggle notification chime"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Chime Active' : 'Muted'}</span>
          </button>

          {/* Desktop Push Alert Request */}
          {!desktopNotifGranted ? (
            <button
              onClick={requestDesktopPermission}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#0F1C3F] hover:bg-[#1a2c5e] text-white transition-all shadow-sm"
            >
              <Bell className="w-3.5 h-3.5 text-[#C9A84C]" />
              <span>Enable Browser Alerts</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Push Enabled</span>
            </div>
          )}

          {/* Simulate Partner Incoming Message */}
          <button
            onClick={triggerTestPartnerMessage}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] transition-all shadow-sm shadow-[#C9A84C]/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test Incoming Chat</span>
          </button>
        </div>
      </div>

      {/* ── MAIN CHAT INTERFACE GRID ── */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* ── LEFT SIDEBAR: THREADS & CHANNELS (4 cols) ── */}
        <div className="lg:col-span-4 border-r border-gray-100 bg-[#FCFBF7]/50 flex flex-col">
          {/* Channel selector header */}
          <div className="p-4 border-b border-gray-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-3">
              Encrypted Matrimonial Channels
            </span>

            <div className="space-y-2">
              {/* Channel 1: Married Partner */}
              <div
                onClick={() => setActiveChannel('spouse')}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-center gap-3 border ${
                  activeChannel === 'spouse'
                    ? 'bg-[#0F1C3F] text-white shadow-md border-transparent'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#C9A84C] to-[#ebd59b] text-[#0F1C3F] font-bold flex items-center justify-center text-sm shadow-sm">
                    MV
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full ring-2 ring-emerald-400/30" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-sm font-bold truncate ${activeChannel === 'spouse' ? 'text-white' : 'text-[#0F1C3F]'}`}>
                      {partnerName} (Spouse)
                    </span>
                    <span className={`text-[10px] font-mono ${activeChannel === 'spouse' ? 'text-[#C9A84C]' : 'text-gray-400'}`}>
                      Active
                    </span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${activeChannel === 'spouse' ? 'text-gray-300' : 'text-gray-500'}`}>
                    {spouseMessages[spouseMessages.length - 1]?.text || 'Start chatting...'}
                  </p>
                </div>
              </div>

              {/* Channel 2: Zurich Wealth Concierge */}
              <div
                onClick={() => setActiveChannel('advisor')}
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
                    Beatrix Von Stauffen, CFP®
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Matrimonial Covenant Snapshot Card */}
          <div className="p-4 flex-1 flex flex-col justify-end space-y-3">
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

        {/* ── RIGHT AREA: ACTIVE CHAT THREAD (8 cols) ── */}
        <div className="lg:col-span-8 flex flex-col h-[650px] bg-white">
          {/* Thread Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0F1C3F] to-[#24376b] text-[#C9A84C] font-bold flex items-center justify-center text-sm shadow-sm">
                {activeChannel === 'spouse' ? 'MV' : <Shield className="w-5 h-5 text-[#C9A84C]" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F1C3F] flex items-center gap-2">
                  {activeChannel === 'spouse' ? `${partnerName} (Spouse)` : advisorName}
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </h3>
                <span className="text-[11px] text-gray-400">
                  {activeChannel === 'spouse'
                    ? 'Encrypted Matrimonial Line · Zurich & London Protocol'
                    : 'Senior Matrimonial Wealth Manager · Certified Fiduciary'}
                </span>
              </div>
            </div>

            {/* Quick action triggers */}
            {activeChannel === 'spouse' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowProposalModal(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#C9A84C]/15 text-[#0F1C3F] hover:bg-[#C9A84C]/25 transition-colors border border-[#C9A84C]/30"
                >
                  <PiggyBank className="w-3.5 h-3.5 text-[#C9A84C]" />
                  <span>Propose Deposit</span>
                </button>
                <button
                  onClick={() => setShowLoveNoteModal(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Love Note</span>
                </button>
              </div>
            )}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/50">
            {/* Encryption Notice */}
            <div className="text-center my-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-[10px] text-gray-500 shadow-xs">
                <Shield className="w-3 h-3 text-[#C9A84C]" />
                End-to-End Encrypted Matrimonial Line · Instant Partner Notifications
              </span>
            </div>

            {currentMessages.map((msg) => {
              const isMe = msg.sender === 'user'
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                >
                  <div className="flex items-baseline gap-2 mb-1 px-1">
                    <span className="text-[11px] font-bold text-gray-500">{msg.senderName}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{msg.timestamp}</span>
                  </div>

                  {/* Message Bubble Rendering */}
                  <div className="max-w-[85%] sm:max-w-[75%] relative">
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
                      <div className="p-4 rounded-2xl bg-white border-2 border-[#C9A84C] shadow-lg text-xs space-y-3 min-w-[260px] sm:min-w-[320px]">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9A84C] flex items-center gap-1.5">
                            <PiggyBank className="w-4 h-4 text-[#C9A84C]" />
                            Shared Deposit Proposal
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              msg.proposalData.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
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
                              ${msg.proposalData.amount.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px]">Split Ratio</span>
                            <span className="text-xs font-semibold text-emerald-700">
                              {msg.proposalData.split}
                            </span>
                          </div>
                        </div>

                        {msg.proposalData.status === 'pending' ? (
                          <button
                            onClick={() => handleApproveProposal(msg.id)}
                            className="w-full py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve & Match Deposit ($125)
                          </button>
                        ) : (
                          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] text-center font-semibold flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Approved by Both Partners · Vault Updated
                          </div>
                        )}
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

                    {/* VOICE MEMO SIMULATOR */}
                    {msg.type === 'voice_memo' && (
                      <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center gap-3 min-w-[220px]">
                        <button
                          onClick={() =>
                            setPlayingVoiceId(playingVoiceId === msg.id ? null : msg.id)
                          }
                          className="w-9 h-9 rounded-full bg-[#0F1C3F] text-[#C9A84C] flex items-center justify-center flex-shrink-0 shadow-sm"
                        >
                          {playingVoiceId === msg.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-1 h-5">
                            {[40, 75, 30, 90, 60, 45, 80, 55, 30, 70, 95, 50, 40, 60].map((h, idx) => (
                              <span
                                key={idx}
                                className={`w-1 rounded-full transition-all ${
                                  playingVoiceId === msg.id
                                    ? 'bg-[#C9A84C] animate-pulse'
                                    : 'bg-gray-300'
                                }`}
                                style={{ height: `${h}%` }}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono block mt-1">
                            {msg.voiceDuration || '0:34'} · Voice Note
                          </span>
                        </div>
                      </div>
                    )}

                    {/* CERTIFICATE SNIPPET */}
                    {msg.type === 'certificate' && (
                      <div className="p-4 rounded-2xl bg-[#FCFBF7] border-2 border-[#C9A84C] shadow-md text-xs space-y-2 min-w-[260px]">
                        <div className="flex items-center gap-2 text-[#0F1C3F] font-serif font-bold text-sm">
                          <Award className="w-4 h-4 text-[#C9A84C]" />
                          Official Marriage Certificate
                        </div>
                        <p className="text-gray-600 text-xs">{msg.text}</p>
                        <Link
                          href="/certificate"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C9A84C] hover:underline pt-1"
                        >
                          View Official Document <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}

                    {/* Reactions Display */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Object.entries(msg.reactions).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-gray-200 text-xs shadow-xs hover:scale-105 active:scale-95 transition-transform"
                          >
                            <span>{emoji}</span>
                            <span className="font-bold text-[10px] text-gray-700">{count}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quick Reactions Hover Bar */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 right-0 bg-white border border-gray-200 rounded-full px-2 py-0.5 shadow-md flex items-center gap-1 z-10 text-xs">
                      {['❤️', '💍', '💰', '🥂', '🎉'].map((emo) => (
                        <button
                          key={emo}
                          onClick={() => handleToggleReaction(msg.id, emo)}
                          className="hover:scale-125 transition-transform p-0.5"
                        >
                          {emo}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Read Receipt */}
                  <div className="flex items-center gap-1 mt-0.5 px-1 text-[10px] text-gray-400">
                    {isMe && (
                      <span className="flex items-center text-[#C9A84C]">
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span className="ml-0.5 text-[9px] font-mono">Read</span>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-gray-500 p-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-[10px]">
                  {activeChannel === 'spouse' ? 'MV' : 'BV'}
                </div>
                <div className="flex items-center gap-1 bg-white p-2.5 rounded-2xl border border-gray-200 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[11px] font-medium text-gray-500 ml-1">
                    {activeChannel === 'spouse' ? `${partnerName} is typing…` : 'Advisor is typing…'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Chips */}
          <div className="px-4 py-2 border-t border-gray-100 bg-white flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
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
                onClick={() => {
                  setInputText(chip)
                }}
                className="flex-shrink-0 px-2.5 py-1 rounded-full bg-gray-100 hover:bg-[#C9A84C]/20 hover:text-[#0F1C3F] text-gray-600 text-[11px] font-medium transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Bottom Chat Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 border-t border-gray-200 bg-white flex items-center gap-2 sm:gap-3"
          >
            {/* Action buttons (Propose deposit, love note) */}
            <button
              type="button"
              onClick={() => setShowProposalModal(true)}
              className="p-2 sm:p-2.5 rounded-xl text-gray-500 hover:text-[#C9A84C] hover:bg-gray-100 transition-colors"
              title="Propose Joint Deposit"
            >
              <PiggyBank className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowLoveNoteModal(true)}
              className="p-2 sm:p-2.5 rounded-xl text-gray-500 hover:text-rose-500 hover:bg-rose-50 transition-colors"
              title="Send Matrimonial Love Note"
            >
              <Heart className="w-5 h-5" />
            </button>

            {/* Input field */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  activeChannel === 'spouse'
                    ? `Message ${partnerName}… (instant mutual notifications)`
                    : 'Ask your Zurich wealth concierge…'
                }
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent bg-gray-50/50"
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-3 rounded-2xl bg-[#0F1C3F] hover:bg-[#1a2c5e] text-white disabled:opacity-40 transition-all shadow-md flex items-center justify-center gap-1.5"
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
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#C9A84C] focus:outline-none"
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
                className="w-full py-3 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-xs tracking-wide transition-all shadow-md"
              >
                Send Proposal into Chat
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
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#C9A84C] focus:outline-none"
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
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs tracking-wide transition-all shadow-md"
              >
                Post Love Note to Chat
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
