'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { formatAccountNumber } from '@/lib/utils'
import SpouseRequestBanner, { type SpouseRequest } from '@/components/investor/SpouseRequestBanner'
import FindMember from '@/components/investor/FindMember'
import MyAccountId from '@/components/investor/MyAccountId'
import {
  Heart,
  Send,
  Volume2,
  VolumeX,
  PiggyBank,
  Award,
  X,
  CheckCircle2,
  ArrowLeft,
  Check,
  Copy,
  UserCheck,
  RefreshCw,
  Sparkles,
  Bell,
  MessageSquare,
  Search,
  Plus,
  Users,
  TrendingUp,
  Wallet,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ChatUser {
  id: string
  name: string
  username?: string
  accountNumber?: string
  email?: string
  role?: string
  bio?: string
  avatar?: string
  online?: boolean
  unreadCount?: number
  guestEmail?: string | null
  /** Last message in the conversation (empty before the first one) */
  lastAt?: string | Date | null
  lastFromMe?: boolean
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
  reactions?: Record<string, number | string[]>
  type?: 'text' | 'proposal' | 'love_note' | 'voice_memo' | 'certificate' | 'system_reminder' | 'reminder' | 'deposit_alert' | 'social_inquiry' | 'spouse_request' | 'invest_invite' | 'investment' | 'withdrawal'
  proposalData?: {
    goalName?: string
    amount?: number
    split?: string
    status?: 'pending' | 'approved' | 'rejected' | 'accepted' | 'declined'
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
    withdrawalId?: string
    proposalId?: string
    status?: string
  }
  loveNoteTitle?: string
}

export interface ConversationItem {
  threadId: string
  otherUserId: string
  otherUserName: string
  otherUsername?: string | null
  otherAccountNumber?: string | null
  kind?: 'spouse' | 'member' | 'visitor'
  guestEmail?: string | null
  lastMessage?: {
    text: string
    createdAt?: string | Date | null
    fromMe?: boolean
  }
  unreadCount?: number
}

/** Chat list time: "11:58 AM" today, "Yesterday", then "Oct 27" */
function listTime(value?: string | Date | null): string {
  if (!value) return ''
  const date = new Date(value)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
  // The signed-in user (the member area requires a session)
  const activeUserId = session?.user?.id || ''
  const activeUserName = session?.user?.name || 'Member'
  const [copiedInvite, setCopiedInvite] = useState(false)

  // -------------------------------------------------------------------------
  // 2. Chat Recipient & Contact Management
  // -------------------------------------------------------------------------
  // Empty until the server resolves the user's spouse (or a contact is picked)
  const [activeRecipient, setActiveRecipient] = useState<ChatUser>({
    id: '',
    name: 'Your spouse',
    avatar: 'YS',
    online: false,
  })

  const [availableContacts, setAvailableContacts] = useState<ChatUser[]>([])
  const [contactsLoaded, setContactsLoaded] = useState(false)

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [spouseId, setSpouseId] = useState<string>('')
  // Spouse requests waiting for my answer (null until loaded)
  const [spouseRequests, setSpouseRequests] = useState<SpouseRequest[] | null>(null)
  // What I still owe my spouse, and which of their deposits to show the Match button on
  type PendingDeposit = { messageId: string; depositorName: string; amount: number; depositedAt: string; note: string }
  const [reciprocation, setReciprocation] = useState<{
    owedByMe: number
    owedBySpouse: number
    pendingMessageId: string | null
    pendingDeposits?: PendingDeposit[]
    spousePendingDeposits?: PendingDeposit[]
  } | null>(null)
  // Reminder form (sent to the couple chat and to the spouse's email)
  const [showReminder, setShowReminder] = useState(false)
  const [reminderAmount, setReminderAmount] = useState('')
  const [reminderNote, setReminderNote] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [mobileTab, setMobileTab] = useState<'contacts' | 'chat'>('chat')

  // Derive active thread ID
  const activeThreadId = getThreadId(activeUserId, activeRecipient.id)

  // The chat list (kept fresh by the poll below)
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat?list=true')
      const data = await res.json()
      if (data.success && Array.isArray(data.conversations)) {
        const list: ConversationItem[] = data.conversations
        setConversations(list)
        setSpouseId(data.spouseId || '')
        setAvailableContacts(
          list.map((c) => ({
            id: c.otherUserId,
            name: c.otherUserName,
            username: c.otherUsername || undefined,
            accountNumber: c.otherAccountNumber || undefined,
            role: c.kind === 'spouse' ? 'Spouse' : c.kind === 'visitor' ? 'Visitor' : 'Member',
            bio: c.lastMessage?.text.slice(0, 80),
            avatar: c.otherUserName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
            unreadCount: c.unreadCount,
            guestEmail: c.guestEmail,
            lastAt: c.lastMessage?.createdAt,
            lastFromMe: c.lastMessage?.fromMe,
          })),
        )
        setContactsLoaded(true)
      }
    } catch (err) {
      console.warn('Failed to fetch conversations:', err)
    }
  }, [activeUserId])

  const fetchSpouseRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/spouse')
      const data = await res.json()
      setSpouseRequests(data.success && Array.isArray(data.requests) ? data.requests : [])
    } catch {
      setSpouseRequests([])
    }
  }, [])

  // Handle URL parameters for direct deep-linking (e.g. from /u/[slug] or notifications).
  // The link opens its chat once; after that the member can go back to the list.
  const openedLinkRef = useRef('')
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
      if (openedLinkRef.current !== recId) {
        openedLinkRef.current = recId
        // Not in my list yet: use the name from the link
        const cleanName = recName ? decodeURIComponent(recName) : 'Member'
        setActiveRecipient(
          matched || {
            id: recId,
            name: cleanName,
            avatar: cleanName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
          }
        )
        setMobileTab('chat')
      } else if (matched) {
        // Fill in their details (account ID, profile) once the list has them
        setActiveRecipient((prev) =>
          prev.id.toLowerCase() === matched.id.toLowerCase() && (prev.accountNumber !== matched.accountNumber || prev.username !== matched.username)
            ? matched
            : prev
        )
      }
    } else if (threadParam === 'advisor' || threadParam === 'support') {
      if (openedLinkRef.current !== threadParam) {
        openedLinkRef.current = threadParam
        setActiveRecipient({
          id: 'usr_admin',
          name: 'Union Verify Support',
          role: 'Support',
          avatar: 'UV',
        })
        setMobileTab('chat')
      }
    } else if (spouseId) {
      // Default to the user's spouse
      const spouseConvo = conversations.find((c) => c.otherUserId === spouseId)
      const spouseContact = availableContacts.find((c) => c.id === spouseId)
      const spouseName = spouseContact?.name || spouseConvo?.otherUserName || 'Your spouse'
      setActiveRecipient((prev) =>
        prev.id === spouseId
          ? prev
          : spouseContact || {
              id: spouseId,
              name: spouseName,
              avatar: spouseName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
            }
      )
    } else if (!activeRecipient.id && spouseRequests?.length) {
      // Someone asked to link as spouses: open that chat first
      const { fromUserId, fromName } = spouseRequests[0]
      setActiveRecipient(
        availableContacts.find((c) => c.id === fromUserId) || {
          id: fromUserId,
          name: fromName,
          avatar: fromName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
        }
      )
      setMobileTab('chat')
    } else if (availableContacts.length > 0 && spouseRequests) {
      // No spouse yet: open the most recent conversation instead of an empty placeholder
      if (!activeRecipient.id) {
        setActiveRecipient(availableContacts[0])
        setMobileTab('chat')
      }
    } else if (contactsLoaded && spouseRequests) {
      // Nothing to open: show the conversation list (with "New chat")
      setMobileTab('contacts')
    }
  }, [availableContacts, contactsLoaded, activeRecipient.id, activeUserId, spouseId, conversations, spouseRequests])

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
  // 3. Messages & polling
  // -------------------------------------------------------------------------
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isApprovingId, setIsApprovingId] = useState<string | null>(null)

  // Modals & Extras
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [proposalGoal, setProposalGoal] = useState('')
  const [proposalAmount, setProposalAmount] = useState('250')
  const [showLoveNoteModal, setShowLoveNoteModal] = useState(false)
  const [loveNoteText, setLoveNoteText] = useState('')
  const [loveNotePreset, setLoveNotePreset] = useState('')
  const [isNudging, setIsNudging] = useState(false)
  const [nudgeBanner, setNudgeBanner] = useState('')

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)
  const lastMessageCountRef = useRef<number>(0)
  // Messages we sent recently (id -> sent time). Kept on screen until a poll returns them,
  // so a stale poll response can't make a just-sent message vanish.
  const recentlySentRef = useRef<Map<string, number>>(new Map())
  const rememberSent = (id: string) => recentlySentRef.current.set(id, Date.now())

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
    if (!activeRecipient.id) {
      setMessages([])
      return
    }
    try {
      const res = await fetch(
        `/api/chat?thread=${encodeURIComponent(activeThreadId)}&recipientId=${encodeURIComponent(activeRecipient.id)}`
      )
      const data = await res.json()
      if (data.success && Array.isArray(data.messages)) {
        if (!isInitial && data.messages.length > lastMessageCountRef.current) {
          const latest = data.messages[data.messages.length - 1]
          if (latest && latest.senderId !== activeUserId) {
            playNotificationChime()
          }
          // Bring new messages into view unless the user scrolled up to read history
          const el = messagesContainerRef.current
          const nearBottom = !el || el.scrollHeight - el.scrollTop - el.clientHeight < 200
          if (nearBottom) setTimeout(() => scrollToBottom(true), 60)
        }
        lastMessageCountRef.current = data.messages.length
        setReciprocation(data.reciprocation || null)
        setMessages((prev) => {
          const serverIds = new Set(data.messages.map((m: any) => m.id))
          const now = Date.now()
          const pending = prev.filter((p) => {
            if (serverIds.has(p.id)) return false
            if (p.senderId !== activeUserId || p.recipientId !== activeRecipient.id) return false
            if (p.id.startsWith('opt-')) {
              return !data.messages.some((m: any) => m.text === p.text && m.senderId === activeUserId)
            }
            const sentAt = recentlySentRef.current.get(p.id)
            return !!sentAt && now - sentAt < 60_000
          })
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
    fetchConversations()
    fetchSpouseRequests()
    fetchMessages(true)

    // Poll for new messages every 2s
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
  }, [fetchConversations, fetchSpouseRequests, fetchMessages])

  // -------------------------------------------------------------------------
  // 4. Send Message
  // -------------------------------------------------------------------------
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim()) return
    if (!activeRecipient.id) {
      setNudgeBanner('No spouse connected yet — copy your chat link and send it to your spouse to start chatting.')
      return
    }

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
        rememberSent(data.message.id)
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

  // Deposit reminder to my spouse (the member chooses the amount)
  const handleSpouseAction = async (
    body: { action: 'request'; userId: string } | { action: 'accept' | 'decline'; messageId: string },
  ) => {
    if (body.action === 'decline' && !window.confirm(`Decline ${activeRecipient.name}'s request to link as spouses?`)) return
    try {
      const res = await fetch('/api/spouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setNudgeBanner(
        data.success
          ? body.action === 'decline'
            ? 'Request declined.'
            : data.linked
              ? `You are now linked with ${activeRecipient.name} as spouses.`
              : `Request sent to ${activeRecipient.name}${data.emailed ? ' (in chat and by email)' : ' in chat'}.`
          : data.error || 'Something went wrong.',
      )
      setTimeout(() => setNudgeBanner(''), 6000)
      fetchMessages(false)
      fetchConversations()
      fetchSpouseRequests()
    } catch {
      setNudgeBanner('Something went wrong.')
    }
  }

  // The form sits at the top of the thread: scroll it into view
  const openReminder = (amount: number) => {
    setReminderAmount(amount > 0 ? String(amount) : '')
    setShowReminder(true)
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSendReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Math.round(parseFloat(reminderAmount) * 100) / 100
    if (!Number.isFinite(amount) || amount <= 0) {
      setNudgeBanner('Enter an amount greater than $0 to send a reminder.')
      return
    }
    setIsNudging(true)
    try {
      const res = await fetch('/api/savings/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_now', amount, note: reminderNote }),
      })
      const data = await res.json()
      setNudgeBanner(data.success ? data.message : data.error || 'The reminder could not be sent.')
      if (data.success) {
        setShowReminder(false)
        setReminderNote('')
        fetchMessages(false)
        broadcastChannelRef.current?.postMessage({ type: 'NUDGE_SENT' })
      }
      setTimeout(() => setNudgeBanner(''), 6000)
    } catch (err) {
      console.error('Failed to send reminder:', err)
    } finally {
      setIsNudging(false)
    }
  }

  // Approve or decline a proposal (only the person it was sent to)
  const handleAnswerProposal = async (msgId: string, action: 'approve_proposal' | 'decline_proposal') => {
    setIsApprovingId(msgId)
    try {
      const res = await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId, action }),
      })
      const data = await res.json()
      if (data.success) {
        playNotificationChime()
        fetchMessages(false)
        broadcastChannelRef.current?.postMessage({ type: 'PROPOSAL_ANSWERED' })
      } else {
        setNudgeBanner(data.error || 'Something went wrong.')
        setTimeout(() => setNudgeBanner(''), 5000)
      }
    } catch (err) {
      console.error('Failed to answer proposal:', err)
    } finally {
      setIsApprovingId(null)
    }
  }

  // Send a deposit proposal
  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(proposalAmount)
    if (!Number.isFinite(amountNum) || amountNum <= 0) return
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
          text: `I propose we deposit $${amountNum.toFixed(2)} for ${proposalGoal}, split 50/50. Do you approve?`,
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
        rememberSent(data.message.id)
        setMessages((prev) => [...prev, data.message])
        broadcastChannelRef.current?.postMessage({ type: 'NEW_PROPOSAL' })
        setTimeout(() => scrollToBottom(true), 50)
      }
    } catch (err) {
      console.error('Failed to create proposal:', err)
    }
  }

  // Send a love note
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
          loveNoteTitle: loveNotePreset || 'Love note',
        }),
      })
      const data = await res.json()
      if (data.success && data.message) {
        rememberSent(data.message.id)
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
          senderId: activeUserId,
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
    const digits = q.replace(/[\s#-]/g, '')
    return (
      c.name.toLowerCase().includes(q) ||
      (!!digits && /^\d+$/.test(digits) && !!c.accountNumber?.includes(digits)) ||
      c.username?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  })

  const isChattingWithSpouse = !!spouseId && activeRecipient.id === spouseId

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
            <h1 className="text-base sm:text-lg font-black text-[#0F1C3F] tracking-tight">
              Messages
            </h1>
          </div>
        </div>

        {/* Identity & Invite Link */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs shadow-2xs">
            <UserCheck className="w-3.5 h-3.5 text-[#C9A84C]" />
            <span className="text-gray-500 text-[11px]">Chatting as:</span>
            <strong className="text-[#0F1C3F] font-bold">{activeUserName}</strong>
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
                <span className="text-emerald-700 font-bold">Chat link copied</span>
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
            <span className="text-[11px]">{soundEnabled ? 'Sound on' : 'Muted'}</span>
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
                Conversations
              </span>
              <button
                type="button"
                onClick={() => setShowNewChatModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2f64] text-white text-[11px] font-bold transition-all shadow-xs"
              >
                <Plus size={13} />
                <span>New chat</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats by name or ID"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:border-[#C9A84C]"
              />
            </div>
          </div>

          {/* Conversations & Contacts List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                {searchQuery ? `No conversations match "${searchQuery}".` : 'No conversations yet. Tap "New chat" to find someone by account ID or email.'}
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = activeRecipient.id === contact.id
                const isSpouse = !!spouseId && contact.id === spouseId
                const unread = !isSelected && (contact.unreadCount || 0) > 0

                return (
                  <button
                    type="button"
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full text-left p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 border ${
                      isSelected
                        ? 'bg-[#0F1C3F] text-white shadow-md border-transparent'
                        : unread
                          ? 'bg-white text-gray-700 border-rose-200'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs shadow-xs ${
                      isSelected
                        ? 'bg-[#C9A84C] text-[#0F1C3F]'
                        : isSpouse
                          ? 'bg-gradient-to-tr from-[#C9A84C] to-[#edd9a4] text-[#0F1C3F]'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {contact.avatar || (contact.name || 'UV').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[13px] font-bold truncate ${isSelected ? 'text-white' : 'text-[#0F1C3F]'}`}>
                          {contact.name}
                        </span>
                        {isSpouse && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                            isSelected ? 'bg-[#C9A84C] text-[#0F1C3F]' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            Spouse
                          </span>
                        )}
                        {contact.role === 'Visitor' && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            Visitor
                          </span>
                        )}
                        <span className={`ml-auto pl-1 text-[10px] flex-shrink-0 ${
                          isSelected ? 'text-gray-300' : unread ? 'text-rose-600 font-bold' : 'text-gray-400'
                        }`}>
                          {listTime(contact.lastAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className={`flex-1 text-[11px] truncate ${
                          isSelected ? 'text-gray-300' : unread ? 'text-gray-900 font-semibold' : 'text-gray-500'
                        }`}>
                          {contact.lastFromMe ? 'You: ' : ''}
                          {contact.bio || 'Open conversation'}
                        </p>
                        {unread && (
                          <span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {contact.unreadCount}
                          </span>
                        )}
                      </div>
                      {contact.accountNumber && (
                        <p className="text-[10px] font-mono mt-0.5 text-gray-400">
                          ID {formatAccountNumber(contact.accountNumber)}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })
            )}
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
              </div>

              <div className="min-w-0 overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-bold text-[#0F1C3F] truncate">
                    {activeRecipient.name}
                  </h3>
                  {isChattingWithSpouse && (
                    <span className="text-[10px] text-[#C9A84C] font-semibold hidden sm:inline">(Spouse)</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 whitespace-nowrap">
                  {activeRecipient.accountNumber && (
                    <>
                      <span className="font-mono">ID {formatAccountNumber(activeRecipient.accountNumber)}</span>
                      <span>·</span>
                    </>
                  )}
                  {activeRecipient.username && (
                    <span className="hidden sm:inline-flex items-center gap-1.5">
                      <Link
                        href={`/u/${activeRecipient.username}`}
                        target="_blank"
                        className="text-[#C9A84C] hover:underline"
                      >
                        Profile
                      </Link>
                      <span>·</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleCopyPartnerInvite}
                    className="text-purple-600 font-semibold hover:underline"
                  >
                    {copiedInvite ? 'Link copied' : 'Invite'}
                  </button>
                </div>
              </div>
            </div>

            {/* Member chat, no spouse yet: ask to link as spouses */}
            {!spouseId &&
              activeRecipient.id &&
              !activeRecipient.id.startsWith('guest_') &&
              // Not while a request is already waiting in this chat (either direction)
              !messages.some((m) => m.type === 'spouse_request' && m.proposalData?.status === 'pending') && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Ask ${activeRecipient.name} to link your accounts as spouses? You'll share a joint vault and approve each other's joint withdrawals.`)) {
                    handleSpouseAction({ action: 'request', userId: activeRecipient.id })
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 flex-shrink-0 cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Link as spouse</span>
              </button>
            )}

            {/* Spousal Action Triggers */}
            {isChattingWithSpouse && (
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <button
                  onClick={() => openReminder(reciprocation?.owedBySpouse || 0)}
                  disabled={isNudging}
                  className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors border border-amber-200 disabled:opacity-50"
                  title="Request money"
                  aria-label="Request money"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">{isNudging ? 'Sending…' : 'Request money'}</span>
                </button>
                <button
                  onClick={() => setShowProposalModal(true)}
                  title="Propose deposit"
                  aria-label="Propose deposit"
                  className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-[#C9A84C]/15 text-[#0F1C3F] hover:bg-[#C9A84C]/25 transition-colors border border-[#C9A84C]/30"
                >
                  <PiggyBank className="w-3.5 h-3.5 text-[#C9A84C]" />
                  <span className="hidden sm:inline">Propose Deposit</span>
                </button>
                <button
                  onClick={() => setShowLoveNoteModal(true)}
                  title="Love note"
                  aria-label="Love note"
                  className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline">Love Note</span>
                </button>
              </div>
            )}
          </div>

          {/* Messages Stream */}
          <div
            ref={messagesContainerRef}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-6 space-y-3 sm:space-y-4 bg-gray-50/50"
          >
            {/* Spouse: what's owed each way, with the matching action */}
            {isChattingWithSpouse && (reciprocation?.pendingDeposits?.length || 0) > 0 && (
              <div className="sticky top-0 z-10 p-3 rounded-2xl bg-rose-50 border border-rose-200 shadow-xs space-y-2">
                <p className="text-xs font-bold text-rose-900">
                  {reciprocation!.pendingDeposits!.length === 1
                    ? `${activeRecipient.name}'s deposit to reciprocate`
                    : `${reciprocation!.pendingDeposits!.length} deposits from ${activeRecipient.name} to reciprocate`}
                </p>
                {reciprocation!.pendingDeposits!.slice(0, 3).map((d) => (
                  <div key={d.messageId} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2">
                    <div className="min-w-0 text-[11px] text-rose-900">
                      <span className="font-bold">${d.amount.toLocaleString()}</span> ·{' '}
                      {new Date(d.depositedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      {d.note && <span className="block truncate text-rose-800/80">&ldquo;{d.note}&rdquo;</span>}
                    </div>
                    <form method="post" action="/pay/match" className="flex-shrink-0">
                      <input type="hidden" name="deposit" value={d.messageId} />
                      <button type="submit" className="px-3 py-1.5 rounded-xl bg-[#0F1C3F] text-white text-[11px] font-bold cursor-pointer">
                        Reciprocate ${d.amount.toLocaleString()}
                      </button>
                    </form>
                  </div>
                ))}
                {reciprocation!.pendingDeposits!.length > 3 && (
                  <p className="text-[11px] text-rose-800">+{reciprocation!.pendingDeposits!.length - 3} more below in the chat</p>
                )}
              </div>
            )}
            {isChattingWithSpouse && (reciprocation?.owedBySpouse || 0) > 0 && (
              <div className="sticky top-0 z-10 p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 shadow-xs">
                <p className="text-xs font-semibold text-amber-900">
                  Waiting for {activeRecipient.name} to reciprocate{' '}
                  {reciprocation!.spousePendingDeposits && reciprocation!.spousePendingDeposits.length > 1
                    ? `${reciprocation!.spousePendingDeposits.length} of your deposits`
                    : `your $${reciprocation!.owedBySpouse.toLocaleString()} deposit`}
                  .
                </p>
                <button
                  type="button"
                  onClick={() => openReminder(reciprocation!.spousePendingDeposits?.[0]?.amount || reciprocation!.owedBySpouse)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-amber-900 text-xs font-bold cursor-pointer"
                >
                  Send reminder
                </button>
              </div>
            )}

            {/* Reminder form: posts to this chat and emails the spouse */}
            {isChattingWithSpouse && showReminder && (
              <form onSubmit={handleSendReminder} className="p-3 rounded-2xl bg-white border border-amber-300 shadow-sm space-y-2">
                <p className="text-xs font-bold text-[#0F1C3F]">Request money from {activeRecipient.name}</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    inputMode="decimal"
                    required
                    value={reminderAmount}
                    onChange={(e) => setReminderAmount(e.target.value)}
                    placeholder="Amount"
                    aria-label="Amount"
                    className="w-28 px-3 py-2 rounded-xl border border-gray-300 text-base sm:text-sm focus:outline-none focus:border-[#C9A84C]"
                  />
                  <input
                    type="text"
                    maxLength={300}
                    value={reminderNote}
                    onChange={(e) => setReminderNote(e.target.value)}
                    placeholder="What it's for (optional)"
                    aria-label="What it's for"
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-300 text-base sm:text-sm focus:outline-none focus:border-[#C9A84C]"
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Sent here in your chat and to {activeRecipient.name}&apos;s email. They pay with one tap; the money goes into your joint vault.
                </p>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowReminder(false)} className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" disabled={isNudging} className="px-3 py-1.5 rounded-xl bg-[#0F1C3F] text-white text-xs font-bold disabled:opacity-50 cursor-pointer">
                    {isNudging ? 'Sending…' : 'Send request'}
                  </button>
                </div>
              </form>
            )}

            {/* Visitors have no account: replies go to their email */}
            {activeRecipient.id.startsWith('guest_') && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                {activeRecipient.name} is a visitor without an account.{' '}
                {activeRecipient.guestEmail
                  ? `Your replies are emailed to ${activeRecipient.guestEmail}, with an invitation to create an account to follow the conversation.`
                  : 'They left no email address, so they will only see replies if they create an account.'}
              </div>
            )}

            {/* Spouse requests from people other than the one in this chat */}
            <SpouseRequestBanner
              requests={(spouseRequests || []).filter((r) => r.fromUserId !== activeRecipient.id)}
              onDone={() => {
                fetchSpouseRequests()
                fetchConversations()
                fetchMessages(false)
              }}
            />

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
                    Your chat link is copied. Anyone signed in who opens it can message you.
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
                <span className="text-xs font-bold text-[#0F1C3F]">Conversation with {activeRecipient.name}</span>
              </div>
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
                    Send a message below.
                  </p>
                </div>
              </div>
            )}

            {/* Messages Rendering */}
            {messages.map((msg) => {
              // A resend can leave older copies of the same request: show only the newest
              if (msg.type === 'spouse_request' && messages.some((m) => m.type === 'spouse_request' && m.senderId === msg.senderId && m.createdAt && msg.createdAt && new Date(m.createdAt) > new Date(msg.createdAt))) {
                return null
              }
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
                        className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${
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
                                : msg.proposalData.status === 'rejected'
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {msg.proposalData.status === 'approved' ? 'Approved' : msg.proposalData.status === 'rejected' ? 'Declined' : 'Awaiting approval'}
                          </span>
                        </div>

                        <div>
                          <span className="text-gray-500 block text-[11px]">For</span>
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
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAnswerProposal(msg.id, 'approve_proposal')}
                                disabled={isApprovingId === msg.id}
                                className="flex-1 py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-black text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                {isApprovingId === msg.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleAnswerProposal(msg.id, 'decline_proposal')}
                                disabled={isApprovingId === msg.id}
                                className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold text-xs cursor-pointer disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-amber-50 text-amber-800 text-[11px] text-center font-medium border border-amber-200">
                              Waiting for {activeRecipient.name} to approve
                            </div>
                          )
                        ) : msg.proposalData.status === 'rejected' ? (
                          <div className="p-2 rounded-lg bg-gray-50 text-gray-600 text-[11px] text-center font-semibold border border-gray-200">
                            Declined
                          </div>
                        ) : (
                          (() => {
                            // Each partner pays half; a share is paid once its deposit card exists
                            const share = Math.round((Number(msg.proposalData.amount) / 2) * 100) / 100
                            const paidBy = (id: string) =>
                              messages.some((m) => m.type === 'deposit_alert' && m.senderId === id && m.depositData?.proposalId === msg.id)
                            const iPaid = paidBy(activeUserId)
                            const theyPaid = paidBy(activeRecipient.id)
                            return (
                              <div className="space-y-2">
                                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200 space-y-0.5">
                                  <p className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    Approved{msg.proposalData.approvedBy ? ` by ${msg.proposalData.approvedBy}` : ''} · ${share.toLocaleString()} each
                                  </p>
                                  <p className="font-medium">
                                    You: {iPaid ? 'paid ✓' : 'not paid yet'} · {activeRecipient.name}: {theyPaid ? 'paid ✓' : 'not paid yet'}
                                  </p>
                                </div>
                                {!iPaid && (
                                  <form method="post" action="/pay/deposit">
                                    <input type="hidden" name="proposal" value={msg.id} />
                                    <button type="submit" className="w-full py-2.5 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2f64] text-white font-bold text-xs cursor-pointer">
                                      Pay my ${share.toLocaleString()} share
                                    </button>
                                  </form>
                                )}
                              </div>
                            )
                          })()
                        )}
                      </div>
                    )}

                    {/* LOVE NOTE CARD */}
                    {msg.type === 'love_note' && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 via-pink-50 to-white border-2 border-rose-200 shadow-xs text-xs space-y-2 min-w-[240px]">
                        <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs border-b border-rose-100 pb-1.5">
                          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                          <span>{msg.loveNoteTitle || 'Love note'}</span>
                        </div>
                        <p className="text-gray-800 text-xs italic leading-relaxed">&ldquo;{msg.text}&rdquo;</p>
                      </div>
                    )}

                    {/* ACTIVITY CARD: deposit alerts, reminders, certificates and any other type */}
                    {msg.type && msg.type !== 'text' && msg.type !== 'love_note' && !(msg.type === 'proposal' && msg.proposalData) && (() => {
                      const kind =
                        msg.type === 'deposit_alert'
                          ? { label: msg.depositData?.isReciprocalMatch ? 'Reciprocated' : 'Vault Deposit', Icon: PiggyBank, tone: 'border-emerald-200 bg-emerald-50/60 text-emerald-700' }
                          : msg.type === 'system_reminder' || msg.type === 'reminder'
                            ? { label: 'Money request', Icon: Bell, tone: 'border-amber-200 bg-amber-50/60 text-amber-700' }
                            : msg.type === 'certificate'
                              ? { label: 'Marriage Certificate', Icon: Award, tone: 'border-[#C9A84C]/50 bg-[#C9A84C]/10 text-[#8a6d1f]' }
                              : msg.type === 'spouse_request'
                                ? { label: 'Spouse request', Icon: Heart, tone: 'border-rose-200 bg-rose-50/60 text-rose-700' }
                                : msg.type === 'invest_invite'
                                  ? { label: 'Invitation to invest', Icon: Sparkles, tone: 'border-indigo-200 bg-indigo-50/60 text-indigo-700' }
                                  : msg.type === 'investment'
                                    ? { label: 'Investment', Icon: TrendingUp, tone: 'border-indigo-200 bg-indigo-50/60 text-indigo-700' }
                                    : msg.type === 'withdrawal'
                                      ? { label: 'Withdrawal', Icon: Wallet, tone: 'border-sky-200 bg-sky-50/60 text-sky-700' }
                                      : { label: 'Update', Icon: Sparkles, tone: 'border-gray-200 bg-white text-gray-600' }
                      const amount = msg.depositData?.amount ?? msg.proposalData?.amount
                      return (
                        <div className={`p-3.5 rounded-2xl border shadow-xs text-xs space-y-2 min-w-[240px] ${kind.tone}`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <kind.Icon className="w-4 h-4" />
                              {kind.label}
                            </span>
                            {amount != null && (
                              <span className="text-sm font-bold text-[#0F1C3F]">
                                ${Number(amount).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-800 text-xs leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                            {msg.text}
                          </p>
                          {reciprocation?.pendingDeposits?.some((d) => d.messageId === msg.id) && (
                            <form method="post" action="/pay/match">
                              <input type="hidden" name="deposit" value={msg.id} />
                              <button
                                type="submit"
                                className="mt-1 w-full py-2.5 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2f64] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <PiggyBank className="w-4 h-4 text-[#C9A84C]" />
                                Reciprocate ${Number(amount).toLocaleString()}
                              </button>
                            </form>
                          )}
                          {msg.type === 'spouse_request' &&
                            ((!!spouseId && spouseId === activeRecipient.id) || msg.proposalData?.status === 'accepted' ? (
                              <p className="text-[11px] font-semibold text-emerald-700">Accepted — you are linked as spouses.</p>
                            ) : msg.proposalData?.status === 'declined' ? (
                              <p className="text-[11px] font-semibold text-gray-500">Declined.</p>
                            ) : msg.proposalData?.toUserId === activeUserId ? (
                              <div className={`grid gap-2 mt-1 ${spouseId ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                {spouseId ? (
                                  <p className="text-[11px] text-gray-500">You are already linked to a spouse.</p>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSpouseAction({ action: 'accept', messageId: msg.id })}
                                    className="py-2.5 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2f64] text-white font-bold text-xs cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleSpouseAction({ action: 'decline', messageId: msg.id })}
                                  className="py-2.5 rounded-xl border border-rose-300 bg-white text-rose-800 font-bold text-xs cursor-pointer"
                                >
                                  Decline
                                </button>
                              </div>
                            ) : msg.senderId === activeUserId ? (
                              <p className="text-[11px] text-gray-500">
                                Only {activeRecipient.name} can accept this. They&apos;ll see Accept on their dashboard and in this chat when they sign in, and we emailed them.{' '}
                                <button
                                  type="button"
                                  onClick={() => handleSpouseAction({ action: 'request', userId: activeRecipient.id })}
                                  className="font-bold text-rose-700 underline cursor-pointer"
                                >
                                  Resend
                                </button>
                              </p>
                            ) : (
                              <p className="text-[11px] text-gray-500">Waiting for a reply.</p>
                            ))}

                          {msg.type === 'investment' && msg.proposalData?.slug && (
                            <Link
                              href={`/investments/${msg.proposalData.slug}`}
                              className="block py-2 rounded-xl border border-indigo-300 bg-white text-indigo-800 font-bold text-xs text-center"
                            >
                              View fund
                            </Link>
                          )}

                          {/* A withdrawal waiting for my approval (until a decision card for it exists) */}
                          {msg.type === 'withdrawal' &&
                            msg.depositData?.status === 'AWAITING_PARTNER' &&
                            !isMe &&
                            !messages.some(
                              (m) =>
                                m.type === 'withdrawal' &&
                                m.depositData?.withdrawalId === msg.depositData?.withdrawalId &&
                                m.depositData?.status !== 'AWAITING_PARTNER',
                            ) && (
                            <Link
                              href="/withdrawals"
                              className="block py-2.5 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2f64] text-white font-bold text-xs text-center"
                            >
                              Review withdrawal
                            </Link>
                          )}

                          {msg.type === 'invest_invite' && msg.proposalData?.slug && (
                            <div className="flex gap-2 pt-1">
                              {msg.proposalData.toUserId === activeUserId && Number(amount) > 0 && (
                                <form method="post" action="/pay/invest" className="flex-1">
                                  <input type="hidden" name="opportunityId" value={msg.proposalData.opportunityId} />
                                  <input type="hidden" name="amount" value={Number(amount)} />
                                  <button type="submit" className="w-full py-2.5 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2f64] text-white font-bold text-xs cursor-pointer">
                                    Invest ${Number(amount).toLocaleString()}
                                  </button>
                                </form>
                              )}
                              <Link
                                href={`/investments/${msg.proposalData.slug}`}
                                className="flex-1 py-2.5 rounded-xl border border-indigo-300 bg-white text-indigo-800 font-bold text-xs text-center"
                              >
                                View fund
                              </Link>
                            </div>
                          )}

                          {/* A money request addressed to me: one tap to pay it */}
                          {(msg.type === 'system_reminder' || msg.type === 'reminder') &&
                            Number(amount) >= 10 &&
                            (msg.proposalData?.toUserId
                              ? msg.proposalData.toUserId === activeUserId
                              : msg.text.includes(`sent ${activeUserName} a reminder`)) && (
                              <form method="post" action="/pay/deposit">
                                <input type="hidden" name="amount" value={Number(amount)} />
                                <button
                                  type="submit"
                                  className="mt-1 w-full py-2.5 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2f64] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <PiggyBank className="w-4 h-4 text-[#C9A84C]" />
                                  Pay ${Number(amount).toLocaleString()}
                                </button>
                              </form>
                            )}
                          {msg.depositData?.bonusMatch ? (
                            <p className="text-[11px] font-semibold text-emerald-700">
                              +${Number(msg.depositData.bonusMatch).toLocaleString()} instant cash match
                            </p>
                          ) : null}
                        </div>
                      )
                    })()}

                    {/* Reactions Bar */}
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      {msg.reactions &&
                        // Only real reactions (who reacted); old seeded counts aren't shown
                        Object.entries(msg.reactions)
                          .filter(([, who]) => Array.isArray(who) && who.length > 0)
                          .map(([emoji, who]) => {
                            const mine = (who as string[]).includes(activeUserId)
                            return (
                              <button
                                key={emoji}
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-2xs ${
                                  mine ? 'bg-[#C9A84C]/15 border-[#C9A84C]' : 'bg-white border-gray-200 hover:border-[#C9A84C]'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span className="text-gray-500 font-mono text-[10px]">{(who as string[]).length}</span>
                              </button>
                            )
                          })}
                      <div className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-1">
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
          <div className="p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-gray-100 bg-white flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Type a message to ${activeRecipient.name}...`}
                className="flex-1 min-w-0 px-4 py-3 text-base sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C] bg-gray-50/50"
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

      {/* ── MODAL: NEW CHAT (find a member by account ID or email) ── */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 bg-[#0F1C3F] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C9A84C]" />
                <h3 className="font-bold text-sm">New chat</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-600">
                Find a member by their account ID or email to chat, add them, or link as spouses. An email that isn&apos;t a member gets an invitation to join.
              </p>
              <FindMember
                hasSpouse={!!spouseId}
                onChat={(m) =>
                  handleSelectContact({
                    id: m.id,
                    name: m.name,
                    username: m.username || undefined,
                    accountNumber: m.accountNumber || undefined,
                    avatar: m.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
                  })
                }
                onChange={fetchConversations}
              />
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[11px] text-gray-500 mb-1.5">Share your ID so others can find you:</p>
                <MyAccountId />
              </div>
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
                <h3 className="font-bold text-sm text-[#0F1C3F]">Propose a Joint Deposit</h3>
              </div>
              <button onClick={() => setShowProposalModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  What it&apos;s for
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. our first home"
                  value={proposalGoal}
                  onChange={(e) => setProposalGoal(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Total Amount ($)
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
                <h3 className="font-bold text-sm text-[#0F1C3F]">Send a Love Note</h3>
              </div>
              <button onClick={() => setShowLoveNoteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendLoveNote} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Title (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Happy anniversary"
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
                Send Note to {activeRecipient.name}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
