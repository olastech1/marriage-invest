import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

function maskSecret(val: string | undefined): string {
  if (!val || val.includes('placeholder')) return val || ''
  if (val.length <= 8) return '••••••••'
  return `${val.slice(0, 7)}••••••••${val.slice(-4)}`
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 })
    }

    const secretKey = process.env.STRIPE_SECRET_KEY || ''
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

    const isPlaceholder = !secretKey || secretKey.includes('placeholder')
    const isLive = secretKey.startsWith('sk_live_')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://unionverify.com'
    const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/webhooks/stripe`

    return NextResponse.json({
      success: true,
      publishableKey,
      secretKey: isPlaceholder ? secretKey : maskSecret(secretKey),
      rawSecretKeyPresent: Boolean(secretKey && !isPlaceholder),
      webhookSecret: isPlaceholder ? webhookSecret : maskSecret(webhookSecret),
      rawWebhookSecretPresent: Boolean(webhookSecret && !isPlaceholder),
      isPlaceholder,
      isLive,
      mode: isPlaceholder ? 'SANDBOX_SIMULATION' : (isLive ? 'LIVE' : 'TEST'),
      currency: 'USD',
      webhookUrl,
      supportedEvents: [
        'checkout.session.completed',
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'charge.refunded',
      ],
    })
  } catch (error: any) {
    console.error('[GET /api/admin/payments]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 })
    }

    const body = await req.json()
    const { secretKey, publishableKey, webhookSecret } = body

    if (!secretKey && !publishableKey && !webhookSecret) {
      return NextResponse.json({ error: 'At least one Stripe key must be provided.' }, { status: 400 })
    }

    // Path to .env and .env.local
    const projectRoot = process.cwd()
    const envPaths = [
      path.join(projectRoot, '.env'),
      path.join(projectRoot, '.env.local'),
    ]

    for (const envPath of envPaths) {
      if (fs.existsSync(/*turbopackIgnore: true*/ envPath)) {
        let content = fs.readFileSync(/*turbopackIgnore: true*/ envPath, 'utf8')

        if (secretKey !== undefined && secretKey !== '') {
          if (content.includes('STRIPE_SECRET_KEY=')) {
            content = content.replace(/STRIPE_SECRET_KEY=.*/g, `STRIPE_SECRET_KEY="${secretKey}"`)
          } else {
            content += `\nSTRIPE_SECRET_KEY="${secretKey}"`
          }
          process.env.STRIPE_SECRET_KEY = secretKey
        }

        if (publishableKey !== undefined && publishableKey !== '') {
          if (content.includes('STRIPE_PUBLISHABLE_KEY=')) {
            content = content.replace(/STRIPE_PUBLISHABLE_KEY=.*/g, `STRIPE_PUBLISHABLE_KEY="${publishableKey}"`)
          } else {
            content += `\nSTRIPE_PUBLISHABLE_KEY="${publishableKey}"`
          }
          if (content.includes('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=')) {
            content = content.replace(/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=.*/g, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="${publishableKey}"`)
          } else {
            content += `\nNEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="${publishableKey}"`
          }
          process.env.STRIPE_PUBLISHABLE_KEY = publishableKey
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = publishableKey
        }

        if (webhookSecret !== undefined && webhookSecret !== '') {
          if (content.includes('STRIPE_WEBHOOK_SECRET=')) {
            content = content.replace(/STRIPE_WEBHOOK_SECRET=.*/g, `STRIPE_WEBHOOK_SECRET="${webhookSecret}"`)
          } else {
            content += `\nSTRIPE_WEBHOOK_SECRET="${webhookSecret}"`
          }
          process.env.STRIPE_WEBHOOK_SECRET = webhookSecret
        }

        fs.writeFileSync(/*turbopackIgnore: true*/ envPath, content, 'utf8')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Stripe payment configuration saved successfully to environment.',
      mode: secretKey?.startsWith('sk_live_') ? 'LIVE' : (secretKey?.includes('placeholder') ? 'SANDBOX' : 'TEST'),
    })
  } catch (error: any) {
    console.error('[POST /api/admin/payments]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
