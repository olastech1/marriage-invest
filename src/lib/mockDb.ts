/**
 * In-Memory Frontend Mock Database Engine
 *
 * Provides a 100% self-contained database layer for Union Invest.
 * Eliminates all external database server dependencies (no PostgreSQL required),
 * preventing connection timeouts, firewall blocks, or serverless deployment crashes.
 */

import { Prisma } from '@prisma/client'

export interface MockUser {
  id: string
  name: string
  email: string
  passwordHash?: string
  role: 'INVESTOR' | 'ADMIN' | 'FINANCE' | 'COMPLIANCE' | 'SUPPORT'
  emailVerified: Date | null
  twoFactorEnabled: boolean
  identityVerified: boolean
  identityVerifiedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface MockOpportunity {
  id: string
  title: string
  slug: string
  description: string
  shortDescription: string
  minAmount: Prisma.Decimal
  maxAmount: Prisma.Decimal | null
  targetAmount: Prisma.Decimal
  fundedAmount: Prisma.Decimal
  termMonths: number
  annualReturnRate: Prisma.Decimal
  distributionType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'AT_MATURITY'
  status: 'DRAFT' | 'ACTIVE' | 'FUNDED' | 'CLOSED' | 'CANCELLED'
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  openDate: Date
  closeDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface MockInvestment {
  id: string
  userId: string
  opportunityId: string
  referenceNumber: string
  amount: Prisma.Decimal
  status: 'PENDING' | 'ACTIVE' | 'MATURED' | 'CANCELLED' | 'DEFAULTED'
  confirmedAt?: Date | null
  maturityDate?: Date | null
  createdAt: Date
  updatedAt: Date
  opportunity?: MockOpportunity
}

export interface MockTransaction {
  id: string
  userId: string
  investmentId?: string | null
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'DISTRIBUTION' | 'FEE' | 'REFUND' | 'ADJUSTMENT'
  amount: Prisma.Decimal
  fee: Prisma.Decimal
  netAmount: Prisma.Decimal
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
  reference: string
  stripePaymentIntentId?: string | null
  stripeChargeId?: string | null
  description: string
  metadata?: any
  processedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  investment?: MockInvestment
}

export interface MockWithdrawal {
  id: string
  userId: string
  investmentId: string
  amount: Prisma.Decimal
  fee: Prisma.Decimal
  netAmount: Prisma.Decimal
  status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'
  bankName: string | null
  accountName: string | null
  accountNumber: string | null
  routingNumber: string | null
  adminNote: string | null
  approvedById?: string | null
  approvedAt?: Date | null
  processedAt?: Date | null
  rejectedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  investment?: MockInvestment
  user?: MockUser
}

export interface MockNotification {
  id: string
  userId: string
  title: string
  message: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT'
  read: boolean
  link: string | null
  createdAt: Date
}

export interface MockDocument {
  id: string
  name: string
  description: string | null
  type: 'OFFER_DOCUMENT' | 'INVESTMENT_AGREEMENT' | 'RECEIPT' | 'STATEMENT' | 'TAX_DOCUMENT' | 'NOTICE' | 'KYC' | 'OTHER'
  version: string
  fileUrl: string
  fileSize: number | null
  mimeType: string
  opportunityId: string | null
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MockAuditLog {
  id: string
  userId: string | null
  action: string
  entity: string
  entityId?: string | null
  before?: any
  after?: any
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: Date
}

// ---------------------------------------------------------------------------
// Seed Data
// ---------------------------------------------------------------------------

const users: MockUser[] = [
  {
    id: 'usr_jane_doe',
    name: 'Jane Doe',
    email: 'jane.doe@unioninvest.com',
    role: 'INVESTOR',
    emailVerified: new Date('2024-01-15'),
    twoFactorEnabled: false,
    identityVerified: true,
    identityVerifiedAt: new Date('2024-01-20'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'usr_marcus_vance',
    name: 'Marcus Vance',
    email: 'marcus.vance@unioninvest.com',
    role: 'INVESTOR',
    emailVerified: new Date('2024-01-15'),
    twoFactorEnabled: false,
    identityVerified: true,
    identityVerifiedAt: new Date('2024-01-20'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'usr_admin',
    name: 'Platform Administrator',
    email: 'admin@unioninvest.com',
    role: 'ADMIN',
    emailVerified: new Date('2024-01-01'),
    twoFactorEnabled: true,
    identityVerified: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
]

const opportunities: MockOpportunity[] = [
  {
    id: 'opp_swiss',
    title: 'Swiss Matrimonial Reserve Vault',
    slug: 'swiss-matrimonial-reserve-vault',
    description: 'High-security, inflation-hedged joint spousal reserve managed with AAA sovereign bonds and capital preservation covenants.',
    shortDescription: 'Core sovereign capital preservation vault with 6.8% compounding yield.',
    minAmount: new Prisma.Decimal(50),
    maxAmount: new Prisma.Decimal(100000),
    targetAmount: new Prisma.Decimal(500000),
    fundedAmount: new Prisma.Decimal(382500),
    termMonths: 12,
    annualReturnRate: new Prisma.Decimal(6.8),
    distributionType: 'MONTHLY',
    status: 'ACTIVE',
    riskLevel: 'LOW',
    openDate: new Date('2024-01-01'),
    closeDate: new Date('2027-12-31'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'opp_family',
    title: 'Family Dream Home Down Payment Fund',
    slug: 'family-dream-home-down-payment-fund',
    description: 'Targeted residential real-estate mezzanine fund designed for married couples accelerating home ownership.',
    shortDescription: 'Residential real estate debt with monthly liquidity matching.',
    minAmount: new Prisma.Decimal(100),
    maxAmount: new Prisma.Decimal(250000),
    targetAmount: new Prisma.Decimal(250000),
    fundedAmount: new Prisma.Decimal(194000),
    termMonths: 24,
    annualReturnRate: new Prisma.Decimal(8.5),
    distributionType: 'MONTHLY',
    status: 'ACTIVE',
    riskLevel: 'MEDIUM',
    openDate: new Date('2024-01-01'),
    closeDate: new Date('2027-12-31'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'opp_education',
    title: 'First Child Education & Legacy Trust',
    slug: 'first-child-education-legacy-trust',
    description: 'Multi-decade educational endowment fund tailored for future family milestones and college funds.',
    shortDescription: 'Long-term endowment vehicle with quarterly distributions.',
    minAmount: new Prisma.Decimal(250),
    maxAmount: new Prisma.Decimal(150000),
    targetAmount: new Prisma.Decimal(150000),
    fundedAmount: new Prisma.Decimal(112000),
    termMonths: 36,
    annualReturnRate: new Prisma.Decimal(7.2),
    distributionType: 'QUARTERLY',
    status: 'ACTIVE',
    riskLevel: 'LOW',
    openDate: new Date('2024-01-01'),
    closeDate: new Date('2027-12-31'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'opp_anniversary',
    title: '10-Year Global Anniversary Asset',
    slug: '10-year-global-anniversary-asset',
    description: 'Opportunistic lifestyle and celebration fund yielding quarterly distributions.',
    shortDescription: 'Celebration yield fund with flexible maturity.',
    minAmount: new Prisma.Decimal(500),
    maxAmount: new Prisma.Decimal(100000),
    targetAmount: new Prisma.Decimal(100000),
    fundedAmount: new Prisma.Decimal(87500),
    termMonths: 12,
    annualReturnRate: new Prisma.Decimal(9.4),
    distributionType: 'AT_MATURITY',
    status: 'ACTIVE',
    riskLevel: 'MEDIUM',
    openDate: new Date('2024-01-01'),
    closeDate: new Date('2027-12-31'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
]

const investments: MockInvestment[] = [
  {
    id: 'inv_1',
    userId: 'usr_jane_doe',
    opportunityId: 'opp_swiss',
    referenceNumber: 'MI-2024-SWISS89',
    amount: new Prisma.Decimal(18500),
    status: 'ACTIVE',
    confirmedAt: new Date('2024-02-01'),
    maturityDate: new Date(Date.now() + 180 * 24 * 3600 * 1000),
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    opportunity: opportunities[0],
  },
  {
    id: 'inv_2',
    userId: 'usr_jane_doe',
    opportunityId: 'opp_family',
    referenceNumber: 'MI-2024-HOME44',
    amount: new Prisma.Decimal(6250),
    status: 'ACTIVE',
    confirmedAt: new Date('2024-03-15'),
    maturityDate: new Date(Date.now() + 420 * 24 * 3600 * 1000),
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
    opportunity: opportunities[1],
  },
  {
    id: 'inv_3',
    userId: 'usr_jane_doe',
    opportunityId: 'opp_swiss',
    referenceNumber: 'SOLO-2024-GRW91',
    amount: new Prisma.Decimal(2500),
    status: 'ACTIVE',
    confirmedAt: new Date('2024-04-10'),
    maturityDate: new Date(Date.now() + 210 * 24 * 3600 * 1000),
    createdAt: new Date('2024-04-10'),
    updatedAt: new Date('2024-04-10'),
    opportunity: opportunities[0],
  },
]

const transactions: MockTransaction[] = [
  {
    id: 'tx_1',
    userId: 'usr_jane_doe',
    investmentId: 'inv_1',
    type: 'DEPOSIT',
    amount: new Prisma.Decimal(15000),
    fee: new Prisma.Decimal(0),
    netAmount: new Prisma.Decimal(15000),
    status: 'COMPLETED',
    reference: 'TXN-2024-DEP01',
    description: 'Initial Joint Vault Deposit',
    processedAt: new Date('2024-02-01'),
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    investment: investments[0],
  },
  {
    id: 'tx_2',
    userId: 'usr_jane_doe',
    investmentId: 'inv_1',
    type: 'DEPOSIT',
    amount: new Prisma.Decimal(3500),
    fee: new Prisma.Decimal(0),
    netAmount: new Prisma.Decimal(3500),
    status: 'COMPLETED',
    reference: 'TXN-2024-DEP02',
    description: 'Monthly Automatic Contribution',
    processedAt: new Date('2024-03-01'),
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
    investment: investments[0],
  },
  {
    id: 'tx_3',
    userId: 'usr_jane_doe',
    investmentId: 'inv_1',
    type: 'DISTRIBUTION',
    amount: new Prisma.Decimal(104.83),
    fee: new Prisma.Decimal(0),
    netAmount: new Prisma.Decimal(104.83),
    status: 'COMPLETED',
    reference: 'TXN-2024-YLD01',
    description: 'Swiss Vault Monthly Yield 6.8% APY',
    processedAt: new Date('2024-03-01'),
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
    investment: investments[0],
  },
  {
    id: 'tx_4',
    userId: 'usr_jane_doe',
    investmentId: 'inv_1',
    type: 'DISTRIBUTION',
    amount: new Prisma.Decimal(105.12),
    fee: new Prisma.Decimal(0),
    netAmount: new Prisma.Decimal(105.12),
    status: 'COMPLETED',
    reference: 'TXN-2024-YLD02',
    description: 'Swiss Vault Monthly Yield 6.8% APY',
    processedAt: new Date('2024-04-01'),
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-01'),
    investment: investments[0],
  },
  {
    id: 'tx_5',
    userId: 'usr_jane_doe',
    investmentId: 'inv_2',
    type: 'DEPOSIT',
    amount: new Prisma.Decimal(6250),
    fee: new Prisma.Decimal(0),
    netAmount: new Prisma.Decimal(6250),
    status: 'COMPLETED',
    reference: 'TXN-2024-DEP03',
    description: 'Family Dream Home Down Payment Fund',
    processedAt: new Date('2024-03-15'),
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
    investment: investments[1],
  },
  {
    id: 'tx_6',
    userId: 'usr_jane_doe',
    investmentId: 'inv_3',
    type: 'DEPOSIT',
    amount: new Prisma.Decimal(2500),
    fee: new Prisma.Decimal(0),
    netAmount: new Prisma.Decimal(2500),
    status: 'COMPLETED',
    reference: 'TXN-2024-DEP04',
    description: 'Solo Growth Portfolio',
    processedAt: new Date('2024-04-10'),
    createdAt: new Date('2024-04-10'),
    updatedAt: new Date('2024-04-10'),
    investment: investments[2],
  },
]

const withdrawals: MockWithdrawal[] = [
  {
    id: 'wd_1',
    userId: 'usr_jane_doe',
    investmentId: 'inv_1',
    amount: new Prisma.Decimal(1000),
    fee: new Prisma.Decimal(30),
    netAmount: new Prisma.Decimal(970),
    status: 'PENDING',
    bankName: 'JPMorgan Chase',
    accountName: 'Jane & Marcus Doe-Vance',
    accountNumber: '****4821',
    routingNumber: '021000021',
    adminNote: JSON.stringify({
      requiresPartnerApproval: true,
      partnerApprovalStatus: 'AWAITING_PARTNER',
      requestedByName: 'Jane Doe',
      partnerName: 'Marcus Vance',
      initiatedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    }),
    createdAt: new Date(Date.now() - 3600 * 1000),
    updatedAt: new Date(Date.now() - 3600 * 1000),
    investment: investments[0],
    user: users[0],
  },
]

const notifications: MockNotification[] = [
  {
    id: 'n_1',
    userId: 'usr_jane_doe',
    title: '⚡ Compulsory Reciprocation Active',
    message: 'Marcus Vance deposited $500.00 into your Joint Vault. Under Spousal Covenant Rule 4.2, you are required to reciprocate with an equal contribution!',
    type: 'WARNING',
    read: false,
    link: '/save',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000),
  },
  {
    id: 'n_2',
    userId: 'usr_jane_doe',
    title: 'Partner Approval Requested 🔐',
    message: 'Marcus Vance requested a withdrawal of $1,000. Under your Spousal Covenant, your digital signature is required before release.',
    type: 'INFO',
    read: false,
    link: '/withdrawals',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000),
  },
  {
    id: 'n_3',
    userId: 'usr_jane_doe',
    title: 'Monthly Yield Credited 🎉',
    message: 'Your joint vault earned $105.12 in monthly compound distributions.',
    type: 'SUCCESS',
    read: true,
    link: '/transactions',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000),
  },
  {
    id: 'n_4',
    userId: 'usr_jane_doe',
    title: 'Matrimonial Covenant Sealed 💍',
    message: 'Your marriage certificate and fiduciary covenant agreement are in full legal standing.',
    type: 'SUCCESS',
    read: true,
    link: '/certificate',
    createdAt: new Date('2024-01-20'),
  },
]

const documents: MockDocument[] = [
  {
    id: 'doc_1',
    name: 'Union Invest Master Platform Offering Memorandum',
    description: 'Comprehensive regulatory disclosure, terms of issuance, and fiduciary governance guidelines.',
    type: 'OFFER_DOCUMENT',
    version: '2.4',
    fileUrl: '/docs/union-invest-offering.pdf',
    fileSize: 1420500,
    mimeType: 'application/pdf',
    opportunityId: null,
    isPublic: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'doc_2',
    name: 'Mutual Spousal Covenant & Co-Ownership Agreement',
    description: 'Bilateral legal contract establishing equal 50/50 beneficial ownership and dual-signature withdrawal lock.',
    type: 'INVESTMENT_AGREEMENT',
    version: '1.2',
    fileUrl: '/docs/spousal-covenant.pdf',
    fileSize: 845200,
    mimeType: 'application/pdf',
    opportunityId: 'opp_swiss',
    isPublic: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'doc_3',
    name: 'Fiduciary Liquidity & Risk Management Policy',
    description: 'Capital reserve standards, secondary distribution rules, and early exit calculations.',
    type: 'NOTICE',
    version: '1.0',
    fileUrl: '/docs/liquidity-policy.pdf',
    fileSize: 620100,
    mimeType: 'application/pdf',
    opportunityId: null,
    isPublic: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'doc_4',
    name: 'Swiss Vault AAA Sovereign Custody Guarantee',
    description: 'Direct institutional custody verification and ring-fenced bank balance certificates.',
    type: 'STATEMENT',
    version: '3.1',
    fileUrl: '/docs/swiss-custody.pdf',
    fileSize: 1104000,
    mimeType: 'application/pdf',
    opportunityId: 'opp_swiss',
    isPublic: false,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
]

const documentAcknowledgments = [
  { id: 'ack_1', userId: 'usr_jane_doe', documentId: 'doc_1', signedAt: new Date('2024-01-16') },
  { id: 'ack_2', userId: 'usr_jane_doe', documentId: 'doc_2', signedAt: new Date('2024-01-18') },
  { id: 'ack_3', userId: 'usr_jane_doe', documentId: 'doc_3', signedAt: new Date('2024-01-19') },
  { id: 'ack_4', userId: 'usr_jane_doe', documentId: 'doc_4', signedAt: new Date('2024-02-02') },
]

const auditLogs: MockAuditLog[] = [
  {
    id: 'audit_1',
    userId: 'usr_jane_doe',
    action: 'MARRIAGE_REGISTRATION_CREATED',
    entity: 'User',
    entityId: 'usr_jane_doe',
    after: { spouseName: 'Marcus Vance', registeredAt: '2024-01-20' },
    createdAt: new Date('2024-01-20'),
  },
  {
    id: 'audit_2',
    userId: 'usr_jane_doe',
    action: 'RECIPROCATION_OBLIGATION_CREATED',
    entity: 'SavingsVault',
    after: {
      depositorName: 'Marcus Vance',
      requiredReciprocatorName: 'Jane Doe',
      amount: 500,
      partnerNote: 'I just saved $500 for our trip to Italy! Under our Spousal Covenant, you must match this deposit ❤️',
      dueDate: new Date(Date.now() + 41 * 3600 * 1000).toISOString(),
      status: 'PENDING',
    },
    createdAt: new Date(Date.now() - 7 * 3600 * 1000),
  },
]

// ---------------------------------------------------------------------------
// Mock Prisma Delegate Implementations
// ---------------------------------------------------------------------------

function makeDelegate<T extends { id: string }>(store: T[]) {
  return {
    async findMany(args?: any): Promise<T[]> {
      let result = [...store]
      if (args?.where) {
        result = result.filter((item: any) => {
          for (const [key, value] of Object.entries(args.where)) {
            if (value === undefined) continue
            if (typeof value === 'object' && value !== null) {
              if ('in' in (value as any) && Array.isArray((value as any).in)) {
                if (!(value as any).in.includes(item[key])) return false
                continue
              }
            }
            if (item[key] !== value) return false
          }
          return true
        })
      }
      if (args?.orderBy?.createdAt === 'desc') {
        result.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      }
      if (typeof args?.take === 'number') {
        result = result.slice(0, args.take)
      }
      return result
    },

    async findFirst(args?: any): Promise<T | null> {
      const items = await this.findMany(args)
      return items[0] ?? null
    },

    async findUnique(args?: any): Promise<T | null> {
      if (!args?.where) return null
      return (
        store.find((item: any) => {
          for (const [key, value] of Object.entries(args.where)) {
            if (item[key] === value) return true
          }
          return false
        }) ?? null
      )
    },

    async create(args: { data: any }): Promise<T> {
      const newItem: any = {
        id: args.data.id || `mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args.data,
      }
      store.unshift(newItem)
      return newItem
    },

    async update(args: { where: any; data: any }): Promise<T> {
      const existing: any = await this.findUnique(args)
      if (!existing) {
        throw new Error('Record not found to update')
      }
      Object.assign(existing, args.data, { updatedAt: new Date() })
      return existing
    },

    async upsert(args: { where: any; create: any; update: any }): Promise<T> {
      const existing = await this.findUnique(args)
      if (existing) {
        return this.update({ where: args.where, data: args.update })
      }
      return this.create({ data: args.create })
    },

    async count(args?: any): Promise<number> {
      const items = await this.findMany(args)
      return items.length
    },
  }
}

// ---------------------------------------------------------------------------
// Mock Prisma Client
// ---------------------------------------------------------------------------

export const mockPrismaClient = {
  user: makeDelegate(users),
  investmentOpportunity: makeDelegate(opportunities),
  investment: makeDelegate(investments),
  transaction: makeDelegate(transactions),
  withdrawalRequest: makeDelegate(withdrawals),
  notification: makeDelegate(notifications),
  document: makeDelegate(documents),
  documentAcknowledgment: makeDelegate(documentAcknowledgments),
  auditLog: makeDelegate(auditLogs),

  async $transaction<T>(cb: (tx: any) => Promise<T>): Promise<T> {
    return cb(mockPrismaClient)
  },
}
