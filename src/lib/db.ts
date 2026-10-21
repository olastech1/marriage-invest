/**
 * Database client singleton for Union Verify (PostgreSQL via Prisma).
 *
 * The schema is applied on every Vercel build (`prisma db push` in the build
 * script), so DATABASE_URL must point at a reachable Postgres database.
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
