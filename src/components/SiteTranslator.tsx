'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'

/**
 * Shows the whole site in the visitor's browser language (anything but English).
 * Text on the page is swapped for its translation in place (the page itself isn't
 * changed), including text that appears later. Translations come from
 * /api/translate/site and are kept on the device for instant reuse.
 * Elements marked translate="no" (e.g. chat messages, which have their own
 * translator) are left alone. "Show original" turns it off on this device.
 */

const PREF = 'uv-site-translate'
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'svg', 'SVG'])
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'] as const
const HAS_LETTERS = /\p{L}/u
/** Left as they are: emails, links, initials and codes like "ID 1234 5678" */
const KEEP = /^(\S+@\S+\.\S+|https?:\/\/\S+|www\.\S+|[A-Z]{1,3}|ID[\s\d]+|[A-Z0-9-]{2,}\d[A-Z0-9-]*)$/
const translatable = (core: string) => !!core && core.length <= 500 && HAS_LETTERS.test(core) && !KEEP.test(core)
const MAX_SAVED = 4000

/** The browser's language as a translation target, or null for English */
function browserLanguage(): string | null {
  const tag = (navigator.languages?.[0] || navigator.language || 'en').toLowerCase()
  const base = tag.split('-')[0]
  if (!base || base === 'en') return null
  if (base === 'zh') return /tw|hk|mo|hant/.test(tag) ? 'zh-TW' : 'zh-CN'
  return base
}

const readPref = () => {
  try {
    return localStorage.getItem(PREF)
  } catch {
    return null
  }
}

const noSubscribe = () => () => {}

export default function SiteTranslator() {
  const pathname = usePathname()
  // Read in the browser only (the server renders the page in English)
  const lang = useSyncExternalStore(noSubscribe, browserLanguage, () => null)
  const on = useSyncExternalStore(noSubscribe, () => readPref() !== 'off', () => false)
  const [working, setWorking] = useState(false)
  // Something is shown translated (stays hidden when translation isn't set up)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const target = lang
    if (!target || !on) return
    document.documentElement.lang = target

    const storeKey = `uv-tr:${target}`
    const dict = new Map<string, string>()
    try {
      for (const [k, v] of JSON.parse(localStorage.getItem(storeKey) || '[]') as [string, string][]) dict.set(k, v)
    } catch {
      // No copy on this device yet
    }
    const save = () => {
      try {
        localStorage.setItem(storeKey, JSON.stringify([...dict].slice(-MAX_SAVED)))
      } catch {
        // Storage full: still works, just fetches again next time
      }
    }

    // What we put in each text node / attribute, so our own changes aren't translated again
    const appliedText = new WeakMap<Text, string>()
    const appliedAttr = new WeakMap<Element, Map<string, string>>()
    // English waiting for a translation, and where it goes
    const waitingText = new Map<string, Set<Text>>()
    const waitingAttr = new Map<string, Set<[Element, string]>>()
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const skipped = (el: Element | null) => !el || SKIP.has(el.tagName) || !!el.closest('[translate="no"],[contenteditable="true"]')

    /** Keep the spaces around the words, translate the words */
    const split = (value: string) => {
      const m = value.match(/^(\s*)([\s\S]*?)(\s*)$/)!
      return { lead: m[1], core: m[2], trail: m[3] }
    }

    const setText = (node: Text, value: string) => {
      const { lead, core, trail } = split(value)
      const out = `${lead}${dict.get(core)}${trail}`
      appliedText.set(node, out)
      if (node.nodeValue !== out) node.nodeValue = out
      setReady(true)
    }

    const visitText = (node: Text) => {
      const value = node.nodeValue || ''
      if (appliedText.get(node) === value || skipped(node.parentElement)) return
      const { core } = split(value)
      if (!translatable(core)) return
      if (dict.has(core)) return setText(node, value)
      if (!waitingText.has(core)) waitingText.set(core, new Set())
      waitingText.get(core)!.add(node)
      schedule()
    }

    const visitAttrs = (el: Element) => {
      // Inputs keep what people type, but their placeholder and label are translated
      if (!el || el.closest('[translate="no"],[contenteditable="true"]') || ['SCRIPT', 'STYLE', 'svg', 'SVG'].includes(el.tagName)) return
      for (const name of ATTRS) {
        const value = el.getAttribute(name)
        if (!value || appliedAttr.get(el)?.get(name) === value) continue
        const core = value.trim()
        if (!translatable(core)) continue
        if (dict.has(core)) {
          if (!appliedAttr.has(el)) appliedAttr.set(el, new Map())
          appliedAttr.get(el)!.set(name, dict.get(core)!)
          el.setAttribute(name, dict.get(core)!)
          continue
        }
        if (!waitingAttr.has(core)) waitingAttr.set(core, new Set())
        waitingAttr.get(core)!.add([el, name])
        schedule()
      }
    }

    const scan = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) return visitText(root as Text)
      if (root.nodeType !== Node.ELEMENT_NODE) return
      const el = root as Element
      if (skipped(el)) return
      visitAttrs(el)
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
        acceptNode: (n) =>
          n.nodeType !== Node.ELEMENT_NODE
            ? NodeFilter.FILTER_ACCEPT
            : (n as Element).getAttribute('translate') === 'no' || ['SCRIPT', 'STYLE', 'svg', 'SVG'].includes((n as Element).tagName)
              ? NodeFilter.FILTER_REJECT
              : // An input's own text isn't walked, but its placeholder is
                SKIP.has((n as Element).tagName)
                ? (visitAttrs(n as Element), NodeFilter.FILTER_REJECT)
                : NodeFilter.FILTER_ACCEPT,
      })
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (n.nodeType === Node.TEXT_NODE) visitText(n as Text)
        else visitAttrs(n as Element)
      }
    }

    const schedule = () => {
      if (!timer && !stopped) timer = setTimeout(flush, 120)
    }

    const flush = async () => {
      timer = null
      const words = [...new Set([...waitingText.keys(), ...waitingAttr.keys()])].filter((w) => !dict.has(w))
      if (!words.length) return
      setWorking(true)
      for (let i = 0; i < words.length && !stopped; i += 100) {
        const batch = words.slice(i, i + 100)
        const res = await fetch('/api/translate/site', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target, texts: batch }),
        }).catch(() => null)
        const data = await res?.json().catch(() => null)
        // Not set up (no translation key) or failing: leave the page in English
        if (!data?.success) {
          if (data?.notConfigured) stopped = true
          break
        }
        batch.forEach((w, n) => {
          const t = data.translations?.[n]
          if (typeof t === 'string' && t) dict.set(w, t)
        })
      }
      // Put the translations in place
      for (const [core, nodes] of waitingText) {
        if (!dict.has(core)) continue
        for (const node of nodes) if (node.isConnected && split(node.nodeValue || '').core === core) setText(node, node.nodeValue || '')
        waitingText.delete(core)
      }
      for (const [core, pairs] of waitingAttr) {
        if (!dict.has(core)) continue
        for (const [el, name] of pairs) {
          if (!el.isConnected || el.getAttribute(name)?.trim() !== core) continue
          if (!appliedAttr.has(el)) appliedAttr.set(el, new Map())
          appliedAttr.get(el)!.set(name, dict.get(core)!)
          el.setAttribute(name, dict.get(core)!)
        }
        waitingAttr.delete(core)
      }
      save()
      setWorking(false)
    }

    // After the first paint, so the page appears at once
    const first = requestAnimationFrame(() => scan(document.body))
    // New pages, new messages, changed text: translate those too
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === 'characterData') visitText(r.target as Text)
        else if (r.type === 'attributes') visitAttrs(r.target as Element)
        else r.addedNodes.forEach(scan)
      }
    })
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] })
    return () => {
      stopped = true
      cancelAnimationFrame(first)
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [lang, on])

  if (!lang || (on && !ready) || pathname?.startsWith('/chat')) return null
  let name = lang
  try {
    name = new Intl.DisplayNames([lang], { type: 'language' }).of(lang) || lang
  } catch {
    // Unknown code: show it as is
  }

  const toggle = () => {
    try {
      localStorage.setItem(PREF, on ? 'off' : 'on')
    } catch {
      // Can't remember the choice; it still applies for this visit
    }
    window.location.reload()
  }

  return (
    <button
      type="button"
      translate="no"
      onClick={toggle}
      className="fixed bottom-3 left-3 z-40 px-3 py-1.5 rounded-full bg-white/95 border border-gray-200 shadow-md text-[11px] font-semibold text-[#0F1C3F] flex items-center gap-1.5 cursor-pointer print:hidden"
    >
      <Globe className={`w-3.5 h-3.5 text-[#C9A84C] ${working ? 'animate-spin' : ''}`} />
      {on ? `${name} · Show original` : `Translate to ${name}`}
    </button>
  )
}
