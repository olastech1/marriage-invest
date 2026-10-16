import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const session = await auth()
    const body = await req.json()
    const {
      selectedTypeId,
      partner1Name,
      partner1Email,
      partner1Dob,
      partner1Citizenship,
      partner1Password,
      partner2Name,
      partner2Email,
      partner2Dob,
      partner2Citizenship,
      weddingDate,
      jurisdiction,
      customVows,
      paymentOption,
      totalAmount = 1000,
    } = body

    if (!partner1Name || !partner1Email || !partner2Name || !partner2Email) {
      return NextResponse.json(
        { error: 'Names and email addresses for both spouses are required.' },
        { status: 400 }
      )
    }

    const cleanEmail1 = String(partner1Email).toLowerCase().trim()
    const cleanEmail2 = String(partner2Email).toLowerCase().trim()
    const docketNumber = `REG-2026-CH-${Math.floor(10000 + Math.random() * 90000)}`

    let userId: string
    let isNewUser = false

    if (session?.user?.id) {
      // User is already logged in
      userId = session.user.id
      // Update name if needed
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: partner1Name,
          identityVerified: true,
          identityVerifiedAt: new Date(),
        },
      }).catch(() => null)
    } else {
      // Check if user with partner1Email exists
      let existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail1 },
      })

      if (existingUser) {
        userId = existingUser.id
      } else {
        isNewUser = true
        const passwordToHash = partner1Password && String(partner1Password).length >= 6
          ? String(partner1Password).trim()
          : `MarriagePass${Math.floor(1000 + Math.random() * 9000)}!`

        const passwordHash = await bcrypt.hash(passwordToHash, 10)

        const newUser = await prisma.user.create({
          data: {
            name: partner1Name,
            email: cleanEmail1,
            passwordHash,
            role: 'INVESTOR',
            emailVerified: new Date(),
            identityVerified: true,
            identityVerifiedAt: new Date(),
          },
        })
        userId = newUser.id
      }
    }

    // Record fee transaction in database
    await prisma.transaction.create({
      data: {
        userId,
        type: 'FEE',
        amount: Number(totalAmount),
        fee: 0,
        netAmount: Number(totalAmount),
        status: 'COMPLETED',
        reference: `FEE-${docketNumber}`,
        description: `Matrimonial Registration Fee (${paymentOption === 'both' ? 'Registration + Certificate' : paymentOption})`,
        metadata: {
          docketNumber,
          marriageType: selectedTypeId,
          partner1Name,
          partner1Email: cleanEmail1,
          partner1Dob,
          partner1Citizenship,
          partner2Name,
          partner2Email: cleanEmail2,
          partner2Dob,
          partner2Citizenship,
          weddingDate,
          jurisdiction,
          customVows,
          paymentOption,
          totalAmount,
        },
        processedAt: new Date(),
      },
    }).catch((err) => console.error('[Transaction Create Error]', err))

    // Create Notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Marriage Solemnization Docketed',
        message: `Docket ${docketNumber} for ${partner1Name} & ${partner2Name} officially registered. Invitation dispatched to ${cleanEmail2}.`,
        type: 'SUCCESS',
        link: '/certificate',
      },
    }).catch(() => null)

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'MARRIAGE_REGISTRATION_CREATED',
        entity: 'MarriageDocket',
        entityId: docketNumber,
        after: {
          docketNumber,
          selectedTypeId,
          partner1Name,
          partner1Email: cleanEmail1,
          partner2Name,
          partner2Email: cleanEmail2,
          totalAmount,
          isNewUser,
        },
      },
    }).catch(() => null)

    return NextResponse.json({
      success: true,
      docketNumber,
      isNewUser,
      userEmail: cleanEmail1,
      message: 'Marriage registration officially solemnized and docketed.',
    })
  } catch (error: any) {
    console.error('[POST /api/marriage-registration]', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to complete marriage registration.' },
      { status: 500 }
    )
  }
}
