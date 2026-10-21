/**
 * Platform settings an admin can change (stored in the app_settings table).
 *   vaultApy        joint vault rate in percent (e.g. 6.8), variable, not guaranteed
 *   bonusMatchRate  promotional cash match on deposits in percent (0 = off)
 */

import { prisma } from '@/lib/db'

export interface PlatformSettings {
  vaultApy: number
  bonusMatchRate: number
}

const DEFAULTS: PlatformSettings = {
  vaultApy: 6.8,
  bonusMatchRate: 0,
}

export async function getSettings(): Promise<PlatformSettings> {
  const rows = await prisma.appSetting.findMany({ where: { key: { in: Object.keys(DEFAULTS) } } })
  const settings = { ...DEFAULTS }
  for (const row of rows) {
    const value = Number(row.value)
    if (Number.isFinite(value)) settings[row.key as keyof PlatformSettings] = value
  }
  return settings
}

export async function updateSettings(patch: Partial<PlatformSettings>): Promise<PlatformSettings> {
  for (const [key, raw] of Object.entries(patch)) {
    if (!(key in DEFAULTS) || raw === undefined) continue
    const value = Number(raw)
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error(`${key} must be a number between 0 and 100`)
    }
    await prisma.appSetting.upsert({ where: { key }, update: { value }, create: { key, value } })
  }
  return getSettings()
}

/** Cash match for a deposit under the current promo (0 when the promo is off). */
export function bonusFor(amount: number, settings: PlatformSettings): number {
  return Math.round(amount * (settings.bonusMatchRate / 100) * 100) / 100
}
