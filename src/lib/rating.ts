/**
 * Account rating: a simple setup score from real account data only
 * (marriage registration, identity verification, signed documents and
 * completed non-demo deposits). It does not unlock any benefits.
 */

export interface AccountRating {
  tier: 'AAA' | 'AA+' | 'A' | 'BBB' | 'BB' | 'C'
  score: number // 0 - 100
  title: string
  subtitle: string
  statusLabel: string
  color: {
    bg: string
    text: string
    border: string
    badgeBg: string
    accent: string
    gradient: string
  }
  documentCount: number
  totalAvailableDocuments: number
  completionPercentage: number
  nextTier: string | null
  pointsToNextTier: number
  realDepositedAmount: number
  realInvestedAmount: number
  hasMarriageCovenant: boolean
  isIdentityVerified: boolean
  checklist: {
    label: string
    met: boolean
    description: string
    docType?: string
  }[]
}

/**
 * Filter out demo transactions from official ledgers & ratings
 */
export function isDemoTransaction(tx: {
  reference?: string | null
  description?: string | null
  metadata?: any
}): boolean {
  if (!tx) return false
  if (tx.reference && tx.reference.toUpperCase().includes('DEMO')) return true
  if (tx.description && /demo/i.test(tx.description)) return true
  if (tx.metadata) {
    try {
      const meta = typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata
      if (meta?.isDemo === true || meta?.demo === true) return true
    } catch {
      // ignore
    }
  }
  return false
}

/**
 * Filter out demo investments from official active capital
 */
export function isDemoInvestment(inv: {
  referenceNumber?: string | null
}): boolean {
  if (!inv) return false
  if (inv.referenceNumber && inv.referenceNumber.toUpperCase().includes('DEMO')) return true
  return false
}

/** Counts towards invested totals and the rating: not demo data, not paid with wallet credit */
export function countsInTotals(inv: { referenceNumber?: string | null; fundingSource?: string | null }): boolean {
  return !isDemoInvestment(inv) && inv.fundingSource !== 'CREDIT'
}

interface ComputeRatingParams {
  acknowledgedDocIds: string[]
  allDocuments: Array<{ id: string; name: string; type: string }>
  isIdentityVerified: boolean
  hasMarriageCovenant: boolean
  realDepositedAmount: number
  realInvestedAmount: number
}

export function computeAccountRating(params: ComputeRatingParams): AccountRating {
  const {
    acknowledgedDocIds,
    allDocuments,
    isIdentityVerified,
    hasMarriageCovenant,
    realDepositedAmount,
    realInvestedAmount,
  } = params

  let score = 0

  // 1. Couple linked: a linked partner or a registered union (20 pts)
  const covenantMet = hasMarriageCovenant
  if (covenantMet) {
    score += 20
  }

  // 2. Identity verification (20 pts)
  const kycMet = isIdentityVerified
  if (kycMet) {
    score += 20
  }

  // 3. Document Acknowledgments (up to 30 pts)
  const acknowledgedSet = new Set(acknowledgedDocIds)
  const ackCount = allDocuments.filter((d) => acknowledgedSet.has(d.id)).length

  // 10 pts per acknowledged document up to 30 pts
  const docScore = Math.min(30, ackCount * 10)
  score += docScore

  // 4. Real completed deposits or investments (up to 30 pts); demo entries count for nothing
  if (realDepositedAmount >= 10000 || realInvestedAmount >= 10000) {
    score += 30
  } else if (realDepositedAmount >= 2500 || realInvestedAmount >= 2500) {
    score += 22
  } else if (realDepositedAmount >= 500 || realInvestedAmount >= 500) {
    score += 15
  } else if (realDepositedAmount > 0 || realInvestedAmount > 0) {
    score += 8
  }

  // Checklist items done (signed documents + registration + identity)
  const accumulatedDocsTotal = ackCount + (covenantMet ? 1 : 0) + (kycMet ? 1 : 0)
  const totalPossibleDocs = allDocuments.length + 2 // + registration + identity

  // Clamp score
  score = Math.max(0, Math.min(100, score))

  // Determine tier. The rating only summarises the checklist below; it does not
  // unlock any extra rates, limits or services.
  const tiers: Array<{
    min: number
    tier: AccountRating['tier']
    title: string
    subtitle: string
    statusLabel: string
    color: AccountRating['color']
  }> = [
    {
      min: 90,
      tier: 'AAA',
      title: 'Account fully set up',
      subtitle: 'Partner linked, identity verified, documents signed and real deposits on record.',
      statusLabel: 'Complete',
      color: {
        bg: 'bg-amber-50',
        text: 'text-amber-900',
        border: 'border-[#C9A84C]',
        badgeBg: 'bg-[#C9A84C] text-[#0F1C3F]',
        accent: '#C9A84C',
        gradient: 'from-[#0F1C3F] via-[#1a2d5e] to-[#C9A84C]',
      },
    },
    {
      min: 75,
      tier: 'AA+',
      title: 'Almost complete',
      subtitle: 'Most checklist items are done. Finish the remaining items below.',
      statusLabel: 'Almost complete',
      color: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-900',
        border: 'border-emerald-300',
        badgeBg: 'bg-emerald-600 text-white',
        accent: '#059669',
        gradient: 'from-[#0F1C3F] to-emerald-900',
      },
    },
    {
      min: 55,
      tier: 'A',
      title: 'Well under way',
      subtitle: 'Several checklist items are done. Finish the remaining items below.',
      statusLabel: 'In progress',
      color: {
        bg: 'bg-sky-50',
        text: 'text-sky-900',
        border: 'border-sky-300',
        badgeBg: 'bg-sky-600 text-white',
        accent: '#0284c7',
        gradient: 'from-[#0F1C3F] to-sky-900',
      },
    },
    {
      min: 35,
      tier: 'BBB',
      title: 'Getting started',
      subtitle: 'Some checklist items are done. Finish the remaining items below.',
      statusLabel: 'In progress',
      color: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-900',
        border: 'border-indigo-300',
        badgeBg: 'bg-indigo-600 text-white',
        accent: '#4f46e5',
        gradient: 'from-[#0F1C3F] to-indigo-950',
      },
    },
    {
      min: 20,
      tier: 'BB',
      title: 'Just started',
      subtitle: 'A few checklist items are done. Finish the remaining items below.',
      statusLabel: 'Started',
      color: {
        bg: 'bg-amber-50',
        text: 'text-amber-900',
        border: 'border-amber-200',
        badgeBg: 'bg-amber-500 text-white',
        accent: '#d97706',
        gradient: 'from-[#0F1C3F] to-amber-950',
      },
    },
    {
      min: 0,
      tier: 'C',
      title: 'Not set up yet',
      subtitle: 'Complete the checklist below to set up your account.',
      statusLabel: 'Not started',
      color: {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        badgeBg: 'bg-gray-200 text-gray-800',
        accent: '#64748b',
        gradient: 'from-gray-700 to-gray-900',
      },
    },
  ]
  const index = tiers.findIndex((t) => score >= t.min)
  const current = tiers[index]
  const next = index > 0 ? tiers[index - 1] : null
  const { tier, title, subtitle, statusLabel, color } = current
  const nextTier = next ? next.tier : null
  const pointsToNextTier = next ? next.min - score : 0

  const checklist = [
    {
      label: 'Partner linked',
      met: covenantMet,
      description: covenantMet
        ? 'Your partner is linked (or your union is registered)'
        : 'Link your partner in Settings, or register your union (+20 pts)',
      docType: 'MARRIAGE_COVENANT',
    },
    {
      label: 'Identity verification',
      met: kycMet,
      description: kycMet
        ? 'Your identity has been verified'
        : 'Not verified yet (+20 pts)',
      docType: 'KYC',
    },
    ...allDocuments.map((doc) => {
      const isSigned = acknowledgedSet.has(doc.id)
      return {
        label: doc.name,
        met: isSigned,
        description: isSigned
          ? `Signed (v${(doc as { version?: string }).version || '1.0'})`
          : `Review and sign in Documents (+10 pts)`,
        docType: doc.type,
      }
    }),
    {
      label: 'Deposits of $500 or more',
      met: realDepositedAmount >= 500 || realInvestedAmount >= 500,
      description:
        realDepositedAmount >= 500 || realInvestedAmount >= 500
          ? `$${realDepositedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} in completed deposits`
          : 'Make $500 or more in completed deposits (up to +30 pts)',
    },
  ]

  const completionPercentage = Math.round((accumulatedDocsTotal / Math.max(1, totalPossibleDocs)) * 100)

  return {
    tier,
    score,
    title,
    subtitle,
    statusLabel,
    color,
    documentCount: accumulatedDocsTotal,
    totalAvailableDocuments: totalPossibleDocs,
    completionPercentage,
    nextTier,
    pointsToNextTier: Math.max(0, pointsToNextTier),
    realDepositedAmount,
    realInvestedAmount,
    hasMarriageCovenant: covenantMet,
    isIdentityVerified: kycMet,
    checklist,
  }
}
