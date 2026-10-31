import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { TranslationNotConfiguredError, isLanguageCode, translateTexts } from '@/lib/translate'

export const dynamic = 'force-dynamic'

const MAX_TEXTS = 100
const MAX_LENGTH = 500
/** New (not yet saved) characters one visitor may send to Google per hour, on one server */
const PER_IP_HOURLY = 60_000
/** New characters sent to Google per day, for the whole site */
const DAILY_LIMIT = 1_000_000

const perIp = new Map<string, { at: number; chars: number }>()
const idFor = (target: string, text: string) => crypto.createHash('sha256').update(`${target}|${text}`).digest('hex')

/** Count new characters against today's site-wide limit; false once it's used up */
async function withinDailyLimit(chars: number) {
  const key = `translate.usage.${new Date().toISOString().slice(0, 10)}`
  const row = await prisma.appSetting.findUnique({ where: { key } })
  const used = Number((row?.value as { chars?: number } | null)?.chars || 0)
  if (used + chars > DAILY_LIMIT) return false
  await prisma.appSetting.upsert({
    where: { key },
    update: { value: { chars: used + chars } as Prisma.InputJsonValue },
    create: { key, value: { chars } as Prisma.InputJsonValue },
  })
  return true
}

// ---------------------------------------------------------------------------
// POST /api/translate/site { target, texts[] }  the site's words in a visitor's
// language (anyone, signed in or not). Each text is translated once per
// language and kept; answers come back in the same order.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const target = String(body.target || '').toLowerCase()
  const texts: string[] = Array.isArray(body.texts)
    ? body.texts.slice(0, MAX_TEXTS).map((t: unknown) => String(t ?? '').slice(0, MAX_LENGTH))
    : []
  if (!isLanguageCode(target) || target === 'en' || !texts.length) {
    return NextResponse.json({ success: false, error: 'Nothing to translate.' }, { status: 400 })
  }

  const ids = texts.map((t) => idFor(target, t))
  const saved = new Map(
    (await prisma.siteTranslation.findMany({ where: { id: { in: ids } }, select: { id: true, translated: true } })).map((r) => [r.id, r.translated]),
  )
  const missing = [...new Set(texts.filter((t, i) => !saved.has(ids[i])))]

  if (missing.length) {
    const chars = missing.reduce((n, t) => n + t.length, 0)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const now = Date.now()
    const mine = perIp.get(ip)
    const used = mine && now - mine.at < 3600_000 ? mine.chars : 0
    if (used + chars > PER_IP_HOURLY || !(await withinDailyLimit(chars))) {
      // Over the limit: what's saved is still sent, the rest stays in English
      return NextResponse.json({ success: true, limited: true, translations: texts.map((t, i) => saved.get(ids[i]) ?? null) })
    }
    perIp.set(ip, { at: mine && now - mine.at < 3600_000 ? mine.at : now, chars: used + chars })
    if (perIp.size > 5000) perIp.delete(perIp.keys().next().value as string)

    try {
      const results = await translateTexts(missing, target)
      const rows = missing.map((text, n) => ({ id: idFor(target, text), target, text, translated: results[n]?.text || text }))
      await prisma.siteTranslation.createMany({ data: rows, skipDuplicates: true })
      for (const r of rows) saved.set(r.id, r.translated)
    } catch (err) {
      if (err instanceof TranslationNotConfiguredError) {
        return NextResponse.json({ success: false, notConfigured: true, error: err.message }, { status: 503 })
      }
      console.error('[translate/site]', err)
      return NextResponse.json({ success: false, error: 'Translation is unavailable right now.' }, { status: 502 })
    }
  }

  return NextResponse.json({ success: true, translations: texts.map((t, i) => saved.get(ids[i]) ?? null) })
}
