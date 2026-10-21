import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export interface StripeGatewayConfig {
  secretKey: string
  publishableKey: string
  webhookSecret: string
  mode: 'SANDBOX' | 'TEST' | 'LIVE'
  isPlaceholder: boolean
  isLive: boolean
  webhookUrl: string
}

declare global {
  var __STRIPE_CONFIG: {
    secretKey?: string
    publishableKey?: string
    webhookSecret?: string
  } | undefined
}

export async function getStripeConfig(): Promise<StripeGatewayConfig> {
  // 1. Check in-memory global cache
  let secretKey = globalThis.__STRIPE_CONFIG?.secretKey
  let publishableKey = globalThis.__STRIPE_CONFIG?.publishableKey
  let webhookSecret = globalThis.__STRIPE_CONFIG?.webhookSecret

  // 2. If missing, check database AuditLog
  if (!secretKey || !publishableKey) {
    try {
      const savedLog = await prisma.auditLog.findFirst({
        where: {
          entity: 'SystemSettings',
          action: 'STRIPE_GATEWAY_CONFIG',
        },
        orderBy: { createdAt: 'desc' },
      })

      if (savedLog?.after) {
        const afterData = savedLog.after as any
        if (!secretKey && afterData.secretKey) secretKey = afterData.secretKey
        if (!publishableKey && afterData.publishableKey) publishableKey = afterData.publishableKey
        if (!webhookSecret && afterData.webhookSecret) webhookSecret = afterData.webhookSecret
      }
    } catch (dbErr) {
      console.warn('[getStripeConfig] Database check failed:', dbErr)
    }
  }

  // 3. Fallback to process.env
  if (!secretKey) secretKey = process.env.STRIPE_SECRET_KEY || ''
  if (!publishableKey) publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
  if (!webhookSecret) webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

  // Cache in memory for subsequent requests in this runtime
  globalThis.__STRIPE_CONFIG = {
    secretKey,
    publishableKey,
    webhookSecret,
  }

  const isPlaceholder = !secretKey || secretKey.includes('placeholder')
  const isLive = secretKey.startsWith('sk_live_')
  const mode = isPlaceholder ? 'SANDBOX' : (isLive ? 'LIVE' : 'TEST')

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://unionverify.com').replace(/\/$/, '')
  const webhookUrl = `${appUrl}/api/webhooks/stripe`

  return {
    secretKey,
    publishableKey,
    webhookSecret,
    mode,
    isPlaceholder,
    isLive,
    webhookUrl,
  }
}

/** Show only the key prefix and last 4 characters, e.g. sk_live_…a1b2 */
export function maskSecret(value: string): string {
  if (!value) return ''
  const prefix = value.match(/^(sk|pk|rk|whsec)_(live_|test_)?/)?.[0] || ''
  return `${prefix}…${value.slice(-4)}`
}

/** A masked value echoed back from the admin UI means "unchanged" */
function isMasked(value?: string): boolean {
  return !!value && value.includes('…')
}

export async function saveStripeConfig(params: {
  secretKey?: string
  publishableKey?: string
  webhookSecret?: string
}): Promise<StripeGatewayConfig> {
  const current = await getStripeConfig()

  const pick = (incoming: string | undefined, existing: string) =>
    (incoming !== undefined && !isMasked(incoming) ? incoming : existing).trim()
  const secretKey = pick(params.secretKey, current.secretKey)
  const publishableKey = pick(params.publishableKey, current.publishableKey)
  const webhookSecret = pick(params.webhookSecret, current.webhookSecret)

  // 1. Update in-memory runtime cache
  globalThis.__STRIPE_CONFIG = {
    secretKey,
    publishableKey,
    webhookSecret,
  }

  // 2. Update process.env
  if (secretKey) process.env.STRIPE_SECRET_KEY = secretKey
  if (publishableKey) {
    process.env.STRIPE_PUBLISHABLE_KEY = publishableKey
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = publishableKey
  }
  if (webhookSecret) process.env.STRIPE_WEBHOOK_SECRET = webhookSecret

  // 3. Persist in database
  try {
    await prisma.auditLog.create({
      data: {
        action: 'STRIPE_GATEWAY_CONFIG',
        entity: 'SystemSettings',
        after: {
          secretKey,
          publishableKey,
          webhookSecret,
          updatedAt: new Date().toISOString(),
        },
      },
    })
  } catch (dbErr) {
    console.warn('[saveStripeConfig] Failed saving to database:', dbErr)
  }

  // 4. Safely attempt local file persistence (fails gracefully on read-only serverless filesystems like Vercel)
  try {
    const projectRoot = process.cwd()
    const envPaths = [
      path.join(projectRoot, '.env'),
      path.join(projectRoot, '.env.local'),
    ]

    for (const envPath of envPaths) {
      if (fs.existsSync(/*turbopackIgnore: true*/ envPath)) {
        let content = fs.readFileSync(/*turbopackIgnore: true*/ envPath, 'utf8')

        if (secretKey) {
          if (content.includes('STRIPE_SECRET_KEY=')) {
            content = content.replace(/STRIPE_SECRET_KEY=.*/g, `STRIPE_SECRET_KEY="${secretKey}"`)
          } else {
            content += `\nSTRIPE_SECRET_KEY="${secretKey}"`
          }
        }

        if (publishableKey) {
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
        }

        if (webhookSecret) {
          if (content.includes('STRIPE_WEBHOOK_SECRET=')) {
            content = content.replace(/STRIPE_WEBHOOK_SECRET=.*/g, `STRIPE_WEBHOOK_SECRET="${webhookSecret}"`)
          } else {
            content += `\nSTRIPE_WEBHOOK_SECRET="${webhookSecret}"`
          }
        }

        fs.writeFileSync(/*turbopackIgnore: true*/ envPath, content, 'utf8')
      }
    }
  } catch (fsErr) {
    // Read-only filesystem on Vercel is completely normal; memory + DB storage handles persistence
    console.info('[saveStripeConfig] Local env write skipped (serverless read-only filesystem)')
  }

  return getStripeConfig()
}
