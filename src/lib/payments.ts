/**
 * Every paid action goes through here:
 *   1. startPayment()   records a PendingPayment and opens a Stripe Checkout
 *   2. fulfillPayment() runs once Stripe reports the session as paid, from the
 *      webhook or from /api/payments/confirm on return, whichever comes first.
 *      It is safe to call any number of times: the PENDING → PROCESSING claim
 *      lets exactly one caller do the work.
 * Nothing is recorded as paid without a paid Stripe Checkout Session.
 */

import type Stripe from 'stripe'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { createCheckoutSession } from '@/lib/checkout'
import { resolveSpouseId } from '@/lib/chat'
import { sendEmail } from '@/lib/email'
import { escapeHtml } from '@/lib/utils'
import { recordVaultDeposit } from '@/lib/vaultDeposits'

export type PaymentPurpose = 'VAULT_DEPOSIT' | 'INVESTMENT' | 'MARRIAGE_REGISTRATION' | 'CERTIFICATE'

/** Platform service fees, in USD (set here, never by the browser) */
export const FEES = {
  registration: 500,
  certificate: 500,
} as const

export class PaymentsNotConfiguredError extends Error {
  constructor() {
    super('Card payments are not set up yet. Please try again later.')
  }
}

interface StartPaymentInput {
  purpose: PaymentPurpose
  amount: number
  userId: string
  userName: string
  email?: string | null
  title: string
  description?: string
  payload: Record<string, unknown>
  origin: string
  cancelPath: string
}

export async function startPayment(input: StartPaymentInput): Promise<string> {
  if (!(input.amount >= 1)) throw new Error('Amount must be at least $1.')

  const pending = await prisma.pendingPayment.create({
    data: {
      purpose: input.purpose,
      userId: input.userId,
      amount: input.amount,
      payload: input.payload as Prisma.InputJsonValue,
    },
  })

  const checkout = await createCheckoutSession({
    userId: input.userId,
    userName: input.userName,
    email: input.email,
    amount: input.amount,
    type: input.purpose,
    title: input.title,
    description: input.description,
    metadata: { paymentId: pending.id, purpose: input.purpose },
    successUrl: `${input.origin}/payment/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${input.origin}${input.cancelPath}`,
  })
  if (checkout.sandbox || !checkout.url) {
    await prisma.pendingPayment.delete({ where: { id: pending.id } })
    throw new PaymentsNotConfiguredError()
  }

  await prisma.pendingPayment.update({ where: { id: pending.id }, data: { stripeSessionId: checkout.sessionId } })
  return checkout.url
}

export interface FulfillResult {
  purpose: PaymentPurpose
  /** Where to send the payer next */
  nextUrl: string
  message: string
}

export async function fulfillPayment(session: Stripe.Checkout.Session): Promise<FulfillResult | null> {
  if (session.payment_status !== 'paid') return null
  const paymentId = session.metadata?.paymentId
  if (!paymentId) return null

  // Claim the payment; only one caller gets past this
  const claimed = await prisma.pendingPayment.updateMany({
    where: { id: paymentId, status: 'PENDING' },
    data: { status: 'PROCESSING' },
  })
  const payment = await prisma.pendingPayment.findUnique({ where: { id: paymentId } })
  if (!payment) return null
  if (claimed.count === 0) {
    return (payment.result as unknown as FulfillResult) || { purpose: payment.purpose as PaymentPurpose, nextUrl: '/dashboard', message: 'Payment received.' }
  }

  const paymentRef = typeof session.payment_intent === 'string' ? session.payment_intent : session.id
  const userName = session.metadata?.userName || 'Member'
  try {
    const result = await HANDLERS[payment.purpose as PaymentPurpose]({
      userId: payment.userId || '',
      userName,
      amount: payment.amount,
      payload: (payment.payload || {}) as Record<string, any>,
      paymentRef,
    })
    await prisma.pendingPayment.update({
      where: { id: payment.id },
      data: { status: 'FULFILLED', fulfilledAt: new Date(), result: result as unknown as Prisma.InputJsonValue },
    })
    return result
  } catch (error) {
    // Release the claim so the webhook or a retry can finish the job
    await prisma.pendingPayment.update({ where: { id: payment.id }, data: { status: 'PENDING' } })
    throw error
  }
}

// ---------------------------------------------------------------------------
// Fulfillment handlers
// ---------------------------------------------------------------------------

interface HandlerInput {
  userId: string
  userName: string
  amount: number
  payload: Record<string, any>
  paymentRef: string
}

const HANDLERS: Record<PaymentPurpose, (input: HandlerInput) => Promise<FulfillResult>> = {
  async VAULT_DEPOSIT({ userId, userName, amount, payload, paymentRef }) {
    await recordVaultDeposit({
      userId,
      userName,
      amount,
      paymentRef,
      note: payload.note || '',
      isReciprocalMatch: !!payload.isReciprocalMatch,
      forDepositId: payload.forDepositId || undefined,
    })
    return {
      purpose: 'VAULT_DEPOSIT',
      nextUrl: '/chat',
      message: payload.isReciprocalMatch
        ? `You reciprocated with $${amount.toLocaleString()}.`
        : `Your $${amount.toLocaleString()} deposit was added to your joint vault.`,
    }
  },

  async INVESTMENT({ userId, userName, amount, payload, paymentRef }) {
    const opportunity = await prisma.investmentOpportunity.findUnique({ where: { id: payload.opportunityId } })
    if (!opportunity) throw new Error('Investment opportunity no longer exists')

    const now = new Date()
    const maturityDate = new Date(now)
    maturityDate.setMonth(maturityDate.getMonth() + opportunity.termMonths)
    const referenceNumber = `INV-${Date.now().toString(36).toUpperCase()}`

    await prisma.$transaction(async (tx) => {
      const investment = await tx.investment.create({
        data: {
          userId,
          opportunityId: opportunity.id,
          referenceNumber,
          amount: new Prisma.Decimal(amount),
          status: 'ACTIVE',
          confirmedAt: now,
          maturityDate,
        },
      })
      await tx.transaction.create({
        data: {
          userId,
          investmentId: investment.id,
          type: 'DEPOSIT',
          amount: new Prisma.Decimal(amount),
          fee: new Prisma.Decimal(0),
          netAmount: new Prisma.Decimal(amount),
          status: 'COMPLETED',
          reference: `TXN-${referenceNumber}`,
          stripePaymentIntentId: paymentRef,
          description: `Investment in ${opportunity.title}`,
          metadata: { opportunityId: opportunity.id, investorName: userName },
          processedAt: now,
        },
      })
      await tx.investmentOpportunity.update({
        where: { id: opportunity.id },
        data: { fundedAmount: { increment: new Prisma.Decimal(amount) } },
      })
      await tx.notification.create({
        data: {
          userId,
          title: 'Investment confirmed',
          message: `Your $${amount.toLocaleString()} investment in ${opportunity.title} is active (ref ${referenceNumber}).`,
          type: 'SUCCESS',
          link: '/portfolio',
        },
      })
    })
    return { purpose: 'INVESTMENT', nextUrl: '/portfolio', message: `Your $${amount.toLocaleString()} investment in ${opportunity.title} is active.` }
  },

  async MARRIAGE_REGISTRATION({ userId, amount, payload, paymentRef }) {
    const includesCertificate = payload.option === 'both' || payload.option === 'certificate'
    const includesRegistration = payload.option === 'both' || payload.option === 'registration'
    const registration = await prisma.marriageRegistration.create({
      data: {
        docketNumber: await uniqueNumber('UV-REG'),
        userId,
        partner1Name: payload.partner1Name,
        partner1Email: payload.partner1Email,
        partner2Name: payload.partner2Name,
        partner2Email: payload.partner2Email,
        details: payload.details || {},
        registrationPaid: includesRegistration,
        certificatePaid: includesCertificate,
        certificateNumber: includesCertificate ? await uniqueNumber('UV-CERT') : null,
      },
    })
    await recordFee(userId, amount, paymentRef, `Union Verify registration ${registration.docketNumber}`)
    await linkOrInviteSpouse(userId, payload.partner1Name, payload.partner2Email)
    return {
      purpose: 'MARRIAGE_REGISTRATION',
      nextUrl: '/certificate',
      message: `Your union is registered with Union Verify (docket ${registration.docketNumber}).`,
    }
  },

  async CERTIFICATE({ userId, amount, payload, paymentRef }) {
    const registration = await prisma.marriageRegistration.findFirst({ where: { id: payload.registrationId, userId } })
    if (!registration) throw new Error('Registration not found')
    if (!registration.certificatePaid) {
      await prisma.marriageRegistration.update({
        where: { id: registration.id },
        data: { certificatePaid: true, certificateNumber: await uniqueNumber('UV-CERT') },
      })
    }
    await recordFee(userId, amount, paymentRef, `Union Verify certificate for ${registration.docketNumber}`)
    return { purpose: 'CERTIFICATE', nextUrl: '/certificate', message: 'Your certificate is ready.' }
  },
}

async function uniqueNumber(prefix: string): Promise<string> {
  const year = new Date().getFullYear()
  for (;;) {
    const candidate = `${prefix}-${year}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const taken =
      (await prisma.marriageRegistration.findFirst({
        where: { OR: [{ docketNumber: candidate }, { certificateNumber: candidate }] },
        select: { id: true },
      })) !== null
    if (!taken) return candidate
  }
}

async function recordFee(userId: string, amount: number, paymentRef: string, description: string) {
  await prisma.transaction.create({
    data: {
      userId,
      type: 'FEE',
      amount: new Prisma.Decimal(amount),
      fee: new Prisma.Decimal(0),
      netAmount: new Prisma.Decimal(amount),
      status: 'COMPLETED',
      reference: `FEE-${Date.now().toString(36).toUpperCase()}`,
      stripePaymentIntentId: paymentRef,
      description,
      processedAt: new Date(),
    },
  })
}

/** Link the two accounts as spouses if partner 2 already has one; otherwise email an invite. */
async function linkOrInviteSpouse(userId: string, inviterName: string, partnerEmail: string) {
  const email = String(partnerEmail || '').toLowerCase().trim()
  if (!email) return
  const partner = await prisma.user.findUnique({ where: { email } })
  if (partner && partner.id !== userId) {
    const [me, existingSpouse] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { spouseId: true } }),
      resolveSpouseId(partner.id),
    ])
    if (!me?.spouseId && (!existingSpouse || existingSpouse === userId)) {
      await prisma.user.update({ where: { id: userId }, data: { spouseId: partner.id } })
      await prisma.user.update({ where: { id: partner.id }, data: { spouseId: userId } })
    }
    return
  }
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://unionverify.com').replace(/\/$/, '')
  await sendEmail({
    to: email,
    subject: `${inviterName} invited you to Union Verify`,
    html: `<p>${escapeHtml(inviterName)} registered your union on Union Verify and invited you to join.</p>
<p><a href="${appUrl}/register?email=${encodeURIComponent(email)}">Create your account</a> with this email address to link it to theirs.</p>`,
  }).catch((err) => console.error('[payments] spouse invite email failed', err))
}
