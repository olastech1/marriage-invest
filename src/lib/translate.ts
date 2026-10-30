/**
 * Translates chat messages into the reader's language with Google Cloud
 * Translation (set GOOGLE_TRANSLATE_API_KEY). Without a key the chat falls back
 * to the browser's own on-device translator where the browser has one.
 */

export type Translation = { text: string; from: string }

const TIMEOUT_MS = 6000
const CACHE_MS = 24 * 60 * 60 * 1000
const cache = new Map<string, { at: number; value: Translation }>()

export const isLanguageCode = (value: string) => /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(value)

async function viaCloud(texts: string[], target: string, key: string): Promise<Translation[]> {
  const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: texts, target, format: 'text' }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`Translation failed (${res.status})`)
  const data = await res.json()
  return (data?.data?.translations || []).map((t: { translatedText?: string; detectedSourceLanguage?: string }) => ({
    text: String(t.translatedText || ''),
    from: String(t.detectedSourceLanguage || ''),
  }))
}

export class TranslationNotConfiguredError extends Error {
  constructor() {
    super('Translation is not set up yet.')
  }
}

/** Translate each text into `target` (e.g. "en", "fr"); results are in the same order */
export async function translateTexts(texts: string[], target: string): Promise<Translation[]> {
  const out: (Translation | null)[] = texts.map((t) => {
    const hit = cache.get(`${target}|${t}`)
    return hit && Date.now() - hit.at < CACHE_MS ? hit.value : null
  })
  const missing = texts.map((t, i) => (out[i] ? -1 : i)).filter((i) => i >= 0)
  if (missing.length) {
    const key = process.env.GOOGLE_TRANSLATE_API_KEY
    if (!key) throw new TranslationNotConfiguredError()
    const results = await viaCloud(missing.map((i) => texts[i]), target, key)
    missing.forEach((i, n) => {
      const value = results[n] || { text: texts[i], from: '' }
      out[i] = value
      if (cache.size > 2000) cache.delete(cache.keys().next().value as string)
      cache.set(`${target}|${texts[i]}`, { at: Date.now(), value })
    })
  }
  return out as Translation[]
}
