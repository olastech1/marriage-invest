import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSettings, updateSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  return NextResponse.json({ success: true, settings: await getSettings() })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  try {
    const body = await req.json()
    const settings = await updateSettings({ vaultApy: body.vaultApy, bonusMatchRate: body.bonusMatchRate })
    return NextResponse.json({ success: true, settings })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
