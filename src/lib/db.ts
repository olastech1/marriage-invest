/**
 * Prisma Client singleton
 *
 * In development, Next.js hot-reloading would create a new PrismaClient on
 * every module reload, quickly exhausting the database connection pool.
 * We store the instance on `globalThis` so that the same connection is reused
 * across HMR cycles while still getting a fresh client in production where
 * each serverless invocation is isolated.
 */

import { PrismaClient } from '@prisma/client'

// Extend globalThis to hold our singleton without TypeScript errors.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

// Only pin to globalThis outside of production so serverless functions always
// start clean while development reloads reuse the existing connection.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
