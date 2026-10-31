/**
 * Stripe keys, set by the admin in Admin → Settings → Payments & Stripe.
 * Stored in app_settings (key "stripe.gateway"), with the secret key and the
 * webhook secret encrypted (AES-256-GCM, key derived from AUTH_SECRET). Keys
 * saved here win over the STRIPE_* environment variables, which stay as the
 * fallback. Every server instance reads the database (cached for a few
 * seconds), so a change applies everywhere straight away.
 */

import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { siteUrl } from '@/lib/site'

export interface StripeGatewayConfig {
  secretKey: string
  publishableKey: string
  webhookSecret: string
  mode: 'SANDBOX' | 'TEST' | 'LIVE'
  isPlaceholder: boolean
  isLive: boolean
  webhookUrl: string
  /** Where the keys come from: saved by an admin, or the environment */
  source: 'admin' | 'environment' | 'none'
}

type Keys = { secretKey: string; publishableKey: string; webhookSecret: string }
type Stored = { secretKey?: string; publishableKey?: string; webhookSecret?: string; updatedAt?: string; updatedById?: string }

const SETTING_KEY = 'stripe.gateway'
const CACHE_MS = 5000
let cache: { at: number; keys: Keys | null } | null = null

// ── Encryption of the secrets at rest ────────────────────────────────────────
function cipherKey() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set, so Stripe keys cannot be stored safely.')
  return crypto.createHash('sha256').update(`stripe-keys:${secret}`).digest()
}

function encrypt(value: string): string {
  if (!value) return ''
  const iv = crypto.randomBytes(12)
  const c = crypto.createCipheriv('aes-256-gcm', cipherKey(), iv)
  const data = Buffer.concat([c.update(value, 'utf8'), c.final()])
  return `enc:v1:${Buffer.concat([iv, c.getAuthTag(), data]).toString('base64')}`
}

function decrypt(value: string | undefined): string {
  if (!value) return ''
  if (!value.startsWith('enc:v1:')) return value
  try {
    const raw = Buffer.from(value.slice(7), 'base64')
    const d = crypto.createDecipheriv('aes-256-gcm', cipherKey(), raw.subarray(0, 12))
    d.setAuthTag(raw.subarray(12, 28))
    return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString('utf8')
  } catch {
    console.error('[stripeConfig] Saved Stripe keys could not be decrypted (was AUTH_SECRET changed?). Save them again in Admin → Settings.')
    return ''
  }
}

// ── Reading ─────────────────────────────────────────────────────────────────
async function savedKeys(): Promise<Keys | null> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.keys
  let keys: Keys | null = null
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } })
    if (row) {
      const v = row.value as Stored
      keys = { secretKey: decrypt(v.secretKey), publishableKey: v.publishableKey || '', webhookSecret: decrypt(v.webhookSecret) }
    } else {
      keys = await moveOldSavedKeys()
    }
  } catch (err) {
    console.warn('[stripeConfig] Could not read saved Stripe keys:', err)
  }
  cache = { at: Date.now(), keys }
  return keys
}

/**
 * Keys saved before this change sat in plain text in the audit log. Move the
 * latest set into app_settings (encrypted) and blank the secrets in those
 * audit rows; the rows themselves are kept.
 */
async function moveOldSavedKeys(): Promise<Keys | null> {
  const old = await prisma.auditLog.findMany({ where: { entity: 'SystemSettings', action: 'STRIPE_GATEWAY_CONFIG' }, orderBy: { createdAt: 'desc' } })
  if (!old.length) return null
  const latest = (old[0].after || {}) as Stored
  const keys = { secretKey: latest.secretKey || '', publishableKey: latest.publishableKey || '', webhookSecret: latest.webhookSecret || '' }
  await writeKeys(keys)
  for (const row of old) {
    const after = (row.after || {}) as Stored
    await prisma.auditLog.update({
      where: { id: row.id },
      data: { after: { ...after, secretKey: maskSecret(after.secretKey || ''), webhookSecret: maskSecret(after.webhookSecret || '') } },
    })
  }
  return keys
}

export async function getStripeConfig(): Promise<StripeGatewayConfig> {
  const saved = await savedKeys()
  const env = {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  }
  // Admin-saved keys win; any left empty fall back to the environment
  const secretKey = saved?.secretKey || env.secretKey
  const publishableKey = saved?.publishableKey || env.publishableKey
  const webhookSecret = saved?.webhookSecret || env.webhookSecret

  const isPlaceholder = !secretKey || secretKey.includes('placeholder')
  const isLive = secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_live_')
  return {
    secretKey,
    publishableKey,
    webhookSecret,
    mode: isPlaceholder ? 'SANDBOX' : isLive ? 'LIVE' : 'TEST',
    isPlaceholder,
    isLive,
    webhookUrl: `${siteUrl()}/api/webhooks/stripe`,
    source: saved?.secretKey ? 'admin' : env.secretKey ? 'environment' : 'none',
  }
}

/** Show only the key prefix and last 4 characters, e.g. sk_live_…a1b2 */
export function maskSecret(value: string): string {
  if (!value) return ''
  const prefix = value.match(/^(sk|pk|rk|whsec)_(live_|test_)?/)?.[0] || ''
  return `${prefix}…${value.slice(-4)}`
}

/** A masked value echoed back from the admin UI means "unchanged" */
const isMasked = (value?: string) => !!value && value.includes('…')

// ── Saving ──────────────────────────────────────────────────────────────────
export class StripeKeyError extends Error {}

async function writeKeys(keys: Keys, updatedById?: string) {
  const value: Stored = {
    secretKey: encrypt(keys.secretKey),
    publishableKey: keys.publishableKey,
    webhookSecret: encrypt(keys.webhookSecret),
    updatedAt: new Date().toISOString(),
    updatedById,
  }
  await prisma.appSetting.upsert({
    where: { key: SETTING_KEY },
    update: { value: value as Prisma.InputJsonValue },
    create: { key: SETTING_KEY, value: value as Prisma.InputJsonValue },
  })
  cache = null
}

export async function saveStripeConfig(
  params: { secretKey?: string; publishableKey?: string; webhookSecret?: string },
  updatedById?: string,
): Promise<StripeGatewayConfig> {
  const current = (await savedKeys()) || { secretKey: '', publishableKey: '', webhookSecret: '' }
  // Blank or masked: keep what's saved
  const pick = (incoming: string | undefined, existing: string) => {
    const v = (incoming ?? '').trim()
    return v && !isMasked(v) ? v : existing
  }
  const keys = {
    secretKey: pick(params.secretKey, current.secretKey),
    publishableKey: pick(params.publishableKey, current.publishableKey),
    webhookSecret: pick(params.webhookSecret, current.webhookSecret),
  }

  if (keys.secretKey && !/^(sk|rk)_(live|test)_[A-Za-z0-9]+$/.test(keys.secretKey)) {
    throw new StripeKeyError('The secret key should start with sk_live_ or sk_test_ (or rk_ for a restricted key).')
  }
  if (keys.publishableKey && !/^pk_(live|test)_[A-Za-z0-9]+$/.test(keys.publishableKey)) {
    throw new StripeKeyError('The publishable key should start with pk_live_ or pk_test_.')
  }
  if (keys.webhookSecret && !/^whsec_[A-Za-z0-9]+$/.test(keys.webhookSecret)) {
    throw new StripeKeyError('The webhook signing secret should start with whsec_.')
  }
  const liveSecret = /_live_/.test(keys.secretKey)
  if (keys.secretKey && keys.publishableKey && liveSecret !== /_live_/.test(keys.publishableKey)) {
    throw new StripeKeyError('One key is live and the other is test. Use both live keys or both test keys.')
  }

  await writeKeys(keys, updatedById)
  return getStripeConfig()
}
