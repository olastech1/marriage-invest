import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

// Public platform settings (vault rate, promo match rate)
export async function GET() {
  try {
    return NextResponse.json({ success: true, settings: await getSettings() })
  } catch (error: any) {
    console.error('[GET /api/settings]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
