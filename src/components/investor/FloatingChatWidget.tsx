'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquareHeart,
  X,
  Minimize2,
  Maximize2,
  Send,
  Heart,
  PiggyBank,
  CheckCheck,
  Volume2,
  VolumeX,
  Shield,
  Smile,
  ExternalLink,
} from 'lucide-react'

interface FloatingMessage {
  id: string
  sender: 'user' | 'partner'
  text: string
  time: string
  type?: 'text' | 'proposal' | 'love_note'
}

export function FloatingChatWidget({
  partnerName = 'Marcus Vance',
}: {
  partnerName?: string
}) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [unreadCount, setUnreadCount] = useState(1)
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<FloatingMessage[]>([
    {
      id: 'm1',
      sender: 'partner',
      text: 'Hey love! I just checked our Joint Marriage Reserve vault. Looking fantastic! ❤️',
      time: '10:42 AM',
      type: 'text',
    },
    {
      id: 'm2',
      sender: 'user',
      text: 'Agreed! Shall we match $250 for the Amalfi Coast trip today?',
      time: '10:44 AM',
      type: 'text',
    },
    {
      id: 'm3',
      sender: 'partner',
      text: 'Absolutely! I am ready to approve whenever you propose it.',
      time: '10:45 AM',
      type: 'text',
    },
    {
      id: 'm4',
      sender: 'partner',
      text: 'I just saved $500 to our Joint Vault! Under our Spousal Covenant (Rule 4.2), your matching reciprocal deposit is now due ❤️',
      time: '11:02 AM',
      type: 'proposal',
    },
  ])

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

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!inputText.trim()) return

    const newMsg: FloatingMessage = {
      id: `float-${Date.now()}`,
      sender: 'user',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, newMsg])
    setInputText('')

    // Sync with server shared chat store
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threadId: 'spouse',
        text: inputText.trim(),
        senderId: 'usr_jane_doe',
        senderName: 'Jane Doe',
        type: 'text',
      }),
    }).catch(() => {})

    setTimeout(() => {
      setIsTyping(true)
    }, 800)

    setTimeout(() => {
      setIsTyping(false)
      const responses = [
        'Got it, darling! Loving our joint portfolio growth! 🥂',
        'Noted! I just checked the dashboard, looking great! ❤️',
        'Sounds perfect. Joint vault balance updated on my end too.',
        '100% on board! Sending you love today! ✨',
      ]
      const chosen = responses[Math.floor(Math.random() * responses.length)]
      const replyMsg: FloatingMessage = {
        id: `float-reply-${Date.now()}`,
        sender: 'partner',
        text: chosen,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, replyMsg])
      playChime()
      if (!isOpen) {
        setUnreadCount((c) => c + 1)
      }
    }, 2400)
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
                  MV
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0F1C3F] rounded-full" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white truncate">{partnerName}</h4>
                  <span className="text-[10px] text-[#C9A84C] font-semibold">(Spouse)</span>
                </div>
                <p className="text-[10px] text-gray-300 truncate flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-[#C9A84C]" />
                  Encrypted Matrimonial Line
                </p>
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
                title="Open Fullscreen Chat Hub"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Minimize Chat"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="px-3.5 py-1.5 bg-[#FCFBF7] border-b border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Mutual Joint Account Synchronized
            </span>
            <Link
              href="/chat"
              className="text-[#C9A84C] font-bold hover:underline flex items-center gap-0.5 text-[10px]"
            >
              Full Hub <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 text-xs">
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
                    {m.type === 'proposal' && (
                      <div className="mt-2 pt-2 border-t border-amber-100 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-amber-800">Rule 4.2 Obligation</span>
                        <Link
                          href="/save"
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0F1C3F] text-[#C9A84C] font-bold text-[10px] hover:bg-[#1a2f64] transition-colors"
                        >
                          Match Deposit →
                        </Link>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 px-1 mt-0.5 text-[9px] text-gray-400">
                    <span>{m.time}</span>
                    {isMe && <CheckCheck className="w-3 h-3 text-[#C9A84C]" />}
                  </div>
                </div>
              )
            })}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-gray-400 text-[10px] pl-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-1">{partnerName} is typing…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Bar */}
          <div className="px-3 py-1.5 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <button
              type="button"
              onClick={() => setInputText('Let’s match $250 today! 💰')}
              className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 flex-shrink-0"
            >
              Match $250
            </button>
            <button
              type="button"
              onClick={() => setInputText('Love you! ❤️')}
              className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 flex-shrink-0"
            >
              Love you ❤️
            </button>
            <button
              type="button"
              onClick={() => setInputText('Checking our vault right now 📊')}
              className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 flex-shrink-0"
            >
              Check Vault
            </button>
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
              placeholder={`Message ${partnerName}…`}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-[#0F1C3F] text-[#C9A84C] hover:bg-[#1a2c5e] disabled:opacity-40 transition-colors shadow-xs"
              title="Send Message"
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
              MV
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0F1C3F] animate-pulse" />
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">Spouse Chat</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[10px] text-gray-300 font-medium">
              {partnerName} · <span className="text-[#C9A84C]">Online</span>
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
