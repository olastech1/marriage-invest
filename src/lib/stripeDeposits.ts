/**
 * Records a paid Stripe Checkout vault deposit in the couple chat.
 *
 * Called from both the Stripe webhook and /api/payments/confirm (when the
 * payer returns from Stripe), so a deposit is recorded even if the webhook is
 * not configured. The chat message ID is derived from the Checkout Session ID,
 * which makes recording idempotent.
 */

import type Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { createChatMessage, getChatDb, resolveSpouseId } from '@/lib/chat'
import { getSpouseName } from '@/lib/reciprocation'

export async function recordStripeDeposit(checkoutSession: Stripe.Checkout.Session) {
  const metadata = checkoutSession.metadata || {}
  const userId = metadata.userId || checkoutSession.client_reference_id || ''
  const messageId = `msg-stripe-${checkoutSession.id}`
  if (!userId || (metadata.type || 'DEPOSIT') !== 'DEPOSIT') return { recorded: false as const }

  const db = await getChatDb()
  if (await db.chatMessage.findUnique({ where: { id: messageId } })) return { recorded: false as const }

  const amount = Number(metadata.amount) || (checkoutSession.amount_total ? checkoutSession.amount_total / 100 : 0)
  const bonusAmount = metadata.applyBonus === 'true' ? Math.round(amount * 0.1 * 100) / 100 : 0
  const isReciprocalMatch = metadata.isReciprocalMatch === 'true'
  const userName = metadata.userName || 'Member'
  const note = metadata.partnerNote || ''

  const spouseId = await resolveSpouseId(userId)
  const spouseName = spouseId ? await getSpouseName(spouseId) : 'your spouse'

  await createChatMessage({
    data: {
      id: messageId,
      threadId: 'spouse',
      senderId: userId,
      senderName: userName,
      text: isReciprocalMatch
        ? `Matched ${spouseName}'s deposit with $${amount.toLocaleString()} (card payment).`
        : `Deposited $${amount.toLocaleString()} into our joint vault by card.${bonusAmount > 0 ? ` +$${bonusAmount.toLocaleString()} cash match credited.` : ''}${note && note !== 'Joint Matrimonial Contribution' ? ` Note: "${note}"` : ''}`,
      timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
      createdAt: new Date(),
      read: false,
      type: 'deposit_alert',
      depositData: {
        amount,
        bonusMatch: bonusAmount,
        vaultTitle: 'Joint Vault',
        depositorName: userName,
        reference: checkoutSession.id,
        isReciprocalMatch,
      },
      reactions: {},
    },
  })

  if (spouseId && !isReciprocalMatch) {
    await prisma.notification
      .create({
        data: {
          userId: spouseId,
          title: `${userName} deposited $${amount.toLocaleString()}`,
          message: `${userName} added $${amount.toLocaleString()} to your joint vault by card. Match it to keep your vault balanced.`,
          type: 'ALERT',
          read: false,
          link: '/pay/match',
          category: 'PARTNER_DEPOSIT',
          requiresAction: true,
          attended: false,
          amount,
          partnerName: userName,
          actionLabel: `Match $${amount.toLocaleString()}`,
        } as any,
      })
      .catch(console.error)
  }

  return { recorded: true as const, amount, bonusAmount, isReciprocalMatch }
}
