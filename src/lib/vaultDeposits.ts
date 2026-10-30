/**
 * Records a PAID joint-vault deposit (or a reciprocation of the spouse's
 * deposit): a transaction, one card in the couple chat, and a notification
 * asking the spouse to reciprocate. Only called after Stripe confirms payment.
 */

import { prisma } from '@/lib/db'
import { createChatMessage, resolveSpouseId } from '@/lib/chat'
import { getReciprocationStatus, getSpouseName } from '@/lib/reciprocation'
import { bonusFor, getSettings } from '@/lib/settings'
import { emailMember } from '@/lib/activity'

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
  /** For a share of an approved proposal: the proposal (chat message id). No reciprocation is owed. */
  proposalId?: string
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
  proposalId,
}: VaultDepositInput) {
  const spouseId = await resolveSpouseId(userId)
  const spouseName = spouseId ? await getSpouseName(spouseId) : 'your partner'

  const proposal = proposalId ? await prisma.chatMessage.findUnique({ where: { id: proposalId } }) : null
  const planName = String((proposal?.proposalData as Record<string, unknown> | null)?.goalName || 'your plan')

  // Promotional match only when an admin has turned it on
  const bonusAmount = isReciprocalMatch || proposal ? 0 : bonusFor(amount, await getSettings())
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
      text: proposal
        ? `Paid my $${amount.toLocaleString()} share for "${planName}".`
        : isReciprocalMatch
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
        ...(proposal ? { proposalId: proposal.id } : {}),
      },
      reactions: {},
    },
  })

  if (spouseId && !isReciprocalMatch && !proposal) {
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
    }).catch((err) => console.error('[recordVaultDeposit] partner notification failed', err))
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

  // Email both people
  const usd = `$${amount.toLocaleString()}`
  if (proposal) {
    await emailMember(spouseId, {
      subject: `${userName} paid their ${usd} share for "${planName}"`,
      heading: `${userName} paid their share`,
      paragraphs: [`${userName} paid ${usd} toward "${planName}". If you haven't paid your share yet, you can do it from your chat.`],
      ctaLabel: 'Open chat',
      ctaPath: '/chat?thread=spouse',
    })
  } else if (isReciprocalMatch) {
    await emailMember(spouseId, {
      subject: `${userName} reciprocated your deposit`,
      heading: `${userName} reciprocated ${usd}`,
      paragraphs: [target ? `${userName} reciprocated your ${usd} deposit from ${targetDate}.` : `${userName} reciprocated with ${usd}.`],
      ctaLabel: 'View your joint vault',
      ctaPath: '/save',
    })
  } else {
    await emailMember(spouseId, {
      subject: `${userName} deposited ${usd} into your joint vault`,
      heading: `${userName} deposited ${usd}`,
      paragraphs: [
        `${userName} added ${usd} to your joint vault${note ? ` with the note: "${note}"` : ''}.`,
        'Reciprocate this deposit with one tap from the link below.',
      ],
      ctaLabel: `Reciprocate ${usd}`,
      ctaPath: `/pay/match?deposit=${encodeURIComponent(message.id)}`,
    })
  }
  await emailMember(userId, {
    subject: `Receipt: ${usd} ${proposal ? `share for "${planName}"` : isReciprocalMatch ? 'reciprocation' : 'deposit'}`,
    heading: 'Payment received',
    paragraphs: [
      `Your ${usd} ${proposal ? `share for "${planName}"` : isReciprocalMatch ? 'reciprocation' : 'deposit'} was added to your joint vault${bonusAmount > 0 ? `, plus a $${bonusAmount.toLocaleString()} cash match` : ''}.`,
      `Reference: ${reference}`,
    ],
    ctaLabel: 'View your joint vault',
    ctaPath: '/save',
  })

  return { transaction, baseAmount: amount, bonusAmount, totalAdded }
}
