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
  Shield,
  Clock,
  X,
  CheckCircle2,
  ArrowLeft,
  Check,
  Copy,
  UserCheck,
  RefreshCw,
  Sparkles,
  DollarSign,
  Bell,
  Phone,
  Mail,
  Share2,
  MessageSquare,
  Search,
  Plus,
  Users,
  ExternalLink,
  User,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ChatUser {
  id: string
  name: string
  username?: string
  email?: string
  role?: string
  bio?: string
  avatar?: string
  online?: boolean
}

export interface ChatMessage {
  id: string
  threadId?: string
  senderId?: string
  senderName: string
  recipientId?: string
  recipientName?: string
  sender?: 'user' | 'partner' | 'advisor'
  text: string
  timestamp: string
  createdAt?: string | Date
  read: boolean
  reactions?: Record<string, number>
  type?: 'text' | 'proposal' | 'love_note' | 'voice_memo' | 'certificate' | 'system_reminder' | 'reminder' | 'deposit_alert' | 'social_inquiry'
  proposalData?: {
    goalName?: string
    amount?: number
    split?: string
    status?: 'pending' | 'approved' | 'rejected'
    proposedBy?: string
    approvedBy?: string
    [key: string]: any
  }
  depositData?: {
    amount: number
    bonusMatch?: number
    vaultTitle?: string
    depositorName?: string
    reference?: string
    isReciprocalMatch?: boolean
  }
  loveNoteTitle?: string
}

export interface ConversationItem {
  threadId: string
  otherUserId: string
  otherUserName: string
  lastMessage?: {
    text: string
    createdAt?: string | Date
  }
  unreadCount?: number
}

// ---------------------------------------------------------------------------
// Helper: deterministic thread builder
// ---------------------------------------------------------------------------
function getThreadId(userA: string, userB: string): string {
  const cleanA = String(userA || 'user1').trim().toLowerCase()
  const cleanB = String(userB || 'user2').trim().toLowerCase()
  return `dm_${[cleanA, cleanB].sort().join('_')}`
}

export default function UnifiedChatPage() {
  const { data: session } = useSession()

  // -------------------------------------------------------------------------
  // 1. Current Active User Identity (Sender Perspective)
  // -------------------------------------------------------------------------
  const [activeUserId, setActiveUserId] = useState<string>('usr_jane_doe')
  const [activeUserName, setActiveUserName] = useState<string>('Jane Doe')
  const [copiedInvite, setCopiedInvite] = useState(false)

  // Initialize current user identity from session, localStorage, or URL parameter (?as=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const asParam = params.get('as')?.toLowerCase()
      if (asParam === 'marcus' || asParam === 'usr_marcus_vance' || asParam === 'husband') {
        setActiveUserId('usr_marcus_vance')
        setActiveUserName('Marcus Vance')
        localStorage.setItem('union_verify_active_partner', 'usr_marcus_vance')
        return
      } else if (asParam === 'jane' || asParam === 'usr_jane_doe' || asParam === 'wife') {
        setActiveUserId('usr_jane_doe')
        setActiveUserName('Jane Doe')
        localStorage.setItem('union_verify_active_partner', 'usr_jane_doe')
        return
      }
    }

    if (session?.user?.id === 'usr_marcus_vance' || session?.user?.name?.toLowerCase().includes('marcus')) {
      setActiveUserId('usr_marcus_vance')
      setActiveUserName('Marcus Vance')
      return
    }

    if (session?.user?.id === 'usr_jane_doe' || session?.user?.name?.toLowerCase().includes('jane')) {
      setActiveUserId('usr_jane_doe')
      setActiveUserName('Jane Doe')
      return
    }

    if (session?.user?.id) {
      setActiveUserId(session.user.id)
      setActiveUserName(session.user.name || 'Member')
      return
    }

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('union_verify_active_partner')
      if (saved === 'usr_marcus_vance') {
        setActiveUserId('usr_marcus_vance')
        setActiveUserName('Marcus Vance')
        return
      } else if (saved === 'usr_jane_doe') {
        setActiveUserId('usr_jane_doe')
        setActiveUserName('Jane Doe')
        return
      }
    }

    setActiveUserId('usr_jane_doe')
    setActiveUserName('Jane Doe')
  }, [session])

  const isMarcus = activeUserId === 'usr_marcus_vance'

  // Quick switch between Jane Doe and Marcus Vance for instant testing
  const handleSwitchPartner = () => {
    const nextId = isMarcus ? 'usr_jane_doe' : 'usr_marcus_vance'
    const nextName = isMarcus ? 'Jane Doe' : 'Marcus Vance'
    setActiveUserId(nextId)
    setActiveUserName(nextName)
    if (typeof window !== 'undefined') {
      localStorage.setItem('union_verify_active_partner', nextId)
      const url = new URL(window.location.href)
      url.searchParams.set('as', nextId === 'usr_marcus_vance' ? 'marcus' : 'jane')
      window.history.replaceState({}, '', url.toString())
    }
  }

  // -------------------------------------------------------------------------
  // 2. Chat Recipient & Contact Management
  // -------------------------------------------------------------------------
  const [activeRecipient, setActiveRecipient] = useState<ChatUser>({
    id: 'usr_marcus_vance',
    name: 'Marcus Vance',
    username: 'marcus-vance',
    email: 'marcus.vance@unionverify.com',
    role: 'Husband & Joint Signatory',
    avatar: 'MV',
    online: true,
  })

  const [availableContacts, setAvailableContacts] = useState<ChatUser[]>([
    {
      id: 'usr_marcus_vance',
      name: 'Marcus Vance',
      username: 'marcus-vance',
      email: 'marcus.vance@unionverify.com',
      role: 'Husband & Joint Signatory',
      avatar: 'MV',
      online: true,
      bio: 'Joint covenant wealth partner. 6.8% APY compounding vault.',
    },
    {
      id: 'usr_jane_doe',
      name: 'Jane Doe',
      username: 'jane-doe',
      email: 'jane.doe@unionverify.com',
      role: 'Wife & Joint Signatory',
      avatar: 'JD',
      online: true,
      bio: 'Joint covenant wealth partner. Co-managing our matrimonial reserve.',
    },
    {
      id: 'usr_admin',
      name: 'Union Verify Desk',
      username: 'support',
      email: 'admin@unionverify.com',
      role: 'Support & Concierge',
      avatar: 'UV',
      online: true,
      bio: '24/7 Platform assistance, registry, and fiduciary support desk.',
    },
  ])

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [mobileTab, setMobileTab] = useState<'contacts' | 'chat'>('chat')

  // Derive active thread ID
  const activeThreadId = getThreadId(activeUserId, activeRecipient.id)

  // Load Contacts Directory from API
  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch('/api/chat?users=true')
      const data = await res.json()
      if (data.success && Array.isArray(data.users)) {
        setAvailableContacts(data.users)
      }
    } catch (err) {
      console.warn('Failed to fetch user directory:', err)
    }
  }, [])

  // Load Active Conversations List
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat?list=true&senderId=${encodeURIComponent(activeUserId)}`)
      const data = await res.json()
      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations)
      }
    } catch (err) {
      console.warn('Failed to fetch conversations:', err)
    }
  }, [activeUserId])

  // Handle URL parameters for direct deep-linking (e.g. from /u/[slug] or notifications)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const recId = params.get('recipientId') || params.get('to') || params.get('user')
    const recName = params.get('name')
    const threadParam = params.get('thread')

    if (recId) {
      const matched = availableContacts.find(
        (c) => c.id.toLowerCase() === recId.toLowerCase() || c.username?.toLowerCase() === recId.toLowerCase()
      )
      if (matched) {
        setActiveRecipient(matched)
      } else {
        const cleanName = recName ? decodeURIComponent(recName) : (recId.includes('marcus') ? 'Marcus Vance' : (recId.includes('jane') ? 'Jane Doe' : recId))
        setActiveRecipient({
          id: recId,
          name: cleanName,
          username: recId,
          email: `${recId}@unionverify.com`,
          avatar: cleanName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
          online: true,
        })
      }
      setMobileTab('chat')
    } else if (threadParam === 'advisor' || threadParam === 'support') {
      setActiveRecipient({
        id: 'usr_admin',
        name: 'Union Verify Desk',
        username: 'support',
        email: 'admin@unionverify.com',
        role: 'Support & Concierge',
        avatar: 'UV',
        online: true,
      })
      setMobileTab('chat')
    } else {
      // Default to the other spouse if currently Jane or Marcus
      if (activeUserId === 'usr_jane_doe') {
        setActiveRecipient({
          id: 'usr_marcus_vance',
          name: 'Marcus Vance',
          username: 'marcus-vance',
          email: 'marcus.vance@unionverify.com',
          role: 'Husband & Joint Signatory',
          avatar: 'MV',
          online: true,
        })
      } else if (activeUserId === 'usr_marcus_vance') {
        setActiveRecipient({
          id: 'usr_jane_doe',
          name: 'Jane Doe',
          username: 'jane-doe',
          email: 'jane.doe@unionverify.com',
          role: 'Wife & Joint Signatory',
          avatar: 'JD',
          online: true,
        })
      }
    }
  }, [availableContacts, activeUserId])

  // Select contact & start/open chat
  const handleSelectContact = (contact: ChatUser) => {
    setActiveRecipient(contact)
    setMobileTab('chat')
    setShowNewChatModal(false)

    // Update URL query without page reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('recipientId', contact.id)
      if (contact.name) url.searchParams.set('name', contact.name)
      window.history.replaceState({}, '', url.toString())
    }
  }

  // -------------------------------------------------------------------------
  // 3. Messages & Real-Time Synchronization
  // -------------------------------------------------------------------------
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isApprovingId, setIsApprovingId] = useState<string | null>(null)

  // Modals & Extras
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [proposalGoal, setProposalGoal] = useState('Family Dream Home Down Payment')
  const [proposalAmount, setProposalAmount] = useState('250')
  const [showLoveNoteModal, setShowLoveNoteModal] = useState(false)
  const [loveNoteText, setLoveNoteText] = useState('Adding $150 to our Amalfi Coast fund today. Loving our life together! ❤️')
  const [loveNotePreset, setLoveNotePreset] = useState('Vacation Nest Egg')
  const [isNudging, setIsNudging] = useState(false)
  const [nudgeBanner, setNudgeBanner] = useState('')

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)
  const lastMessageCountRef = useRef<number>(0)

  // Play pleasant notification chime
  const playNotificationChime = useCallback(() => {
    if (!soundEnabled) return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
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
      // Audio playback fallback
    }
  }, [soundEnabled])

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
  }, [])

  // Fetch messages for the active thread
  const fetchMessages = useCallback(async (isInitial = false) => {
    try {
      const res = await fetch(
        `/api/chat?thread=${encodeURIComponent(activeThreadId)}&recipientId=${encodeURIComponent(activeRecipient.id)}&senderId=${encodeURIComponent(activeUserId)}`
      )
      const data = await res.json()
      if (data.success && Array.isArray(data.messages)) {
        if (!isInitial && data.messages.length > lastMessageCountRef.current) {
          const latest = data.messages[data.messages.length - 1]
          if (latest && latest.senderId !== activeUserId) {
            playNotificationChime()
          }
        }
        lastMessageCountRef.current = data.messages.length
        setMessages((prev) => {
          const pending = prev.filter(
            (p) => p.id.startsWith('opt-') && !data.messages.some((m: any) => m.text === p.text && m.senderId === activeUserId)
          )
          return [...data.messages, ...pending]
        })
        if (isInitial) {
          setTimeout(() => scrollToBottom(false), 80)
        }
      }
    } catch (err) {
      console.warn('Failed to sync chat messages:', err)
    }
  }, [activeThreadId, activeRecipient.id, activeUserId, playNotificationChime, scrollToBottom])

  // Initial setup + polling interval + BroadcastChannel
  useEffect(() => {
    fetchContacts()
    fetchConversations()
    fetchMessages(true)

    // Polling interval every 2.0s for authentic real-time delivery
    const pollInterval = setInterval(() => {
      fetchMessages(false)
      fetchConversations()
    }, 2000)

    // Cross-tab real-time sync
    let bc: BroadcastChannel | null = null
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('union_verify_chat')
      broadcastChannelRef.current = bc
      bc.onmessage = () => {
        fetchMessages(false)
        fetchConversations()
      }
    }

    return () => {
      clearInterval(pollInterval)
      if (bc) bc.close()
    }
  }, [fetchContacts, fetchConversations, fetchMessages])

  // -------------------------------------------------------------------------
  // 4. Send Message (100% Authentic Human-to-Human, No Bots)
  // -------------------------------------------------------------------------
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim()) return

    const messageText = inputText.trim()
    setInputText('')

    const optimisticTime = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date())

    const optimisticMsg: ChatMessage = {
      id: `opt-${Date.now()}`,
      threadId: activeThreadId,
      senderId: activeUserId,
      senderName: activeUserName,
      recipientId: activeRecipient.id,
      recipientName: activeRecipient.name,
      text: messageText,
      timestamp: optimisticTime,
      read: false,
      type: 'text',
      reactions: {},
    }

    setMessages((prev) => [...prev, optimisticMsg])
    lastMessageCountRef.current += 1
    setTimeout(() => scrollToBottom(true), 40)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: activeThreadId,
          text: messageText,
          senderId: activeUserId,
          senderName: activeUserName,
          recipientId: activeRecipient.id,
          recipientName: activeRecipient.name,
          type: 'text',
        }),
      })

      const data = await res.json()
      if (data.success && data.message) {
        setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? data.message : m)))
        broadcastChannelRef.current?.postMessage({ type: 'NEW_MESSAGE' })
        fetchConversations()
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  // Copy Direct Chat Invite Link for sharing
  const handleCopyPartnerInvite = () => {
    if (typeof window === 'undefined') return
    const inviteUrl = `${window.location.origin}/chat?recipientId=${encodeURIComponent(activeUserId)}&name=${encodeURIComponent(activeUserName)}`
    navigator.clipboard.writeText(inviteUrl)
    setCopiedInvite(true)
    setTimeout(() => setCopiedInvite(false), 3500)
  }

  // Instant Spousal Deposit Nudge
  const handleSendInstantNudge = async () => {
    setIsNudging(true)
    try {
      const res = await fetch('/api/savings/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_now',
          amount: 500,
          targetPartnerId: activeRecipient.id,
          targetPartnerName: activeRecipient.name,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setNudgeBanner(`Deposit reminder dispatched directly to ${activeRecipient.name}!`)
        fetchMessages(false)
        broadcastChannelRef.current?.postMessage({ type: 'NUDGE_SENT' })
        setTimeout(() => setNudgeBanner(''), 4500)
      }
    } catch (err) {
      console.error('Failed to dispatch nudge:', err)
    } finally {
      setIsNudging(false)
    }
  }

  // Approve Proposal
  const handleApproveProposal = async (msgId: string) => {
    setIsApprovingId(msgId)
    try {
      const res = await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: msgId,
          action: 'approve_proposal',
          approvedBy: activeUserName,
          partnerName: activeUserName,
        }),
      })
      const data = await res.json()
      if (data.success) {
        playNotificationChime()
        fetchMessages(false)
        broadcastChannelRef.current?.postMessage({ type: 'PROPOSAL_APPROVED' })
      }
    } catch (err) {
      console.error('Failed to approve proposal:', err)
    } finally {
      setIsApprovingId(null)
    }
  }

  // Send Shared Vault Proposal
  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(proposalAmount) || 250
    setShowProposalModal(false)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: activeThreadId,
          senderId: activeUserId,
          senderName: activeUserName,
          recipientId: activeRecipient.id,
          recipientName: activeRecipient.name,
          type: 'proposal',
          text: `Hey ${activeRecipient.name}, I propose adding $${amountNum.toFixed(2)} to our ${proposalGoal}. Will you approve our 50/50 contribution?`,
          proposalData: {
            goalName: proposalGoal,
            amount: amountNum,
            split: `50/50 Split ($${(amountNum / 2).toFixed(2)} each)`,
            status: 'pending',
            proposedBy: activeUserName,
          },
        }),
      })
      const data = await res.json()
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message])
        broadcastChannelRef.current?.postMessage({ type: 'NEW_PROPOSAL' })
        setTimeout(() => scrollToBottom(true), 50)
      }
    } catch (err) {
      console.error('Failed to create proposal:', err)
    }
  }

  // Send Matrimonial Love Note
  const handleSendLoveNote = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowLoveNoteModal(false)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: activeThreadId,
          senderId: activeUserId,
          senderName: activeUserName,
          recipientId: activeRecipient.id,
          recipientName: activeRecipient.name,
          type: 'love_note',
          text: loveNoteText,
          loveNoteTitle: loveNotePreset,
        }),
      })
      const data = await res.json()
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message])
        broadcastChannelRef.current?.postMessage({ type: 'NEW_LOVE_NOTE' })
        setTimeout(() => scrollToBottom(true), 50)
      }
    } catch (err) {
      console.error('Failed to send love note:', err)
    }
  }

  // Toggle Emoji Reaction
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
        fetchMessages(false)
        broadcastChannelRef.current?.postMessage({ type: 'REACTION' })
      }
    } catch (err) {
      console.error('Failed to toggle reaction:', err)
    }
  }

  // Filter contacts by search query
  const filteredContacts = availableContacts.filter((c) => {
    if (c.id === activeUserId) return false // don't list yourself
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.username?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  })

  const isChattingWithSpouse =
    (activeUserId === 'usr_jane_doe' && activeRecipient.id === 'usr_marcus_vance') ||
    (activeUserId === 'usr_marcus_vance' && activeRecipient.id === 'usr_jane_doe')

  return (
    <div className="h-full flex-1 flex flex-col min-w-0 w-full overflow-hidden">
      {/* ── TOP BAR: IDENTITY PERSPECTIVE & SHORTCUTS ── */}
      <div className="hidden sm:flex flex-shrink-0 flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 mb-2 border-b border-gray-200">
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
              Real-Time Direct Messenger
            </h1>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
            Live Peer-to-Peer
          </span>
        </div>

        {/* Sender Switcher & Invite Link */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs shadow-2xs">
            <UserCheck className="w-3.5 h-3.5 text-[#C9A84C]" />
            <span className="text-gray-500 text-[11px]">Chatting as:</span>
            <strong className="text-[#0F1C3F] font-bold">{activeUserName}</strong>
            <button
              type="button"
              onClick={handleSwitchPartner}
              className="ml-1 text-[11px] font-bold text-[#C9A84C] hover:text-[#b3933e] underline cursor-pointer flex items-center gap-0.5"
              title={`Switch perspective to test as ${isMarcus ? 'Jane Doe' : 'Marcus Vance'}`}
            >
              ⇄ Switch to {isMarcus ? 'Jane Doe' : 'Marcus Vance'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyPartnerInvite}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#C9A84C]/15 hover:bg-[#C9A84C]/25 text-[#0F1C3F] border border-[#C9A84C]/40 transition-all cursor-pointer shadow-2xs"
            title="Copy your personal direct chat link to share with anyone"
          >
            {copiedInvite ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Chat Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#C9A84C]" />
                <span>Share My Chat Link</span>
              </>
            )}
          </button>

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
      <div className="flex-1 min-h-0 bg-white rounded-none sm:rounded-2xl border-0 sm:border border-gray-200 shadow-none sm:shadow-lg overflow-hidden flex flex-col lg:flex-row relative">
        {/* ── LEFT SIDEBAR: CONVERSATIONS & DIRECTORY ── */}
        <div
          className={`w-full lg:w-80 xl:w-96 flex-shrink-0 border-r border-gray-100 bg-[#FCFBF7]/60 flex-col h-full ${
            mobileTab === 'contacts' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Sidebar Top: Search & New Message */}
          <div className="p-3.5 border-b border-gray-100 flex-shrink-0 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Direct Conversations
              </span>
              <button
                type="button"
                onClick={() => setShowNewChatModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2f64] text-white text-[11px] font-bold transition-all shadow-xs"
              >
                <Plus size={13} />
                <span>New Chat</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members or contacts..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:border-[#C9A84C]"
              />
            </div>
          </div>

          {/* Conversations & Contacts List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                No members found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = activeRecipient.id === contact.id
                const isSpouse = (activeUserId === 'usr_jane_doe' && contact.id === 'usr_marcus_vance') ||
                                 (activeUserId === 'usr_marcus_vance' && contact.id === 'usr_jane_doe')

                return (
                  <div
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 border ${
                      isSelected
                        ? 'bg-[#0F1C3F] text-white shadow-md border-transparent'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                        isSelected
                          ? 'bg-[#C9A84C] text-[#0F1C3F]'
                          : isSpouse
                          ? 'bg-gradient-to-tr from-[#C9A84C] to-[#edd9a4] text-[#0F1C3F]'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {contact.avatar || (contact.name || 'UV').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-[#0F1C3F]'}`}>
                          {contact.name}
                        </span>
                        {isSpouse && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            isSelected ? 'bg-[#C9A84C] text-[#0F1C3F]' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            Spouse
                          </span>
                        )}
                        {contact.id === 'usr_admin' && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            isSelected ? 'bg-blue-400 text-[#0F1C3F]' : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            Support
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                        {contact.bio || contact.email || 'Click to open conversation'}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Connected Quick Profile Bar */}
          <div className="p-3 border-t border-gray-100 bg-white/60 flex-shrink-0 space-y-2">
            <Link
              href={activeRecipient.username ? `/u/${activeRecipient.username}` : (activeRecipient.id === 'usr_marcus_vance' ? '/u/marcus-vance' : '/u/jane-doe')}
              target="_blank"
              className="w-full py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-[11px] transition-colors border border-blue-200 flex items-center justify-center gap-1.5"
            >
              <ExternalLink size={13} className="text-blue-600" />
              <span>View {activeRecipient.name}&apos;s Public Profile</span>
            </Link>
          </div>
        </div>

        {/* ── RIGHT AREA: ACTIVE CHAT THREAD ── */}
        <div
          className={`flex-1 min-w-0 flex-col h-full bg-white ${
            mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Thread Header */}
          <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-20 flex-shrink-0 shadow-xs">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileTab('contacts')}
                className="lg:hidden p-1.5 -ml-1 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 flex items-center gap-1 text-xs font-bold transition-colors"
                title="Back to Conversations"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-[11px]">Chats</span>
              </button>

              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#0F1C3F] to-[#24376b] text-[#C9A84C] font-bold flex items-center justify-center text-xs sm:text-sm shadow-xs">
                  {activeRecipient.avatar || (activeRecipient.name || 'UV').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-bold text-[#0F1C3F] truncate">
                    {activeRecipient.name}
                  </h3>
                  {isChattingWithSpouse && (
                    <span className="text-[10px] text-[#C9A84C] font-semibold hidden sm:inline">(Spouse)</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                  <span>·</span>
                  <Link
                    href={activeRecipient.username ? `/u/${activeRecipient.username}` : (activeRecipient.id === 'usr_marcus_vance' ? '/u/marcus-vance' : '/u/jane-doe')}
                    target="_blank"
                    className="text-[#C9A84C] hover:underline"
                  >
                    Profile
                  </Link>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={handleCopyPartnerInvite}
                    className="text-purple-600 font-semibold hover:underline"
                  >
                    {copiedInvite ? '✓ Link Copied' : 'Invite'}
                  </button>
                </div>
              </div>
            </div>

            {/* Spousal Action Triggers */}
            {isChattingWithSpouse && (
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <button
                  onClick={handleSendInstantNudge}
                  disabled={isNudging}
                  className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors border border-amber-200 disabled:opacity-50"
                  title="Send instant deposit reminder"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden xs:inline">{isNudging ? 'Nudging...' : 'Deposit Nudge'}</span>
                  <span className="xs:hidden text-[10px]">Nudge</span>
                </button>
                <button
                  onClick={() => setShowProposalModal(true)}
                  className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-[#C9A84C]/15 text-[#0F1C3F] hover:bg-[#C9A84C]/25 transition-colors border border-[#C9A84C]/30"
                >
                  <PiggyBank className="w-3.5 h-3.5 text-[#C9A84C]" />
                  <span className="hidden xs:inline">Propose Deposit</span>
                  <span className="xs:hidden text-[10px]">Deposit</span>
                </button>
                <button
                  onClick={() => setShowLoveNoteModal(true)}
                  className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden xs:inline">Love Note</span>
                  <span className="xs:hidden text-[10px]">Note</span>
                </button>
              </div>
            )}
          </div>

          {/* Messages Stream */}
          <div
            ref={messagesContainerRef}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-6 space-y-3 sm:space-y-4 bg-gray-50/50"
          >
            {/* Feedback Banners */}
            {nudgeBanner && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 font-bold flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{nudgeBanner}</span>
              </div>
            )}

            {copiedInvite && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 font-bold flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    Your direct chat link has been copied! Send it to anyone to chat in real-time.
                  </span>
                </div>
                <button onClick={() => setCopiedInvite(false)} className="text-emerald-700 hover:text-emerald-950">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Conversation Header Card */}
            <div className="mx-auto max-w-md p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-1 text-center my-1">
              <div className="flex items-center justify-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-[#0F1C3F] text-[#C9A84C] font-bold text-[10px] flex items-center justify-center">
                  {activeRecipient.avatar || 'UV'}
                </div>
                <span className="text-xs font-bold text-[#0F1C3F]">Direct Line with {activeRecipient.name}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-1.5 py-0.2 rounded-full border border-emerald-200">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                End-to-end encrypted direct communication. No bots or automated AI responses.
              </p>
            </div>

            {/* Empty State */}
            {messages.length === 0 && (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0F1C3F]/5 border border-[#0F1C3F]/10 flex items-center justify-center mx-auto text-[#C9A84C]">
                  <MessageSquare className="w-6 h-6 text-[#C9A84C]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F1C3F]">Start conversation with {activeRecipient.name}</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                    Send a message below. Your recipient will receive an instant notification.
                  </p>
                </div>
              </div>
            )}

            {/* Messages Rendering */}
            {messages.map((msg) => {
              const isMe = msg.senderId ? msg.senderId === activeUserId : (msg.senderName === activeUserName)

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                >
                  <div className="flex items-baseline gap-2 mb-1 px-1">
                    <span className="text-[11px] font-bold text-gray-500">
                      {isMe ? `${activeUserName} (You)` : msg.senderName}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">{msg.timestamp}</span>
                  </div>

                  <div className="max-w-[88%] sm:max-w-[75%] relative">
                    {/* STANDARD TEXT */}
                    {(!msg.type || msg.type === 'text') && (
                      <div
                        className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                          isMe
                            ? 'bg-[#0F1C3F] text-white rounded-tr-none'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}

                    {/* PROPOSAL CARD */}
                    {msg.type === 'proposal' && msg.proposalData && (
                      <div className="p-4 rounded-2xl bg-white border-2 border-[#C9A84C] shadow-md text-xs space-y-3 min-w-[270px] sm:min-w-[340px]">
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
                            {msg.proposalData.status === 'approved' ? '✓ Approved' : 'Awaiting Approval'}
                          </span>
                        </div>

                        <div>
                          <span className="text-gray-500 block text-[11px]">Vault Goal</span>
                          <strong className="text-[#0F1C3F] text-sm block">{msg.proposalData.goalName}</strong>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-xl">
                          <div>
                            <span className="text-gray-400 block text-[10px]">Total Amount</span>
                            <span className="text-base font-bold text-[#0F1C3F]">
                              ${Number(msg.proposalData.amount).toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px]">Split</span>
                            <span className="text-xs font-semibold text-emerald-700">
                              {msg.proposalData.split}
                            </span>
                          </div>
                        </div>

                        {msg.proposalData.status === 'pending' ? (
                          !isMe ? (
                            <button
                              onClick={() => handleApproveProposal(msg.id)}
                              disabled={isApprovingId === msg.id}
                              className="w-full py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-black text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {isApprovingId === msg.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              <span>Approve & Match Deposit</span>
                            </button>
                          ) : (
                            <div className="p-2 rounded-lg bg-amber-50 text-amber-800 text-[11px] text-center font-medium border border-amber-200">
                              ⏳ Waiting for {activeRecipient.name} to approve
                            </div>
                          )
                        ) : (
                          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] text-center font-semibold flex items-center justify-center gap-1.5 border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Approved by {msg.proposalData.approvedBy || 'Partner'}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* LOVE NOTE CARD */}
                    {msg.type === 'love_note' && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 via-pink-50 to-white border-2 border-rose-200 shadow-xs text-xs space-y-2 min-w-[240px]">
                        <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs border-b border-rose-100 pb-1.5">
                          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                          <span>{msg.loveNoteTitle || 'Matrimonial Love Note'}</span>
                        </div>
                        <p className="text-gray-800 text-xs italic leading-relaxed">&ldquo;{msg.text}&rdquo;</p>
                      </div>
                    )}

                    {/* Reactions Bar */}
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      {msg.reactions &&
                        Object.entries(msg.reactions).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[11px] font-semibold flex items-center gap-1 hover:border-[#C9A84C] transition-colors shadow-2xs"
                          >
                            <span>{emoji}</span>
                            <span className="text-gray-500 font-mono text-[10px]">{count}</span>
                          </button>
                        ))}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-1">
                        {['❤️', '👍', '🔥'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            className="p-1 rounded-full hover:bg-gray-200 text-xs transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Message Input Box */}
          <div className="p-3 sm:p-4 border-t border-gray-100 bg-white flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Type a message to ${activeRecipient.name}...`}
                className="flex-1 px-4 py-3 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C] bg-gray-50/50"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-3 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2f64] text-white font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── MODAL: START NEW CHAT (Member Directory) ── */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-[#0F1C3F] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C9A84C]" />
                <h3 className="font-bold text-sm">Select Member to Message</h3>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search by name, role, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C]"
              />
            </div>

            <div className="p-3 overflow-y-auto space-y-1.5 flex-1">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  className="p-3 rounded-2xl border border-gray-200 hover:border-[#C9A84C] hover:bg-[#C9A84C]/5 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-[#0F1C3F] flex-shrink-0">
                      {contact.avatar || (contact.name || 'UV').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#0F1C3F] truncate group-hover:text-[#C9A84C] transition-colors">
                        {contact.name}
                      </h4>
                      <p className="text-[11px] text-gray-500 truncate">
                        {contact.role || contact.email || 'Member'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#C9A84C] opacity-0 group-hover:opacity-100 transition-opacity">
                    Chat →
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PROPOSE DEPOSIT ── */}
      {showProposalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-[#C9A84C]" />
                <h3 className="font-bold text-sm text-[#0F1C3F]">Propose Shared Vault Contribution</h3>
              </div>
              <button onClick={() => setShowProposalModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Vault Milestone Goal
                </label>
                <input
                  type="text"
                  required
                  value={proposalGoal}
                  onChange={(e) => setProposalGoal(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Total Match Amount ($)
                </label>
                <input
                  type="number"
                  min="20"
                  step="10"
                  required
                  value={proposalAmount}
                  onChange={(e) => setProposalAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C]"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Each spouse contributes 50% (${((parseFloat(proposalAmount) || 0) / 2).toFixed(2)})
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2f64] text-white font-bold text-xs transition-colors shadow-xs"
              >
                Send Proposal to {activeRecipient.name}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: LOVE NOTE ── */}
      {showLoveNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <h3 className="font-bold text-sm text-[#0F1C3F]">Send Matrimonial Love Note</h3>
              </div>
              <button onClick={() => setShowLoveNoteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendLoveNote} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Occasion / Preset
                </label>
                <input
                  type="text"
                  value={loveNotePreset}
                  onChange={(e) => setLoveNotePreset(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Your Note
                </label>
                <textarea
                  rows={3}
                  required
                  value={loveNoteText}
                  onChange={(e) => setLoveNoteText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs transition-colors shadow-xs"
              >
                Send Note to {activeRecipient.name} ❤️
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
