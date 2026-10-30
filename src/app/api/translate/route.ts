import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { TranslationNotConfiguredError, isLanguageCode, translateTexts } from '@/lib/translate'

export const dynamic = 'force-dynamic'

const MAX_TEXTS = 25
const MAX_LENGTH = 2000

// ---------------------------------------------------------------------------
// POST /api/translate { texts: string[], target: 'en' }  translate chat messages
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const target = String(body.target || '')
  const texts: string[] = Array.isArray(body.texts) ? body.texts.slice(0, MAX_TEXTS).map((t: unknown) => String(t ?? '').slice(0, MAX_LENGTH)) : []
  if (!isLanguageCode(target) || texts.length === 0) {
    return NextResponse.json({ success: false, error: 'Choose a language and something to translate.' }, { status: 400 })
  }

  try {
    return NextResponse.json({ success: true, translations: await translateTexts(texts, target) })
  } catch (err) {
    if (err instanceof TranslationNotConfiguredError) {
      return NextResponse.json({ success: false, notConfigured: true, error: err.message }, { status: 503 })
    }
    console.error('[translate]', err)
    return NextResponse.json({ success: false, error: 'Translation is unavailable right now. Try again in a moment.' }, { status: 502 })
  }
}
