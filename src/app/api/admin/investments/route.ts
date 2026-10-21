import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { slugify } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Dates must be in YYYY-MM-DD format')
  .optional()
  .or(z.literal(''))

const createSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
    shortDescription: z.string().trim().min(10, 'Summary must be at least 10 characters').max(300),
    description: z.string().trim().min(20, 'Description must be at least 20 characters'),
    minAmount: z.number().positive('Minimum amount must be greater than 0'),
    maxAmount: z.number().positive('Maximum amount must be greater than 0').nullable().optional(),
    targetAmount: z.number().positive('Target amount must be greater than 0'),
    termMonths: z.number().int('Term must be a whole number of months').min(1).max(360),
    /** Projected annual return entered as a percent, e.g. 6.8 for 6.8% */
    annualReturnPercent: z.number().min(0, 'Return cannot be negative').max(100, 'Return must be 100% or less'),
    distributionType: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'AT_MATURITY']),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    status: z.enum(['DRAFT', 'ACTIVE']),
    openDate: dateString,
    closeDate: dateString,
  })
  .refine((d) => d.maxAmount == null || d.maxAmount >= d.minAmount, {
    message: 'Maximum amount must be at least the minimum amount',
  })
  .refine((d) => d.targetAmount >= d.minAmount, {
    message: 'Target amount must be at least the minimum amount',
  })
  .refine((d) => !d.openDate || !d.closeDate || d.closeDate >= d.openDate, {
    message: 'Close date must be on or after the open date',
  })

// POST /api/admin/investments — create an investment opportunity (admin only)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    )
  }
  const data = parsed.data

  try {
    let slug = slugify(data.title).replace(/^-+|-+$/g, '').slice(0, 70) || 'opportunity'
    if (await prisma.investmentOpportunity.findUnique({ where: { slug } })) {
      slug = `${slug}-${crypto.randomBytes(3).toString('hex')}`
    }

    const opportunity = await prisma.investmentOpportunity.create({
      data: {
        title: data.title,
        slug,
        shortDescription: data.shortDescription,
        description: data.description,
        minAmount: new Prisma.Decimal(data.minAmount),
        maxAmount: data.maxAmount != null ? new Prisma.Decimal(data.maxAmount) : null,
        targetAmount: new Prisma.Decimal(data.targetAmount),
        termMonths: data.termMonths,
        // Stored as a fraction (0.068 = 6.8%)
        annualReturnRate: new Prisma.Decimal(data.annualReturnPercent).div(100),
        distributionType: data.distributionType,
        riskLevel: data.riskLevel,
        status: data.status,
        openDate: data.openDate ? new Date(data.openDate) : null,
        closeDate: data.closeDate ? new Date(data.closeDate) : null,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'InvestmentOpportunity',
        entityId: opportunity.id,
        after: { title: opportunity.title, slug: opportunity.slug, status: opportunity.status },
      },
    })

    return NextResponse.json({ success: true, id: opportunity.id, slug: opportunity.slug }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/investments]', error)
    return NextResponse.json({ error: 'Could not create the opportunity' }, { status: 500 })
  }
}
