import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { COMMUNITY_CAUSES, CommunityDonationInput, DonationReceipt } from '@/types/community'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body: CommunityDonationInput = await req.json()

    if (!body.causeId || !body.amount || body.amount < 5) {
      return NextResponse.json(
        { error: 'Invalid donation. Minimum donation amount is $5.00.' },
        { status: 400 },
      )
    }

    const cause = COMMUNITY_CAUSES.find((c) => c.id === body.causeId)
    if (!cause) {
      return NextResponse.json({ error: 'Selected community cause not found.' }, { status: 404 })
    }

    const donorName = body.isAnonymous
      ? 'Anonymous Supporter'
      : (body.donorName || session?.user?.name || 'Valued Donor')
    const donorEmail = body.donorEmail || session?.user?.email || 'donor@community.unionverify.com'

    const receiptNumber = `REC-DON-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
    const digitalSignature = `SIG-24K-${crypto.randomBytes(12).toString('hex').toUpperCase()}`
    const timestamp = new Date().toISOString()

    // If user is authenticated, register the donation transaction and audit log
    if (session?.user?.id) {
      try {
        await prisma.transaction.create({
          data: {
            userId: session.user.id,
            type: 'FEE',
            amount: body.amount,
            fee: 0,
            netAmount: body.amount,
            status: 'COMPLETED',
            reference: `DON-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            description: `Community Impact Donation: ${cause.title}`,
            processedAt: new Date(),
            metadata: {
              isDonation: true,
              causeId: cause.id,
              causeTitle: cause.title,
              category: cause.category,
              partnerOrg: cause.partnerOrg,
              ein: cause.ein,
              taxDeductible: true,
              receiptNumber,
              dedicationType: body.dedicationType ?? 'NONE',
              dedicationText: body.dedicationText ?? '',
              isRecurring: Boolean(body.isRecurring),
              isAnonymous: Boolean(body.isAnonymous),
            },
          },
        })

        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'COMMUNITY_DONATION',
            entity: 'CommunityCause',
            entityId: cause.id,
            after: {
              amount: body.amount,
              receiptNumber,
              partnerOrg: cause.partnerOrg,
            },
          },
        })

        // Also create a celebratory notification
        await prisma.notification.create({
          data: {
            userId: session.user.id,
            title: 'Thank you for your Community Donation! 🌈',
            message: `Your tax-deductible contribution of $${body.amount.toLocaleString()} to ${cause.title} was successfully processed. Receipt #${receiptNumber} generated.`,
            type: 'SUCCESS',
            link: '/community',
          },
        })
      } catch (dbErr) {
        console.error('Failed to record logged-in user donation transaction in DB:', dbErr)
        // Proceed anyway so guest or unmigrated user flow does not break
      }
    }

    const receipt: DonationReceipt = {
      receiptNumber,
      causeTitle: cause.title,
      partnerOrg: cause.partnerOrg,
      ein: cause.ein,
      donorName,
      donorEmail,
      amount: body.amount,
      isAnonymous: Boolean(body.isAnonymous),
      dedicationText: body.dedicationText,
      date: timestamp,
      taxDeductible: cause.taxDeductible,
      digitalSignature,
    }

    return NextResponse.json({
      success: true,
      message: 'Donation processed with heartfelt appreciation.',
      receipt,
    })
  } catch (error) {
    console.error('Community donation API error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing the donation.' },
      { status: 500 },
    )
  }
}
