/**
 * Database client singleton for Union Invest.
 *
 * Configured as a 100% frontend-ready, backend-independent mock engine.
 * Eliminates all external PostgreSQL database dependencies, ensuring zero
 * downtime, zero connection timeouts, and flawless operation on Vercel
 * or any client-side hosting platform.
 */

import { PrismaClient } from '@prisma/client'
import { mockPrismaClient } from '@/lib/mockDb'

export const prisma: PrismaClient = mockPrismaClient as unknown as PrismaClient
export default prisma
