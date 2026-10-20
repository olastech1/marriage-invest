import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createChatMessage } from '@/lib/chat'
import { SEED_REGISTRIES, RegistryGift } from '@/types/registry'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await req.json()
    const { fundId, amount, donorName, donorEmail, message, isAnonymous, giftCardDesign } = body

    if (!amount || amount < 10) {
      return NextResponse.json(
        { error: 'Minimum wedding gift contribution is $10.00 USD.' },
        { status: 400 }
      )
    }

    const targetRegistry = SEED_REGISTRIES.find((r) => r.slug === slug)
    const coupleTitle = targetRegistry
      ? `${targetRegistry.partner1Name} & ${targetRegistry.partner2Name}`
      : 'The Newlyweds'

    const giftId = `gift-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const newGift: RegistryGift = {
      id: giftId,
      fundId,
      donorName: isAnonymous ? 'A Gracious Guest' : (donorName || 'Wedding Guest'),
      donorEmail: donorEmail || 'guest@unionverify.com',
      amount: Number(amount),
      message: message || 'Wishing you both a lifetime of happiness, wealth, and profound joy!',
      createdAt: new Date().toISOString(),
      isAnonymous: Boolean(isAnonymous),
      giftCardDesign: giftCardDesign || 'GOLD_ELEGANCE',
    }

    // Try to record this in Prisma if possible
    try {
      const session = await auth()
      const actorUserId = session?.user?.id

      if (actorUserId) {
        await prisma.transaction.create({
          data: {
            userId: actorUserId,
            type: 'DEPOSIT',
            amount: Number(amount),
            fee: 0,
            netAmount: Number(amount),
            status: 'COMPLETED',
            reference: `W-GIFT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            description: `Wedding Cash Gift to ${coupleTitle}`,
            processedAt: new Date(),
            metadata: {
              isWeddingGift: true,
              registrySlug: slug,
              coupleTitle,
              donorName: newGift.donorName,
              message: newGift.message,
              fundId,
            },
          },
        })

        await prisma.auditLog.create({
          data: {
            userId: actorUserId,
            action: 'WEDDING_GIFT_CONTRIBUTION',
            entity: 'WeddingRegistry',
            entityId: slug,
            after: {
              amount: Number(amount),
              coupleTitle,
              donorName: newGift.donorName,
            },
          },
        })

        // Inject couple chat message celebrating the wedding gift
        const formattedTime = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date())
        await createChatMessage({
          data: {
            id: `msg-gift-${Date.now()}`,
            threadId: 'spouse',
            senderId: 'system_wedding_registry',
            senderName: 'Union Verify Registry',
            text: `🎁 New Wedding Gift Received! ${newGift.donorName} contributed $${Number(amount).toLocaleString()} to your registry! "${newGift.message}"`,
            timestamp: formattedTime,
            createdAt: new Date(),
            read: false,
            type: 'deposit_alert',
            proposalData: {
              goalName: `Wedding Registry (${coupleTitle})`,
              amount: Number(amount),
              split: '100% Gifted',
              status: 'approved',
              proposedBy: newGift.donorName,
            },
            depositData: {
              amount: Number(amount),
              vaultTitle: `Wedding Registry Gift from ${newGift.donorName}`,
              depositorName: newGift.donorName,
            },
            reactions: { '🎁': 2, '❤️': 2, '🥂': 2 },
          },
        }).catch(console.warn)

        // Notification for couple
        await prisma.notification.create({
          data: {
            userId: actorUserId,
            title: `🎁 Wedding Gift Received: $${Number(amount).toLocaleString()}`,
            message: `${newGift.donorName} sent $${Number(amount).toLocaleString()} with note: "${newGift.message}"`,
            type: 'SUCCESS',
            link: '/chat?thread=spouse',
            category: 'PARTNER_DEPOSIT',
            requiresAction: false,
            attended: true,
          } as any,
        }).catch(console.warn)
      }
    } catch (dbErr) {
      console.error('Non-critical DB logging error for wedding gift:', dbErr)
    }

    return NextResponse.json({
      success: true,
      message: `Wedding gift of $${amount} successfully sent to ${coupleTitle}!`,
      gift: newGift,
    })
  } catch (error) {
    console.error('Wedding gift error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your wedding gift.' },
      { status: 500 }
    )
  }
}
