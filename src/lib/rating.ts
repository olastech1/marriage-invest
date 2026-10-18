/**
 * Institutional Fiduciary Account Rating System
 * Based on accumulated legal & matrimonial documents, verified identity,
 * and genuine settled capital deposits (strictly excluding demo deposits).
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
  perks: string[]
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

  // 1. Matrimonial Covenant Document / Registration (20 pts)
  const covenantMet = hasMarriageCovenant
  if (covenantMet) {
    score += 20
  }

  // 2. Identity / KYC Verification Document (20 pts)
  const kycMet = isIdentityVerified
  if (kycMet) {
    score += 20
  }

  // 3. Document Acknowledgments (up to 30 pts)
  const acknowledgedSet = new Set(acknowledgedDocIds)
  const ackCount = allDocuments.filter((d) => acknowledgedSet.has(d.id)).length
  const totalDocs = Math.max(allDocuments.length, 4)

  // 10 pts per acknowledged document up to 30 pts
  const docScore = Math.min(30, ackCount * 10)
  score += docScore

  // 4. Real Capital Deposits (Strictly excluding Demo) (up to 30 pts)
  // Demo deposits give 0 points
  if (realDepositedAmount >= 10000 || realInvestedAmount >= 10000) {
    score += 30
  } else if (realDepositedAmount >= 2500 || realInvestedAmount >= 2500) {
    score += 22
  } else if (realDepositedAmount >= 500 || realInvestedAmount >= 500) {
    score += 15
  } else if (realDepositedAmount > 0 || realInvestedAmount > 0) {
    score += 8
  }

  // Calculate total documents accumulated (acknowledged docs + covenant + kyc)
  const accumulatedDocsTotal = ackCount + (covenantMet ? 1 : 0) + (kycMet ? 1 : 0)
  const totalPossibleDocs = allDocuments.length + 2 // + covenant + kyc

  // Clamp score
  score = Math.max(0, Math.min(100, score))

  // Determine Tier
  let tier: AccountRating['tier'] = 'C'
  let title = 'Unverified Registry'
  let subtitle = 'Initial account tier. Legal documentation and identity verification pending.'
  let statusLabel = 'Unverified'
  let nextTier: string | null = 'BB'
  let pointsToNextTier = 25 - score
  let perks = ['Standard profile access']
  let color = {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    badgeBg: 'bg-gray-200 text-gray-800',
    accent: '#64748b',
    gradient: 'from-gray-700 to-gray-900',
  }

  if (score >= 90) {
    tier = 'AAA'
    title = 'Sovereign Institutional Fiduciary'
    subtitle = 'Highest tier international covenant standing with full statutory survivorship and unrestricted vault liquidity.'
    statusLabel = 'Top Sovereign Grade'
    nextTier = null
    pointsToNextTier = 0
    perks = [
      'Statutory 50/50 survivorship covenant guarantee',
      'Unrestricted priority liquidity & zero-fee withdrawals',
      'Maximum 6.8% compounding interest on marital vault',
      'Dedicated fiduciary covenant officer',
    ]
    color = {
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      border: 'border-[#C9A84C]',
      badgeBg: 'bg-[#C9A84C] text-[#0F1C3F]',
      accent: '#C9A84C',
      gradient: 'from-[#0F1C3F] via-[#1a2d5e] to-[#C9A84C]',
    }
  } else if (score >= 75) {
    tier = 'AA+'
    title = 'Prime Matrimonial Covenant'
    subtitle = 'High fiduciary standing with verified spousal declarations and active capital allocation.'
    statusLabel = 'Prime Grade'
    nextTier = 'AAA'
    pointsToNextTier = 90 - score
    perks = [
      'Full 6.8% APY high-yield marital vault rate',
      'Joint digital certificate with cryptographic watermark',
      'Expedited 24h withdrawal review',
    ]
    color = {
      bg: 'bg-emerald-50',
      text: 'text-emerald-900',
      border: 'border-emerald-300',
      badgeBg: 'bg-emerald-600 text-white',
      accent: '#059669',
      gradient: 'from-[#0F1C3F] to-emerald-900',
    }
  } else if (score >= 55) {
    tier = 'A'
    title = 'Verified Fiduciary Account'
    subtitle = 'Fully verified legal identity with accredited agreements executed on record.'
    statusLabel = 'Verified Grade'
    nextTier = 'AA+'
    pointsToNextTier = 75 - score
    perks = [
      'Access to all active investment opportunities',
      'Real-time spouse mutual chat & vault proposals',
      'Certified electronic agreement downloads',
    ]
    color = {
      bg: 'bg-sky-50',
      text: 'text-sky-900',
      border: 'border-sky-300',
      badgeBg: 'bg-sky-600 text-white',
      accent: '#0284c7',
      gradient: 'from-[#0F1C3F] to-sky-900',
    }
  } else if (score >= 35) {
    tier = 'BBB'
    title = 'Accredited Standard Covenant'
    subtitle = 'Basic legal documentation recorded. Awaiting full covenant execution or real deposit settlement.'
    statusLabel = 'Standard Grade'
    nextTier = 'A'
    pointsToNextTier = 55 - score
    perks = [
      'Standard investment participation',
      'Document library review access',
    ]
    color = {
      bg: 'bg-indigo-50',
      text: 'text-indigo-900',
      border: 'border-indigo-300',
      badgeBg: 'bg-indigo-600 text-white',
      accent: '#4f46e5',
      gradient: 'from-[#0F1C3F] to-indigo-950',
    }
  } else if (score >= 20) {
    tier = 'BB'
    title = 'Provisional Registry'
    subtitle = 'Partial document completion. Execute remaining core disclosures to elevate account standing.'
    statusLabel = 'Provisional'
    nextTier = 'BBB'
    pointsToNextTier = 35 - score
    perks = [
      'Provisional profile setup',
      'Read-only opportunity review',
    ]
    color = {
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      border: 'border-amber-200',
      badgeBg: 'bg-amber-500 text-white',
      accent: '#d97706',
      gradient: 'from-[#0F1C3F] to-amber-950',
    }
  }

  const checklist = [
    {
      label: 'Matrimonial Covenant / Marriage Registration',
      met: covenantMet,
      description: covenantMet
        ? 'Official matrimonial registration & legal docket recorded'
        : 'Register your union at /get-married to record docket (+20 pts)',
      docType: 'MARRIAGE_COVENANT',
    },
    {
      label: 'Identity & Legal Verification (KYC)',
      met: kycMet,
      description: kycMet
        ? 'Government identity and marriage eligibility verified'
        : 'Complete identity verification on profile (+20 pts)',
      docType: 'KYC',
    },
    ...allDocuments.map((doc) => {
      const isSigned = acknowledgedSet.has(doc.id)
      return {
        label: doc.name,
        met: isSigned,
        description: isSigned
          ? `Executed on electronic ledger (v${(doc as any).version || '1.0'})`
          : `Review & execute document in library (+10 pts)`,
        docType: doc.type,
      }
    }),
    {
      label: 'Real Capital Deposit Settled',
      met: realDepositedAmount >= 500 || realInvestedAmount >= 500,
      description:
        realDepositedAmount >= 500 || realInvestedAmount >= 500
          ? `$${realDepositedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} verified real settled capital (Demo excluded)`
          : 'Fund account with $500+ verified real deposit. Demo allocations strictly excluded (+15 pts)',
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
    perks,
  }
}
