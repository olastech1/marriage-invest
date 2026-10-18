import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.role || !['ADMIN', 'FINANCE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    // Retrieve demo accounts recorded in AuditLog
    const demoLogs = await prisma.auditLog.findMany({
      where: {
        action: 'CREATE_DEMO_USER',
        entity: 'User',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const demoUsers = await Promise.all(
      demoLogs.map(async (log) => {
        const details = (log.after as any) || {}
        let userRecord = null
        if (log.entityId) {
          userRecord = await prisma.user.findUnique({
            where: { id: log.entityId },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
              identityVerified: true,
              emailVerified: true,
              transactions: {
                where: { type: 'DEPOSIT', status: 'COMPLETED' },
                select: { amount: true },
              },
            },
          })
        }

        const totalFunded = userRecord?.transactions?.reduce(
          (acc, tx) => acc + Number(tx.amount || 0),
          0
        ) ?? Number(details.initialDeposit || 0)

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
        const partnerName = details.partnerName || 'Spouse'
        const inviteLink = `${appUrl}/join?partner=${encodeURIComponent(details.name || 'Demo Investor')}&partnerEmail=${encodeURIComponent(details.email || '')}&type=${encodeURIComponent(details.marriageType || 'Same-Sex Marriage (Gay/Lesbian)')}`

        return {
          id: log.entityId || log.id,
          name: details.name || userRecord?.name || 'Demo Investor',
          email: details.email || userRecord?.email || '',
          plainPassword: details.plainPassword || 'DemoPass2025!',
          partnerName: details.partnerName || 'Spouse',
          partnerEmail: details.partnerEmail || '',
          marriageType: details.marriageType || 'Same-Sex Marriage (Gay/Lesbian)',
          initialDeposit: totalFunded,
          note: details.note || '',
          inviteLink,
          createdAt: log.createdAt,
          exists: !!userRecord,
        }
      })
    )

    return NextResponse.json({ demoUsers })
  } catch (error) {
    console.error('[GET /api/admin/demo-users]', error)
    return NextResponse.json({ error: 'Failed to retrieve demo accounts' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.role || !['ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorised. Admin privileges required.' }, { status: 403 })
    }

    const body = await req.json()
    const {
      name,
      email,
      password,
      partnerName = '',
      partnerEmail = '',
      marriageType = 'Same-Sex Marriage (Gay/Lesbian)',
      initialDeposit = 50000,
      note = 'Demo testing account created by Admin',
    } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    const cleanEmail = String(email).toLowerCase().trim()
    const cleanPassword = String(password).trim()
    const hashedPassword = await bcrypt.hash(cleanPassword, 10)

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    })

    if (user) {
      // Update existing demo account with new password and verification
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name,
          passwordHash: hashedPassword,
          emailVerified: new Date(),
          identityVerified: true,
          identityVerifiedAt: new Date(),
        },
      })
    } else {
      // Create fresh demo user
      user = await prisma.user.create({
        data: {
          name,
          email: cleanEmail,
          passwordHash: hashedPassword,
          role: 'INVESTOR',
          emailVerified: new Date(),
          identityVerified: true,
          identityVerifiedAt: new Date(),
        },
      })
    }

    const depositAmount = Number(initialDeposit) || 0

    // If pre-funded capital is specified, record it as a completed deposit transaction
    if (depositAmount > 0) {
      // Check if an active investment opportunity exists to link
      const opportunity = await prisma.investmentOpportunity.findFirst({
        where: { status: 'ACTIVE' },
      })

      let investmentId: string | undefined = undefined

      if (opportunity) {
        // Create an active investment for this demo account
        const investment = await prisma.investment.create({
          data: {
            userId: user.id,
            opportunityId: opportunity.id,
            referenceNumber: `INV-DEMO-${Date.now().toString().slice(-6)}`,
            amount: depositAmount,
            status: 'ACTIVE',
            confirmedAt: new Date(),
            maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        })
        investmentId = investment.id

        // Increment fundedAmount on opportunity
        await prisma.investmentOpportunity.update({
          where: { id: opportunity.id },
          data: {
            fundedAmount: {
              increment: depositAmount,
            },
          },
        })
      }

      await prisma.transaction.create({
        data: {
          userId: user.id,
          investmentId,
          type: 'DEPOSIT',
          amount: depositAmount,
          fee: 0,
          netAmount: depositAmount,
          status: 'COMPLETED',
          reference: `TX-DEMO-${Date.now().toString().slice(-8)}`,
          description: `Admin Demo Capital Seed Allocation (${marriageType})`,
          metadata: {
            isDemo: true,
            partnerName,
            partnerEmail,
            marriageType,
            note,
          },
          processedAt: new Date(),
        },
      })
    }

    // Create an in-app welcome notification for this demo account
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Joint Demo Portfolio Activated',
        message: `Welcome to your Joint Marriage Reserve with ${partnerName || 'your spouse'}. Pre-funded balance: $${depositAmount.toLocaleString()}.`,
        type: 'SUCCESS',
      },
    })

    // Store in AuditLog for Admin tracking
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_DEMO_USER',
        entity: 'User',
        entityId: user.id,
        after: {
          name,
          email: cleanEmail,
          plainPassword: cleanPassword,
          partnerName,
          partnerEmail,
          marriageType,
          initialDeposit: depositAmount,
          note,
        },
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const inviteLink = `${appUrl}/join?partner=${encodeURIComponent(name)}&partnerEmail=${encodeURIComponent(cleanEmail)}&type=${encodeURIComponent(marriageType)}`

    return NextResponse.json({
      success: true,
      message: 'Demo investor account successfully created and funded.',
      demoUser: {
        id: user.id,
        name,
        email: cleanEmail,
        plainPassword: cleanPassword,
        partnerName,
        partnerEmail,
        marriageType,
        initialDeposit: depositAmount,
        inviteLink,
        note,
      },
    })
  } catch (error: any) {
    console.error('[POST /api/admin/demo-users]', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create demo investor account' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.role || !['ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Remove audit logs and user if found
    await prisma.auditLog.deleteMany({
      where: {
        action: 'CREATE_DEMO_USER',
        entityId: userId,
      },
    })

    // Delete user cascades notifications & loginActivities; check transactions/investments
    await prisma.transaction.deleteMany({ where: { userId } })
    await prisma.investment.deleteMany({ where: { userId } })
    await prisma.user.delete({ where: { id: userId } }).catch(() => null)

    return NextResponse.json({ success: true, message: 'Demo account removed.' })
  } catch (error) {
    console.error('[DELETE /api/admin/demo-users]', error)
    return NextResponse.json({ error: 'Failed to delete demo user' }, { status: 500 })
  }
}
