/**
 * Database client singleton for Union Verify (PostgreSQL via Prisma).
 *
 * The schema is applied on every Vercel build (`prisma db push` in the build
 * script), so DATABASE_URL must point at a reachable Postgres database.
 *
 * On Vercel many copies of the server run at once and each one opens its own
 * connections, so in production each copy keeps a small pool (2) and waits a
 * while for a free connection instead of failing. Settings already in
 * DATABASE_URL (connection_limit, pool_timeout, or a pooler such as PgBouncer
 * with pgbouncer=true) win.
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function databaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL
  if (!raw || process.env.NODE_ENV !== 'production') return raw
  try {
    const url = new URL(raw)
    if (!url.searchParams.has('connection_limit')) url.searchParams.set('connection_limit', '2')
    if (!url.searchParams.has('pool_timeout')) url.searchParams.set('pool_timeout', '20')
    return url.toString()
  } catch {
    return raw
  }
}

// One client per server copy, shared by every bundle that imports it (pages, API routes, the proxy)
export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: databaseUrl() })
globalForPrisma.prisma = prisma

export default prisma
