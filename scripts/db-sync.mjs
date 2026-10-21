/**
 * Additive database sync, run on every build.
 *
 * Applies only the non-destructive part of the difference between the live
 * database and prisma/schema.prisma: new tables, enums, columns, indexes and
 * constraints. Anything that would drop or rewrite existing data is skipped and
 * printed, so existing tables and data are never touched.
 */

import { execFileSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('[db-sync] DATABASE_URL is not set')
  process.exit(1)
}

let sql
try {
  sql = execFileSync(
    'npx',
    ['prisma', 'migrate', 'diff', '--from-url', url, '--to-schema-datamodel', 'prisma/schema.prisma', '--script'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
  )
} catch (err) {
  console.error('[db-sync] Could not compare the database with the schema (is DATABASE_URL reachable?)')
  process.exit(1)
}

// Split into statements, dropping comment lines
const statements = sql
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter(Boolean)

const DESTRUCTIVE = /\bDROP\b|\bALTER\s+COLUMN\b[^;]*\bTYPE\b|\bRENAME\b|\bTRUNCATE\b/i

const prisma = new PrismaClient({ datasourceUrl: url })
let applied = 0
const skipped = []
const failed = []

for (const statement of statements) {
  if (DESTRUCTIVE.test(statement)) {
    skipped.push(statement)
    continue
  }
  try {
    await prisma.$executeRawUnsafe(statement)
    applied++
  } catch (err) {
    failed.push(`${statement}\n  -> ${err?.message?.split('\n').pop()}`)
  }
}
await prisma.$disconnect()

console.log(`[db-sync] ${applied} change(s) applied, ${skipped.length} destructive change(s) skipped, ${failed.length} failed`)
for (const s of skipped) console.log(`[db-sync] skipped (would change existing data): ${s.split('\n')[0]}`)
for (const f of failed) console.warn(`[db-sync] failed: ${f}`)
