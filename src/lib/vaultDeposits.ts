/**
 * Records a joint-vault deposit (or a reciprocation of the spouse's deposit):
 * a transaction, one card in the couple chat, and a notification asking the
 * spouse to reciprocate.
 */

import { prisma } from '@/lib/db'
import { createChatMessage, resolveSpouseId } from '@/lib/chat'
import { getSpouseName } from '@/lib/reciprocation'

export interface VaultDepositInput {
  userId: string
  userName: string
  amount: number
  applyBonus?: boolean
  vaultTitle?: string
  note?: string
  isReciprocalMatch?: boolean
}

export async function recordVaultDeposit({
  userId,
  userName,
  amount,
  applyBonus = false,
  vaultTitle = 'Joint Vault',
  note = '',
  isReciprocalMatch = false,
}: VaultDepositInput) {
  const spouseId = await resolveSpouseId(userId)
  const spouseName = spouseId ? await getSpouseName(spouseId) : 'your spouse'

  const bonusAmount = applyBonus ? Math.round(amount * 0.1 * 100) / 100 : 0
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
      description: `${vaultTitle} ${isReciprocalMatch ? 'Reciprocation' : 'Deposit'} ($${amount.toLocaleString()})${bonusAmount > 0 ? ` + 10% Cash Match ($${bonusAmount.toLocaleString()})` : ''}`,
      metadata: {
        depositorName: userName,
        baseAmount: amount,
        bonusMatch: bonusAmount,
        bonusApplied: applyBonus,
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
        reference,
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
      } as any,
    })
  }

  return { transaction, baseAmount: amount, bonusAmount, totalAdded }
}
