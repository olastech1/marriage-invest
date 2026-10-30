'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Languages } from 'lucide-react'

type Translation = { text: string; from: string }
type Result = Translation | 'loading' | 'error' | 'unavailable'

// The browser's on-device translator (recent desktop Chrome), used when the server has no translation key
interface DeviceDetector {
  detect(text: string): Promise<{ detectedLanguage: string; confidence: number }[]>
}
interface DeviceTranslator {
  translate(text: string): Promise<string>
}
type DeviceApis = {
  LanguageDetector?: { create(): Promise<DeviceDetector> }
  Translator?: {
    availability(pair: { sourceLanguage: string; targetLanguage: string }): Promise<string>
    create(pair: { sourceLanguage: string; targetLanguage: string }): Promise<DeviceTranslator>
  }
}
let detector: Promise<DeviceDetector> | null = null
const deviceTranslators = new Map<string, Promise<DeviceTranslator>>()
// Set once the server says it has no key, so it isn't asked again
let serverOff = false

async function translateOnDevice(text: string, target: string): Promise<Translation | null> {
  const apis = globalThis as unknown as DeviceApis
  if (!apis.Translator || !apis.LanguageDetector) return null
  try {
    detector ??= apis.LanguageDetector.create()
    const [best] = await (await detector).detect(text)
    const from = base(best?.detectedLanguage || '')
    const to = base(target)
    if (!from || from === 'und') return null
    if (from === to) return { text, from }
    if ((await apis.Translator.availability({ sourceLanguage: from, targetLanguage: to })) === 'unavailable') return null
    const pair = `${from}>${to}`
    if (!deviceTranslators.has(pair)) deviceTranslators.set(pair, apis.Translator.create({ sourceLanguage: from, targetLanguage: to }))
    return { text: await (await deviceTranslators.get(pair)!).translate(text), from }
  } catch {
    return null
  }
}

export const LANGUAGES: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'ar', name: 'العربية' },
  { code: 'zh-CN', name: '中文' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'ru', name: 'Русский' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'yo', name: 'Yorùbá' },
  { code: 'ig', name: 'Igbo' },
  { code: 'ha', name: 'Hausa' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'am', name: 'አማርኛ' },
  { code: 'zu', name: 'isiZulu' },
]

const STORE_LANG = 'uv-translate-lang'
const STORE_AUTO = 'uv-translate-auto'

const read = (key: string) => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}
const write = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // private mode: the choice just isn't remembered
  }
}

/** "fr" -> "French" in the reader's language */
export function languageName(code: string, inLanguage: string) {
  try {
    return new Intl.DisplayNames([inLanguage], { type: 'language' }).of(code) || code
  } catch {
    return code
  }
}

const base = (code: string) => code.split('-')[0].toLowerCase()

/** My saved language, else the device's (only read in the browser; chats render after load) */
function initialLanguage() {
  if (typeof window === 'undefined') return 'en'
  const saved = read(STORE_LANG)
  const match = LANGUAGES.find((l) => l.code === saved) || LANGUAGES.find((l) => base(l.code) === base(navigator.language || 'en'))
  return match?.code || 'en'
}

/** Translations of chat messages into my language, by message id; optional auto-translate */
export function useChatTranslator(messages: { id: string; text: string; type?: string; senderId?: string }[], myId: string) {
  const [lang, setLangState] = useState(initialLanguage)
  const [auto, setAutoState] = useState(() => typeof window !== 'undefined' && read(STORE_AUTO) === '1')
  const [results, setResults] = useState<Record<string, Result>>({})
  const [original, setOriginal] = useState<Record<string, boolean>>({})
  const asked = useRef(new Set<string>())

  const setLang = (code: string) => {
    setLangState(code)
    write(STORE_LANG, code)
  }
  const setAuto = (on: boolean) => {
    setAutoState(on)
    write(STORE_AUTO, on ? '1' : '0')
  }

  const key = (id: string) => `${lang}|${id}`

  const translate = useCallback(
    async (items: { id: string; text: string }[]) => {
      const todo = items.filter((m) => !asked.current.has(`${lang}|${m.id}`)).slice(0, 25)
      if (!todo.length) return
      todo.forEach((m) => asked.current.add(`${lang}|${m.id}`))
      setResults((r) => ({ ...r, ...Object.fromEntries(todo.map((m) => [`${lang}|${m.id}`, 'loading' as const])) }))
      try {
        let translations: (Translation | null)[] | null = null
        if (!serverOff) {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: todo.map((m) => m.text), target: lang }),
          })
          const data = await res.json()
          if (data.notConfigured) serverOff = true
          else if (data.success) translations = data.translations
          else throw new Error()
        }
        // No translation key on the server: try the browser's own translator
        translations ??= await Promise.all(todo.map((m) => translateOnDevice(m.text, lang)))
        const done = translations
        setResults((r) => ({
          ...r,
          ...Object.fromEntries(todo.map((m, i) => [`${lang}|${m.id}`, (done[i] || 'unavailable') as Result])),
        }))
      } catch {
        todo.forEach((m) => asked.current.delete(`${lang}|${m.id}`))
        setResults((r) => ({ ...r, ...Object.fromEntries(todo.map((m) => [`${lang}|${m.id}`, 'error' as const])) }))
      }
    },
    [lang],
  )

  // Auto-translate: messages from other people
  useEffect(() => {
    if (!auto) return
    const incoming = messages.filter((m) => (!m.type || m.type === 'text') && m.senderId !== myId && m.text?.trim())
    translate(incoming.slice(-25))
  }, [auto, messages, myId, translate])

  return {
    lang,
    setLang,
    auto,
    setAuto,
    translate,
    result: (id: string): Result | undefined => results[key(id)],
    /** The translated text to show instead of the original, if any */
    shown: (id: string): Translation | null => {
      const r = results[key(id)]
      return r && typeof r === 'object' && r.text && r.from && base(r.from) !== base(lang) && !original[key(id)] ? r : null
    },
    showingOriginal: (id: string) => !!original[key(id)],
    toggleOriginal: (id: string) => setOriginal((o) => ({ ...o, [key(id)]: !o[key(id)] })),
  }
}

export type ChatTranslator = ReturnType<typeof useChatTranslator>

/** Under a message from someone else: Translate / Translated from … · See original */
export function TranslateLine({ translator, id, text }: { translator: ChatTranslator; id: string; text: string }) {
  const r = translator.result(id)
  const cls = 'text-[10px] font-semibold text-gray-400 hover:text-[#0F1C3F] cursor-pointer'
  if (!r) {
    return (
      <button type="button" className={cls} onClick={() => translator.translate([{ id, text }])}>
        Translate
      </button>
    )
  }
  if (r === 'loading') return <span className="text-[10px] text-gray-400">Translating…</span>
  if (r === 'unavailable') return <span className="text-[10px] text-gray-400">Translation isn&apos;t available on this device yet.</span>
  if (r === 'error') {
    return (
      <button type="button" className={`${cls} text-rose-500`} onClick={() => translator.translate([{ id, text }])}>
        Couldn&apos;t translate. Try again
      </button>
    )
  }
  if (!r.from || base(r.from) === base(translator.lang)) {
    return translator.auto ? null : <span className="text-[10px] text-gray-400">Already in {languageName(translator.lang, translator.lang)}</span>
  }
  return (
    <span className="text-[10px] text-gray-400">
      {translator.showingOriginal(id) ? 'Original' : `Translated from ${languageName(r.from, translator.lang)}`} ·{' '}
      <button type="button" className={cls} onClick={() => translator.toggleOriginal(id)}>
        {translator.showingOriginal(id) ? 'See translation' : 'See original'}
      </button>
    </span>
  )
}

/** Header control: my language and auto-translate */
export function TranslateSettings({ translator }: { translator: ChatTranslator }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const current = LANGUAGES.find((l) => l.code === translator.lang)
  return (
    <div ref={box} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-0.5 font-semibold hover:underline cursor-pointer ${translator.auto ? 'text-emerald-600' : 'text-gray-500'}`}
        aria-label="Translation settings"
      >
        <Languages className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{current?.code.split('-')[0].toUpperCase() || 'EN'}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-40 w-60 rounded-2xl border border-gray-200 bg-white shadow-xl p-3 space-y-3 text-xs text-gray-700 whitespace-normal">
          <p className="font-bold text-[#0F1C3F] text-sm">Translate messages</p>
          <label className="block">
            <span className="text-[11px] text-gray-500">My language</span>
            <select
              value={translator.lang}
              onChange={(e) => translator.setLang(e.target.value)}
              className="mt-1 w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm bg-white"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center justify-between gap-2 cursor-pointer">
            <span>
              <span className="block font-semibold">Auto-translate</span>
              <span className="block text-[11px] text-gray-500">Messages in other languages appear in yours.</span>
            </span>
            <input type="checkbox" checked={translator.auto} onChange={(e) => translator.setAuto(e.target.checked)} className="w-4 h-4 accent-[#0F1C3F]" />
          </label>
          <p className="text-[10px] text-gray-400">Machine translation can be wrong. Tap &ldquo;See original&rdquo; on any message.</p>
        </div>
      )}
    </div>
  )
}
