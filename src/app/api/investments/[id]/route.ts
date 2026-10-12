import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Params = { params: Promise<{ id: string }> }

async function findOpportunity(idOrSlug: string) {
  return prisma.investmentOpportunity.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      documents: {
        where: { isPublic: true },
        select: { id: true, name: true, type: true, fileUrl: true, version: true, createdAt: true },
      },
      _count: { select: { investments: true } },
    },
  })
}

function serialiseOpportunity(o: NonNullable<Awaited<ReturnType<typeof findOpportunity>>>) {
  return {
    ...o,
    minAmount: Number(o.minAmount),
    maxAmount: o.maxAmount !== null ? Number(o.maxAmount) : null,
    targetAmount: Number(o.targetAmount),
    fundedAmount: Number(o.fundedAmount),
    annualReturnRate: Number(o.annualReturnRate),
    investorCount: o._count.investments,
    _count: undefined,
  }
}

// ---------------------------------------------------------------------------
// Update validation schema
// ---------------------------------------------------------------------------

const updateOpportunitySchema = z
  .object({
    title: z.string().min(3).max(120).optional(),
    description: z.string().min(20).optional(),
    shortDescription: z.string().min(10).max(300).optional(),
    minAmount: z.number().positive().optional(),
    maxAmount: z.number().positive().nullable().optional(),
    targetAmount: z.number().positive().optional(),
    termMonths: z.number().int().min(1).max(360).optional(),
    annualReturnRate: z.number().min(0).max(100).optional(),
    distributionType: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'AT_MATURITY']).optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'FUNDED', 'CLOSED', 'CANCELLED']).optional(),
    openDate: z.string().datetime().nullable().optional(),
    closeDate: z.string().datetime().nullable().optional(),
    maturityDate: z.string().datetime().nullable().optional(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  })
  .strict()

// ---------------------------------------------------------------------------
// GET /api/investments/[id] — public single opportunity
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const { id } = await params
    const opportunity = await findOpportunity(id)

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    return NextResponse.json(serialiseOpportunity(opportunity))
  } catch (error) {
    console.error('[GET /api/investments/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/investments/[id] — update opportunity (admin only)
// ---------------------------------------------------------------------------

export async function PATCH(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    const { id } = await params

    const existing = await findOpportunity(id)
    if (!existing) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = updateOpportunitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten().fieldErrors },
        { status: 422 },
      )
    }

    const data = parsed.data

    const updated = await prisma.investmentOpportunity.update({
      where: { id: existing.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
        ...(data.minAmount !== undefined && {
          minAmount: new Prisma.Decimal(data.minAmount),
        }),
        ...(data.maxAmount !== undefined && {
          maxAmount: data.maxAmount !== null ? new Prisma.Decimal(data.maxAmount) : null,
        }),
        ...(data.targetAmount !== undefined && {
          targetAmount: new Prisma.Decimal(data.targetAmount),
        }),
        ...(data.termMonths !== undefined && { termMonths: data.termMonths }),
        ...(data.annualReturnRate !== undefined && {
          annualReturnRate: new Prisma.Decimal(data.annualReturnRate),
        }),
        ...(data.distributionType !== undefined && { distributionType: data.distributionType }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.openDate !== undefined && {
          openDate: data.openDate ? new Date(data.openDate) : null,
        }),
        ...(data.closeDate !== undefined && {
          closeDate: data.closeDate ? new Date(data.closeDate) : null,
        }),
        ...(data.maturityDate !== undefined && {
          maturityDate: data.maturityDate ? new Date(data.maturityDate) : null,
        }),
        ...(data.riskLevel !== undefined && { riskLevel: data.riskLevel }),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'InvestmentOpportunity',
        entityId: updated.id,
        before: { status: existing.status },
        after: { ...data },
      },
    })

    return NextResponse.json({
      ...updated,
      minAmount: Number(updated.minAmount),
      maxAmount: updated.maxAmount !== null ? Number(updated.maxAmount) : null,
      targetAmount: Number(updated.targetAmount),
      fundedAmount: Number(updated.fundedAmount),
      annualReturnRate: Number(updated.annualReturnRate),
    })
  } catch (error) {
    console.error('[PATCH /api/investments/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/investments/[id] — soft-delete / cancel (admin only)
// ---------------------------------------------------------------------------

export async function DELETE(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    const { id } = await params

    const existing = await findOpportunity(id)
    if (!existing) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    if (existing.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Opportunity is already cancelled' }, { status: 409 })
    }

    // Prevent cancellation if there are active investments tied to it
    const activeInvestmentCount = await prisma.investment.count({
      where: { opportunityId: existing.id, status: 'ACTIVE' },
    })
    if (activeInvestmentCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot cancel: ${activeInvestmentCount} active investment(s) are linked to this opportunity`,
        },
        { status: 409 },
      )
    }

    const cancelled = await prisma.investmentOpportunity.update({
      where: { id: existing.id },
      data: { status: 'CANCELLED' },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CANCEL',
        entity: 'InvestmentOpportunity',
        entityId: cancelled.id,
        before: { status: existing.status },
        after: { status: 'CANCELLED' },
      },
    })

    return NextResponse.json({ message: 'Opportunity cancelled', id: cancelled.id })
  } catch (error) {
    console.error('[DELETE /api/investments/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
