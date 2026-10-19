import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getStripeConfig, saveStripeConfig } from '@/lib/stripeConfig'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 })
    }

    const config = await getStripeConfig()

    return NextResponse.json({
      success: true,
      publishableKey: config.publishableKey,
      secretKey: config.secretKey,
      webhookSecret: config.webhookSecret,
      rawSecretKeyPresent: Boolean(config.secretKey && !config.isPlaceholder),
      rawWebhookSecretPresent: Boolean(config.webhookSecret && !config.isPlaceholder),
      isPlaceholder: config.isPlaceholder,
      isLive: config.isLive,
      mode: config.mode,
      currency: 'USD',
      webhookUrl: config.webhookUrl,
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

    const updatedConfig = await saveStripeConfig({
      secretKey,
      publishableKey,
      webhookSecret,
    })

    return NextResponse.json({
      success: true,
      message: 'Stripe payment configuration saved successfully!',
      mode: updatedConfig.mode,
      config: {
        secretKey: updatedConfig.secretKey,
        publishableKey: updatedConfig.publishableKey,
        webhookSecret: updatedConfig.webhookSecret,
        mode: updatedConfig.mode,
        isLive: updatedConfig.isLive,
        isPlaceholder: updatedConfig.isPlaceholder,
      },
    })
  } catch (error: any) {
    console.error('[POST /api/admin/payments]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
