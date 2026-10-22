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
  /** For a reciprocation: the spouse's deposit (chat message id) it pays for */
  forDepositId?: string
}

export async function recordVaultDeposit({
  userId,
  userName,
  amount,
  paymentRef,
  vaultTitle = 'Joint Vault',
  note = '',
  isReciprocalMatch = false,
  forDepositId,
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

  // The deposit this reciprocation pays for, to name it in the chat
  const target = forDepositId ? await prisma.chatMessage.findUnique({ where: { id: forDepositId } }) : null
  const targetDate = target ? new Date(target.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''

  const message = await createChatMessage({
    data: {
      id: `msg-dep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      threadId: 'spouse',
      senderId: userId,
      senderName: userName,
      text: isReciprocalMatch
        ? target
          ? `Reciprocated ${spouseName}'s $${amount.toLocaleString()} deposit from ${targetDate}.`
          : `Reciprocated ${spouseName}'s deposit with $${amount.toLocaleString()}.`
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
        ...(forDepositId ? { forDepositId } : {}),
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
        // Pays this deposit only
        link: `/pay/match?deposit=${encodeURIComponent(message.id)}`,
        category: 'PARTNER_DEPOSIT',
        requiresAction: true,
        attended: false,
        amount,
        partnerName: userName,
        actionLabel: `Reciprocate $${amount.toLocaleString()}`,
        metadata: { transactionId: transaction.id, reference, bonusMatch: bonusAmount, depositMessageId: message.id },
      },
    }).catch((err) => console.error('[recordVaultDeposit] spouse notification failed', err))
  }

  // Close the prompt for the deposit just reciprocated
  if (isReciprocalMatch && forDepositId) {
    await prisma.notification.updateMany({
      where: { userId, category: 'PARTNER_DEPOSIT', attended: false, metadata: { path: ['depositMessageId'], equals: forDepositId } },
      data: { attended: true, read: true, attendedAt: new Date() },
    })
  }
  // Nothing left to reciprocate: close any remaining prompts
  if (isReciprocalMatch && (await getReciprocationStatus(userId)).owedByMe === 0) {
    await prisma.notification.updateMany({
      where: { userId, category: 'PARTNER_DEPOSIT', attended: false },
      data: { attended: true, read: true, attendedAt: new Date() },
    })
  }

  return { transaction, baseAmount: amount, bonusAmount, totalAdded }
}
