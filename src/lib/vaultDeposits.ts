/**
 * Records a PAID joint-vault deposit (or a reciprocation of the spouse's
 * deposit): a transaction, one card in the couple chat, and a notification
 * asking the spouse to reciprocate. Only called after Stripe confirms payment.
 */

import { prisma } from '@/lib/db'
import { createChatMessage, resolveSpouseId } from '@/lib/chat'
import { getReciprocationStatus, getSpouseName } from '@/lib/reciprocation'
import { bonusFor, getSettings } from '@/lib/settings'

export interface VaultDepositInput {
  userId: string
  userName: string
  amount: number
  /** Stripe PaymentIntent / Checkout Session id this deposit was paid with */
  paymentRef: string
  vaultTitle?: string
  note?: string
  isReciprocalMatch?: boolean
}

export async function recordVaultDeposit({
  userId,
  userName,
  amount,
  paymentRef,
  vaultTitle = 'Joint Vault',
  note = '',
  isReciprocalMatch = false,
}: VaultDepositInput) {
  const spouseId = await resolveSpouseId(userId)
  const spouseName = spouseId ? await getSpouseName(spouseId) : 'your spouse'

  // Promotional match only when an admin has turned it on
  const bonusAmount = isReciprocalMatch ? 0 : bonusFor(amount, await getSettings())
  const totalAdded = amount + bonusAmount
  const reference = `DEP-${Date.now().toString(36).toUpperCase()}`

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      type: 'DEPOSIT',
      amount: totalAdded as any,
      fee: 0 as any,
      netAmount: totalAdded as any,
      status: 'COMPLETED',
      reference,
      stripePaymentIntentId: paymentRef,
      processedAt: new Date(),
      description: `${vaultTitle} ${isReciprocalMatch ? 'Reciprocation' : 'Deposit'} ($${amount.toLocaleString()})${bonusAmount > 0 ? ` + cash match ($${bonusAmount.toLocaleString()})` : ''}`,
      metadata: {
        depositorName: userName,
        baseAmount: amount,
        bonusMatch: bonusAmount,
        note,
        isReciprocalMatch,
        status: 'APPROVED',
      },
    },
  })

  await createChatMessage({
    data: {
      id: `msg-dep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      threadId: 'spouse',
      senderId: userId,
      senderName: userName,
      text: isReciprocalMatch
        ? `Reciprocated ${spouseName}'s deposit with $${amount.toLocaleString()}.`
        : `Deposited $${amount.toLocaleString()} into our joint vault.${bonusAmount > 0 ? ` +$${bonusAmount.toLocaleString()} cash match credited.` : ''}${note ? ` Note: "${note}"` : ''}`,
      timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
      createdAt: new Date(),
      read: false,
      type: 'deposit_alert',
      depositData: {
        amount,
        bonusMatch: bonusAmount,
        vaultTitle,
        depositorName: userName,
        reference: paymentRef,
        isReciprocalMatch,
      },
      reactions: {},
    },
  })

  if (spouseId && !isReciprocalMatch) {
    await prisma.notification.create({
      data: {
        userId: spouseId,
        title: `${userName} deposited $${amount.toLocaleString()}`,
        message: `${userName} added $${amount.toLocaleString()} to your joint vault${note ? `: "${note}"` : '.'} Reciprocate from your couple chat.`,
        type: 'ALERT',
        read: false,
        link: '/pay/match',
        category: 'PARTNER_DEPOSIT',
        requiresAction: true,
        attended: false,
        amount,
        partnerName: userName,
        actionLabel: `Reciprocate $${amount.toLocaleString()}`,
        metadata: { transactionId: transaction.id, reference, bonusMatch: bonusAmount },
      },
    }).catch((err) => console.error('[recordVaultDeposit] spouse notification failed', err))
  }

  // Fully reciprocated: close the "your spouse deposited" prompts
  if (isReciprocalMatch && (await getReciprocationStatus(userId)).owedByMe === 0) {
    await prisma.notification.updateMany({
      where: { userId, category: 'PARTNER_DEPOSIT', attended: false },
      data: { attended: true, read: true, attendedAt: new Date() },
    })
  }

  return { transaction, baseAmount: amount, bonusAmount, totalAdded }
}
