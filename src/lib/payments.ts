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
import { isPartner, linkPartners } from '@/lib/partners'
import { sendEmail } from '@/lib/email'
import { escapeHtml } from '@/lib/utils'
import { recordVaultDeposit } from '@/lib/vaultDeposits'
import { emailMember, postToCoupleChat } from '@/lib/activity'
import { siteUrl } from '@/lib/site'
import { recordInvitation } from '@/lib/invitations'
import { moveWallet, walletRef } from '@/lib/wallet'

export type PaymentPurpose = 'VAULT_DEPOSIT' | 'INVESTMENT' | 'MARRIAGE_REGISTRATION' | 'CERTIFICATE' | 'UNION_SECOND_HALF' | 'WALLET_TOPUP'

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
    const { partnerId } = await recordVaultDeposit({
      userId,
      userName,
      amount,
      paymentRef,
      note: payload.note || '',
      isReciprocalMatch: !!payload.isReciprocalMatch,
      forDepositId: payload.forDepositId || undefined,
      proposalId: payload.proposalId || undefined,
      partnerId: payload.partnerId || undefined,
    })
    return {
      purpose: 'VAULT_DEPOSIT',
      // Back to the chat with that partner
      nextUrl: partnerId ? `/chat?recipientId=${encodeURIComponent(partnerId)}` : '/save',
      message: payload.isReciprocalMatch
        ? `You reciprocated with $${amount.toLocaleString()}.`
        : `Your $${amount.toLocaleString()} deposit was added to your joint vault.`,
    }
  },

  async INVESTMENT({ userId, userName, amount, payload, paymentRef }) {
    // Paid from a partner's invitation: shared with them (they approve withdrawals); otherwise personal
    const partnerId = payload.partnerId && (await isPartner(userId, String(payload.partnerId))) ? String(payload.partnerId) : null
    const { message } = await createInvestment({ userId, userName, opportunityId: payload.opportunityId, amount, partnerId, source: 'CARD', paymentRef })
    return { purpose: 'INVESTMENT', nextUrl: '/portfolio', message }
  },

  async WALLET_TOPUP({ userId, amount, paymentRef }) {
    const now = new Date()
    const reference = `TXN-${walletRef('WAL')}`
    await prisma.$transaction(async (tx) => {
      await moveWallet(tx, { userId, kind: 'CASH', amount, reason: 'Added by card', reference })
      await tx.transaction.create({
        data: {
          userId,
          type: 'DEPOSIT',
          amount: new Prisma.Decimal(amount),
          fee: new Prisma.Decimal(0),
          netAmount: new Prisma.Decimal(amount),
          status: 'COMPLETED',
          reference,
          stripePaymentIntentId: paymentRef,
          description: 'Wallet top-up',
          processedAt: now,
        },
      })
    })
    return { purpose: 'WALLET_TOPUP', nextUrl: '/wallet', message: `$${amount.toLocaleString()} was added to your wallet.` }
  },

  async MARRIAGE_REGISTRATION({ userId, userName, amount, payload, paymentRef }) {
    // 50-50: this is the first half; the package unlocks when the partner pays theirs
    const split = payload.option === 'split'
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
        details: { ...(payload.details || {}), ...(split ? { split: { firstPaidBy: userId, firstPaidAt: new Date().toISOString(), half: amount } } : {}) },
        registrationPaid: includesRegistration,
        certificatePaid: includesCertificate,
        certificateNumber: includesCertificate ? await uniqueNumber('UV-CERT') : null,
      },
    })
    await recordFee(userId, amount, paymentRef, `Union Verify registration ${registration.docketNumber}`)
    await linkOrInviteSpouse(userId, payload.partner1Name, payload.partner2Email)
    const registeredText = split
      ? `I paid my $${amount.toLocaleString()} half of our union package (docket ${registration.docketNumber}). Pay your half to unlock our registration and certificate.`
      : `Our union is registered with Union Verify (docket ${registration.docketNumber})${includesCertificate ? ` and our certificate ${registration.certificateNumber} is ready` : ''}.`
    const partner = await prisma.user.findUnique({ where: { email: String(payload.partner2Email || '').toLowerCase() }, select: { id: true } })
    await postToCoupleChat(userId, userName, partner?.id, { type: 'certificate', text: registeredText })
    if (split) {
      for (const id of [userId, partner?.id]) {
        await emailMember(id, {
          subject: id === userId ? `Your half of the union package is paid (${registration.docketNumber})` : `${userName} paid their half of your union package`,
          heading: id === userId ? 'Your half is paid' : 'Your half is waiting',
          paragraphs: [
            id === userId
              ? `You paid $${amount.toLocaleString()}. When ${payload.partner2Name} pays their $${amount.toLocaleString()}, your registration and certificate unlock.`
              : `${userName} paid $${amount.toLocaleString()} toward your union package (registration and certificate). Pay your $${amount.toLocaleString()} half to unlock it.`,
          ],
          ctaLabel: id === userId ? 'View the package' : `Pay my $${amount.toLocaleString()}`,
          ctaPath: '/certificate',
        })
      }
      return {
        purpose: 'MARRIAGE_REGISTRATION',
        nextUrl: '/certificate',
        message: `Your half is paid. The package unlocks when ${payload.partner2Name} pays theirs.`,
      }
    }
    for (const id of [userId, partner?.id]) {
      await emailMember(id, {
        subject: `Your union is registered (${registration.docketNumber})`,
        heading: 'Union registered',
        paragraphs: [
          `${payload.partner1Name} and ${payload.partner2Name} are registered with Union Verify. Docket: ${registration.docketNumber}.`,
          includesCertificate ? `Certificate number: ${registration.certificateNumber}.` : 'You can add the certificate any time from the certificate page.',
          'This is a Union Verify platform record, not a government-issued marriage certificate.',
        ],
        ctaLabel: 'View certificate',
        ctaPath: '/certificate',
      })
    }
    return {
      purpose: 'MARRIAGE_REGISTRATION',
      nextUrl: '/certificate',
      message: `Your union is registered with Union Verify (docket ${registration.docketNumber}).`,
    }
  },

  // The partner pays the second half of a 50-50 union package: it unlocks
  async UNION_SECOND_HALF({ userId, userName, amount, payload, paymentRef }) {
    const registration = await prisma.marriageRegistration.findUnique({ where: { id: String(payload.registrationId || '') } })
    if (!registration) throw new Error('Registration not found')
    const details = (registration.details || {}) as Record<string, unknown>
    if (!registration.registrationPaid) {
      await prisma.marriageRegistration.update({
        where: { id: registration.id },
        data: {
          registrationPaid: true,
          certificatePaid: true,
          certificateNumber: registration.certificateNumber || (await uniqueNumber('UV-CERT')),
          details: { ...details, split: { ...((details.split as Record<string, unknown>) || {}), secondPaidBy: userId, secondPaidAt: new Date().toISOString() } },
        },
      })
    }
    await recordFee(userId, amount, paymentRef, `Union Verify package (second half) ${registration.docketNumber}`)
    await postToCoupleChat(userId, userName, registration.userId, {
      type: 'certificate',
      text: `I paid my half. Our union is registered and our certificate is ready (docket ${registration.docketNumber}).`,
    })
    for (const id of [registration.userId, userId]) {
      await emailMember(id, {
        subject: 'Your union package is unlocked',
        heading: 'Registration and certificate ready',
        paragraphs: [`Both halves are paid. ${registration.partner1Name} and ${registration.partner2Name} are registered (docket ${registration.docketNumber}) and the certificate is ready.`],
        ctaLabel: 'View certificate',
        ctaPath: '/certificate',
      })
    }
    return { purpose: 'UNION_SECOND_HALF', nextUrl: '/certificate', message: 'Both halves are paid. Your certificate is ready.' }
  },

  async CERTIFICATE({ userId, userName, amount, payload, paymentRef }) {
    const registration = await prisma.marriageRegistration.findFirst({ where: { id: payload.registrationId, userId } })
    if (!registration) throw new Error('Registration not found')
    if (!registration.certificatePaid) {
      await prisma.marriageRegistration.update({
        where: { id: registration.id },
        data: { certificatePaid: true, certificateNumber: await uniqueNumber('UV-CERT') },
      })
    }
    await recordFee(userId, amount, paymentRef, `Union Verify certificate for ${registration.docketNumber}`)
    const partner = await prisma.user.findUnique({ where: { email: registration.partner2Email }, select: { id: true } })
    await postToCoupleChat(userId, userName, partner?.id, { type: 'certificate', text: `Our Union Verify certificate is ready (docket ${registration.docketNumber}).` })
    for (const id of [userId, partner?.id]) {
      await emailMember(id, {
        subject: 'Your Union Verify certificate is ready',
        heading: 'Certificate ready',
        paragraphs: [`The certificate for ${registration.partner1Name} and ${registration.partner2Name} (docket ${registration.docketNumber}) is ready to view and print.`],
        ctaLabel: 'View certificate',
        ctaPath: '/certificate',
      })
    }
    return { purpose: 'CERTIFICATE', nextUrl: '/certificate', message: 'Your certificate is ready.' }
  },
}

/**
 * Create an active investment. CARD was paid by card just now; WALLET is taken
 * from wallet cash and CREDIT from wallet credit in the same database
 * transaction. CREDIT investments are left out of the round's raised amount and
 * the ledger, and can't be withdrawn.
 */
export async function createInvestment(input: {
  userId: string
  userName: string
  opportunityId: string
  amount: number
  partnerId: string | null
  source: 'CARD' | 'WALLET' | 'CREDIT'
  paymentRef?: string
}): Promise<{ message: string; referenceNumber: string }> {
  const { userId, userName, amount, partnerId, source } = input
  const opportunity = await prisma.investmentOpportunity.findUnique({ where: { id: input.opportunityId } })
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
        partnerId,
        fundingSource: source,
      },
    })
    if (source === 'CARD') {
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
          stripePaymentIntentId: input.paymentRef,
          description: `Investment in ${opportunity.title}`,
          metadata: { opportunityId: opportunity.id, investorName: userName },
          processedAt: now,
        },
      })
    } else {
      // Throws (and undoes the investment) if the balance is too low
      await moveWallet(tx, {
        userId,
        kind: source === 'WALLET' ? 'CASH' : 'CREDIT',
        amount: -amount,
        reason: `Invested in ${opportunity.title}`,
        investmentId: investment.id,
      })
    }
    if (source !== 'CREDIT') {
      await tx.investmentOpportunity.update({
        where: { id: opportunity.id },
        data: { fundedAmount: { increment: new Prisma.Decimal(amount) } },
      })
    }
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
  const usd = `$${amount.toLocaleString()}`
  await postToCoupleChat(userId, userName, partnerId, {
    type: 'investment',
    text: `Invested ${usd} in ${opportunity.title}.`,
    proposalData: { goalName: opportunity.title, amount, slug: opportunity.slug },
  })
  await emailMember(userId, {
    subject: `Investment confirmed: ${usd} in ${opportunity.title}`,
    heading: 'Your investment is active',
    paragraphs: [
      `Your ${usd} investment in ${opportunity.title} is active (reference ${referenceNumber}).`,
      `Term: ${opportunity.termMonths} months. Returns are projections, not guarantees.`,
      ...(source === 'CREDIT' ? ['It was paid with your wallet credit, so it can\'t be withdrawn.'] : []),
    ],
    ctaLabel: 'View portfolio',
    ctaPath: '/portfolio',
  })
  await emailMember(partnerId, {
    subject: `${userName} invested ${usd} in ${opportunity.title}`,
    heading: `${userName} made an investment`,
    paragraphs: [`${userName} invested ${usd} in ${opportunity.title}.`],
    ctaLabel: 'View the opportunity',
    ctaPath: `/investments/${opportunity.slug}`,
  })
  return { message: `Your ${usd} investment in ${opportunity.title} is active.`, referenceNumber }
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
    await linkPartners(userId, partner.id, 'spouse')
    return
  }
  await recordInvitation(userId, email)
  const appUrl = siteUrl()
  await sendEmail({
    to: email,
    subject: `${inviterName} invited you to Union Verify`,
    html: `<p>${escapeHtml(inviterName)} registered your union on Union Verify and invited you to join.</p>
<p><a href="${appUrl}/register?email=${encodeURIComponent(email)}">Create your account</a> with this email address to link it to theirs.</p>`,
  }).catch((err) => console.error('[payments] partner invite email failed', err))
}
