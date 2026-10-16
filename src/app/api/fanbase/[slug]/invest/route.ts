import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { CELEBRITY_ARTISTS } from '@/types/fanbase'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    const { slug } = await params
    const body = await req.json()

    const {
      tierId,
      amount,
      investorName,
      investorEmail,
      isFriendsSyndicate = false,
      syndicateName = '',
      friendEmails = [],
    } = body

    const artist = CELEBRITY_ARTISTS.find((a) => a.slug === slug)
    if (!artist) {
      return NextResponse.json({ error: 'Celebrity artist syndicate not found.' }, { status: 404 })
    }

    const tier = artist.tiers.find((t) => t.id === tierId) || artist.tiers[0]
    const parsedAmount = Number(amount) || tier.minInvestment

    if (parsedAmount < tier.minInvestment) {
      return NextResponse.json(
        { error: `Minimum allocation for the "${tier.name}" tier is $${tier.minInvestment}.` },
        { status: 400 }
      )
    }

    const email = (session?.user?.email || investorEmail || '').trim().toLowerCase()
    const name = (session?.user?.name || investorName || 'Private Investor').trim()

    if (!email) {
      return NextResponse.json({ error: 'Investor email is required.' }, { status: 400 })
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: '$2a$10$e8wU.P1.q9NqV0rYtCgC1.e8wU.P1.q9NqV0rYtCgC1.e8wU.P1.', // placeholder hash
          role: 'INVESTOR',
          identityVerified: true,
          emailVerified: new Date(),
        },
      })
    }

    const referenceNumber = `FAN-${artist.stageName.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`
    const transactionRef = `TX-FAN-${Date.now().toString().slice(-8)}`

    // Find or create an opportunity representation in DB
    let opportunity = await prisma.investmentOpportunity.findUnique({
      where: { slug: `fanbase-${artist.slug}` },
    })

    if (!opportunity) {
      opportunity = await prisma.investmentOpportunity.create({
        data: {
          title: `${artist.stageName} · ${artist.offering.title}`,
          slug: `fanbase-${artist.slug}`,
          description: artist.bio,
          shortDescription: artist.tagline,
          minAmount: tier.minInvestment,
          targetAmount: artist.offering.targetAmount,
          fundedAmount: artist.offering.fundedAmount + parsedAmount,
          termMonths: artist.offering.termMonths,
          annualReturnRate: artist.offering.projectedAPY,
          distributionType: 'QUARTERLY',
          status: 'ACTIVE',
          riskLevel: artist.offering.riskLevel,
        },
      })
    } else {
      await prisma.investmentOpportunity.update({
        where: { id: opportunity.id },
        data: {
          fundedAmount: { increment: parsedAmount },
        },
      })
    }

    // Create active investment
    const investment = await prisma.investment.create({
      data: {
        userId: user.id,
        opportunityId: opportunity.id,
        referenceNumber,
        amount: parsedAmount,
        status: 'ACTIVE',
        confirmedAt: new Date(),
        maturityDate: new Date(Date.now() + artist.offering.termMonths * 30 * 24 * 60 * 60 * 1000),
      },
    })

    // Create completed deposit transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        investmentId: investment.id,
        type: 'DEPOSIT',
        amount: parsedAmount,
        fee: 0,
        netAmount: parsedAmount,
        status: 'COMPLETED',
        reference: transactionRef,
        description: `Fanbase Syndicate Allocation — ${artist.stageName} (${tier.name})`,
        metadata: {
          artistSlug: artist.slug,
          artistName: artist.stageName,
          tierId: tier.id,
          tierName: tier.name,
          isFriendsSyndicate,
          syndicateName: syndicateName || 'Personal Fanbase Allocation',
          friendEmails,
          projectedAPY: tier.projectedReturnRate,
          royaltyShareText: tier.royaltyShareText,
          perks: tier.perks,
        },
        processedAt: new Date(),
      },
    })

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'FANBASE_INVESTMENT_EXECUTED',
        entity: 'CelebritySyndicate',
        entityId: referenceNumber,
        after: {
          artist: artist.stageName,
          tier: tier.name,
          amount: parsedAmount,
          isFriendsSyndicate,
          syndicateName,
        },
      },
    }).catch(() => null)

    // Notification for user
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: `Allocation Confirmed: ${artist.stageName} Syndicate`,
        message: `Your $${parsedAmount.toLocaleString()} investment in ${artist.stageName}'s ${tier.name} tier is confirmed. Digital VIP Pass unlocked.`,
        type: 'SUCCESS',
        link: `/portfolio`,
      },
    }).catch(() => null)

    return NextResponse.json({
      success: true,
      referenceNumber,
      transactionRef,
      artist: artist.stageName,
      tierName: tier.name,
      amount: parsedAmount,
      perks: tier.perks,
      message: `Congratulations! Your fanbase investment in ${artist.stageName} has been executed.`,
    })
  } catch (error: any) {
    console.error('[POST /api/fanbase/[slug]/invest]', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to process fanbase investment.' },
      { status: 500 }
    )
  }
}
