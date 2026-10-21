'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquareHeart,
  Minimize2,
  Maximize2,
  Send,
  Check,
  Volume2,
  VolumeX,
  ExternalLink,
} from 'lucide-react'

interface FloatingMessage {
  id: string
  sender: 'user' | 'partner'
  text: string
  time: string
  type?: 'text' | 'proposal' | 'love_note' | 'deposit_alert' | 'system_reminder' | 'reminder'
  amount?: number
}

export function FloatingChatWidget() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<FloatingMessage[]>([])
  const prevCountRef = useRef(0)
  // Confirmed messages we sent recently (id -> sent time), kept until a poll returns them
  const recentlySentRef = useRef<Map<string, number>>(new Map())

  // Keep the newest message in view
  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, isOpen])
  // Who the server says we are, and our spouse (resolved server-side from the session)
  const [partner, setPartner] = useState<{ id: string; name: string } | null>(null)
  const [pendingMatch, setPendingMatch] = useState<{ owedByMe: number; pendingMessageId: string | null } | null>(null)

  const displayPartnerName = partner?.name || 'Your spouse'
  const partnerInitials = displayPartnerName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const partnerRelation = 'Spouse'

  // Poll /api/chat?thread=spouse for new messages
  const fetchLiveMessages = async () => {
    try {
      const res = await fetch('/api/chat?thread=spouse')
      const data = await res.json()
      if (data.success && Array.isArray(data.messages)) {
        const currentActiveId = data.currentUser?.id
        setPartner(data.recipient ? { id: data.recipient.id, name: data.recipient.name } : null)
        setPendingMatch(data.reciprocation || null)
        const formatted: FloatingMessage[] = data.messages.map((m: any) => ({
          id: m.id,
          sender: m.senderId === currentActiveId ? 'user' : 'partner',
          text: m.text,
          time: m.timestamp || new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: m.type,
          amount: m.depositData?.amount || m.proposalData?.amount,
        }))

        if (formatted.length > prevCountRef.current && prevCountRef.current > 0) {
          const latest = formatted[formatted.length - 1]
          if (latest && latest.sender === 'partner') {
            playChime()
            if (!isOpen) {
              setUnreadCount((c) => c + 1)
            }
          }
        }
        prevCountRef.current = formatted.length

        // Preserve any optimistic messages not yet confirmed by the server
        setMessages((prev) => {
          const now = Date.now()
          const pending = prev.filter((p) => {
            if (formatted.some((f) => f.id === p.id)) return false
            if (p.id.startsWith('float-')) return !formatted.some((f) => f.text === p.text && f.sender === 'user')
            const sentAt = recentlySentRef.current.get(p.id)
            return !!sentAt && now - sentAt < 60_000
          })
          return [...formatted, ...pending]
        })
      }
    } catch (err) {
      console.warn('Failed to fetch floating chat messages:', err)
    }
  }

  useEffect(() => {
    fetchLiveMessages()
    const timer = setInterval(fetchLiveMessages, 3500)

    // BroadcastChannel sync for instant updates across tabs/actions
    let bc: BroadcastChannel | null = null
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('union_verify_chat')
      bc.onmessage = () => {
        fetchLiveMessages()
      }
    }

    return () => {
      clearInterval(timer)
      if (bc) bc.close()
    }
  }, [isOpen])

  const isChatPage = pathname === '/chat' || pathname?.startsWith('/chat')

  // Play synthetic chime via Web Audio API
  function playChime() {
    if (!soundEnabled) return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()

      const now = ctx.currentTime
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = 'sine'
      osc2.type = 'triangle'
      osc1.frequency.setValueAtTime(587.33, now) // D5
      osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.12) // A5
      osc2.frequency.setValueAtTime(880.0, now)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.5)
      osc2.stop(now + 0.5)
    } catch {
      // Audio context policy
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!inputText.trim()) return

    const textToSend = inputText.trim()
    const recipientId = partner?.id
    const recipientName = partner?.name

    const tempId = `float-${Date.now()}`
    const newMsg: FloatingMessage = {
      id: tempId,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
    }

    setMessages((prev) => [...prev, newMsg])
    setInputText('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: 'spouse',
          text: textToSend,
          recipientId,
          recipientName,
          type: 'text',
        }),
      })

      const data = await res.json()
      if (data.success && data.message) {
        recentlySentRef.current.set(data.message.id, Date.now())
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  id: data.message.id,
                  sender: 'user',
                  text: data.message.text,
                  time: data.message.timestamp || new Date(data.message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  type: data.message.type,
                }
              : m
          )
        )
      }

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('union_verify_chat')
        bc.postMessage({ type: 'NEW_MESSAGE' })
        bc.close()
      }
    } catch (err) {
      console.error('Failed to send floating chat message:', err)
    }
  }

  function handleOpenWidget() {
    setIsOpen(true)
    setUnreadCount(0)
  }

  // Don't render on the full chat page to avoid redundancy
  if (isChatPage) {
    return null
  }

  return (
    <>
      {/* ── DOCKED FLOATING CHAT WINDOW (EXPANDED) ── */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[390px] h-[520px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border-2 border-[#C9A84C]/40 flex flex-col overflow-hidden animate-slide-up backdrop-blur-md">
          {/* Header */}
          <div className="px-4 py-3 bg-[#0F1C3F] text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#C9A84C] to-[#edd9a4] text-[#0F1C3F] font-bold flex items-center justify-center text-xs shadow-sm">
                  {partnerInitials}
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white truncate">{displayPartnerName}</h4>
                  <span className="text-[10px] text-[#C9A84C] font-semibold">({partnerRelation})</span>
                </div>
              </div>
            </div>

            {/* Header controls */}
            <div className="flex items-center gap-1 text-gray-300">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={soundEnabled ? 'Mute notification sound' : 'Enable notification chime'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-[#C9A84C]" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>

              <Link
                href="/chat"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Open full chat"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Minimize chat"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="px-3.5 py-1.5 bg-[#FCFBF7] border-b border-gray-100 flex items-center justify-end text-[11px] text-gray-500">
            <Link
              href="/chat"
              className="text-[#C9A84C] font-bold hover:underline flex items-center gap-0.5 text-[10px]"
            >
              Full chat <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 text-xs">
            {messages.length === 0 && (
              <p className="text-center text-[11px] text-gray-400 pt-6">
                {partner ? `No messages with ${displayPartnerName} yet.` : 'No spouse is linked to your account yet.'}
              </p>
            )}
            {messages.map((m) => {
              const isMe = m.sender === 'user'
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-[#0F1C3F] text-white rounded-tr-none'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                    }`}
                  >
                    <p>{m.text}</p>
                    {(m.type === 'proposal' || m.type === 'deposit_alert' || m.type === 'system_reminder') && (
                      <div className="mt-2 pt-2 border-t border-amber-200/50 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-[#C9A84C]">
                          {m.type === 'deposit_alert' ? 'Vault deposit' : 'Reminder'}
                        </span>
                        {pendingMatch && pendingMatch.owedByMe > 0 && pendingMatch.pendingMessageId === m.id && (
                          <form method="post" action="/pay/match">
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0F1C3F] text-[#C9A84C] font-bold text-[10px] hover:bg-[#1a2f64] transition-colors border border-[#C9A84C]/30 cursor-pointer"
                            >
                              Reciprocate ${pendingMatch.owedByMe.toLocaleString()}
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 px-1 mt-0.5 text-[9px] text-gray-400">
                    <span>{m.time}</span>
                    {isMe && <Check className="w-3 h-3 text-[#C9A84C]" />}
                  </div>
                </div>
              )
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 flex-shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${displayPartnerName}…`}
              className="flex-1 min-w-0 px-3.5 py-2 text-base sm:text-xs rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-[#0F1C3F] text-[#C9A84C] hover:bg-[#1a2c5e] disabled:opacity-40 transition-colors shadow-xs"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* ── FLOATING TRIGGER PILL (COLLAPSED STATE) ── */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleOpenWidget}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 inline-flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#0F1C3F] text-white shadow-2xl hover:bg-[#17274f] border border-[#C9A84C]/50 transition-all hover:scale-105 active:scale-95 group backdrop-blur-sm"
          title="Open Spouse Chat"
        >
          <div className="relative flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#C9A84C] to-[#edd9a4] text-[#0F1C3F] font-bold flex items-center justify-center text-[11px] shadow-sm">
              {partnerInitials}
            </div>
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">Spouse Chat</span>
            </div>
            <span className="text-[10px] text-gray-300 font-medium">
              {displayPartnerName}
            </span>
          </div>

          {unreadCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A84C] text-[#0F1C3F] shadow-sm animate-bounce">
              {unreadCount}
            </span>
          )}

          <MessageSquareHeart className="w-4 h-4 text-[#C9A84C] ml-0.5 group-hover:scale-110 transition-transform" />
        </button>
      )}
    </>
  )
}
