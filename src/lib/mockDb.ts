/**
 * In-Memory Frontend Mock Database Engine
 *
 * Provides a 100% self-contained database layer for Union Verify.
 * Eliminates all external database server dependencies (no PostgreSQL required),
 * preventing connection timeouts, firewall blocks, or serverless deployment crashes.
 */

import { Prisma } from '@prisma/client'

export interface MockUser {
  id: string
  name: string
  username?: string | null
  email: string
  phone?: string | null
  bio?: string | null
  avatarUrl?: string | null
  socials?: {
    instagram?: string
    tiktok?: string
    twitter?: string
    whatsapp?: string
    linkedin?: string
    website?: string
  } | null
  publicChatEnabled?: boolean
  showPhone?: boolean
  showEmail?: boolean
  passwordHash?: string
  role: 'INVESTOR' | 'ADMIN' | 'FINANCE' | 'COMPLIANCE' | 'SUPPORT'
  emailVerified: Date | null
  twoFactorEnabled: boolean
  identityVerified: boolean
  identityVerifiedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface MockDepositReminder {
  id: string
  userId: string
  targetPartnerId: string
  targetPartnerName: string
  targetEmail: string
  targetPhone?: string
  amount: number
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'ONCE'
  dayOfWeek?: string
  dayOfMonth?: number
  time?: string
  note: string
  channels: ('EMAIL' | 'IN_APP' | 'CHAT_SYSTEM')[]
  active: boolean
  nextReminderDate: string
  lastSentAt?: string | null
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
  category?: 'BONUS_MATCH' | 'PARTNER_DEPOSIT' | 'PARTNER_CHANGE' | 'COMPOUND_URGENCY' | 'GENERAL'
  requiresAction?: boolean
  attended?: boolean
  attendedAt?: Date | null
  amount?: number
  partnerName?: string
  actionLabel?: string
  metadata?: any
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

export interface MockChatMessage {
  id: string
  threadId: string
  senderId: string
  senderName: string
  text: string
  timestamp: string
  createdAt: Date
  read: boolean
  reactions?: Record<string, number>
  type: 'text' | 'proposal' | 'love_note' | 'voice_memo' | 'certificate'
  proposalData?: {
    goalName: string
    amount: number
    split: string
    status: 'pending' | 'approved' | 'rejected'
    proposedBy: string
    approvedBy?: string
  }
  voiceDuration?: string
  loveNoteTitle?: string
}

// ---------------------------------------------------------------------------
// Seed Data
// ---------------------------------------------------------------------------

const users: MockUser[] = [
  {
    id: 'usr_jane_doe',
    name: 'Jane Doe',
    username: 'jane-doe',
    email: 'jane.doe@unionverify.com',
    phone: '+1 (555) 349-8821',
    bio: 'Building our generational wealth together on Union Verify. Co-managing our 6.8% compounding joint spousal vault. 💍✨',
    socials: {
      instagram: 'janedoe_invest',
      tiktok: 'janedoe_official',
      twitter: 'janedoe_wealth',
      whatsapp: '+1 (555) 349-8821',
      linkedin: 'janedoe-wealth',
      website: 'https://unionverify.com',
    },
    publicChatEnabled: true,
    showPhone: true,
    showEmail: true,
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
    username: 'marcus-vance',
    email: 'marcus.vance@unionverify.com',
    phone: '+1 (555) 782-9940',
    bio: 'Husband & Joint Signatory on Union Verify. Committed to financial freedom, covenant growth, and mutual compound yield.',
    socials: {
      instagram: 'marcus_vance',
      tiktok: 'marcusvance',
      twitter: 'marcusvance',
      whatsapp: '+1 (555) 782-9940',
      linkedin: 'marcus-vance',
      website: 'https://unionverify.com',
    },
    publicChatEnabled: true,
    showPhone: true,
    showEmail: true,
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
    email: 'admin@unionverify.com',
    phone: '+1 (800) 555-0199',
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
    id: 'opp_couple_joint',
    title: 'Jane Doe & Marcus Vance Spousal Contribution',
    slug: 'jane-doe-marcus-vance-spousal-contribution',
    description: 'Dedicated joint matrimonial wealth accumulation vault for Jane Doe & Marcus Vance with 6.8% compounding interest, mutual parity enforcement, and dual-custody protection.',
    shortDescription: 'Dedicated Jane Doe & Marcus Vance spousal wealth vault with real-time interest compounding.',
    minAmount: new Prisma.Decimal(10),
    maxAmount: new Prisma.Decimal(500000),
    targetAmount: new Prisma.Decimal(250000),
    fundedAmount: new Prisma.Decimal(0),
    termMonths: 12,
    annualReturnRate: new Prisma.Decimal(6.8),
    distributionType: 'MONTHLY',
    status: 'ACTIVE',
    riskLevel: 'LOW',
    openDate: new Date('2024-01-01'),
    closeDate: new Date('2030-12-31'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'opp_swiss',
    title: 'Joint Matrimonial Reserve Vault',
    slug: 'joint-matrimonial-reserve-vault',
    description: 'High-security, inflation-hedged joint spousal reserve managed with AAA sovereign bonds and capital preservation covenants.',
    shortDescription: 'Core sovereign capital preservation vault with 6.8% compounding yield.',
    minAmount: new Prisma.Decimal(50),
    maxAmount: new Prisma.Decimal(100000),
    targetAmount: new Prisma.Decimal(500000),
    fundedAmount: new Prisma.Decimal(0),
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
    fundedAmount: new Prisma.Decimal(0),
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
    fundedAmount: new Prisma.Decimal(0),
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
    fundedAmount: new Prisma.Decimal(0),
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

const investments: MockInvestment[] = []

const transactions: MockTransaction[] = []

const withdrawals: MockWithdrawal[] = []

const notifications: MockNotification[] = [
  {
    id: 'notif_bonus_10percent',
    userId: 'usr_jane_doe',
    title: '🎁 Flash Bonus: Save Now & Earn an Instant 10% Cash Match!',
    message: 'Limited 24-Hour Boost: Deposit into your joint vault today and Union Verify matches 10% of what you save instantly credited to your vault principal! (e.g. Save $500 ➔ Get $50 Cash Match free). Limited promotion window.',
    type: 'ALERT',
    read: false,
    link: '/save?bonus=10percent',
    createdAt: new Date(),
    category: 'BONUS_MATCH',
    requiresAction: true,
    attended: false,
    amount: 500,
    actionLabel: 'Claim 10% Match & Save',
  },
  {
    id: 'notif_partner_deposit_pending',
    userId: 'usr_jane_doe',
    title: '🚨 Partner Deposit Pending Action: Equal Match Required',
    message: 'Your partner deposited $500.00 into your Mutual Spousal Contribution Vault. Under Covenant Rule 4.2, equal reciprocal match is required to maintain 50/50 balance rights and unlock withdrawals.',
    type: 'WARNING',
    read: false,
    link: '/save?match=500',
    createdAt: new Date(Date.now() - 3600 * 1000),
    category: 'PARTNER_DEPOSIT',
    requiresAction: true,
    attended: false,
    amount: 500,
    partnerName: 'Your Partner',
    actionLabel: 'Match Deposit ($500)',
  },
  {
    id: 'notif_idle_money_urgency',
    userId: 'usr_jane_doe',
    title: '⚠️ Lost Compound Interest Warning',
    message: 'Your savings vault is missing out on 6.8% daily compounding interest. Unsaved capital loses purchasing power. Deposit today to start second-by-second compounding.',
    type: 'WARNING',
    read: false,
    link: '/save',
    createdAt: new Date(Date.now() - 7200 * 1000),
    category: 'COMPOUND_URGENCY',
    requiresAction: true,
    attended: false,
    actionLabel: 'Start Compounding',
  },
  {
    id: 'notif_partner_reminder_update',
    userId: 'usr_jane_doe',
    title: '🔔 Partner Added a Shared Deposit Reminder',
    message: 'Your partner scheduled a monthly $500.00 contribution reminder for your joint vault. Review and attend to sync your calendar.',
    type: 'INFO',
    read: false,
    link: '/save#reminders',
    createdAt: new Date(Date.now() - 14400 * 1000),
    category: 'PARTNER_CHANGE',
    requiresAction: true,
    attended: false,
    partnerName: 'Your Partner',
    actionLabel: 'Review Reminder',
  },
]

const documents: MockDocument[] = [
  {
    id: 'doc_1',
    name: 'Union Verify Master Platform Offering Memorandum',
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
    name: 'Institutional AAA Sovereign Custody Guarantee',
    description: 'Direct institutional custody verification and ring-fenced bank balance certificates.',
    type: 'STATEMENT',
    version: '3.1',
    fileUrl: '/docs/sovereign-custody.pdf',
    fileSize: 1104000,
    mimeType: 'application/pdf',
    opportunityId: 'opp_swiss',
    isPublic: false,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
]

const documentAcknowledgments: any[] = []

const auditLogs: MockAuditLog[] = []

export const chatMessages: MockChatMessage[] = []

export const depositReminders: MockDepositReminder[] = []

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
      if (args?.orderBy?.createdAt === 'asc') {
        result.sort((a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
      }
      if (typeof args?.take === 'number') {
        result = result.slice(0, args.take)
      }

      // If select is provided, project the requested fields
      if (args?.select) {
        return result.map((item: any) => {
          const projected: any = {}
          for (const key of Object.keys(args.select)) {
            if (key === '_count') {
              projected._count = { investments: 0 }
            } else if (item[key] !== undefined) {
              projected[key] = item[key]
            }
          }
          if (args.select._count && !projected._count) {
            projected._count = { investments: 0 }
          }
          return projected as T
        })
      }

      return result.map((item: any) => ({
        ...item,
        _count: item._count || { investments: 0 },
      })) as T[]
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

    async aggregate(args?: any): Promise<any> {
      const items = await this.findMany(args)
      let sum = 0
      if (args?._sum) {
        for (const key of Object.keys(args._sum)) {
          sum = items.reduce((acc: number, item: any) => acc + Number(item[key] || 0), 0)
        }
      }
      return {
        _sum: { amount: sum },
        _count: items.length,
      }
    },

    async delete(args: { where: any }): Promise<any> {
      const index = store.findIndex((item: any) => {
        for (const [key, value] of Object.entries(args.where)) {
          if (item[key] === value) return true
        }
        return false
      })
      if (index !== -1) {
        const [removed] = store.splice(index, 1)
        return removed
      }
      return null
    },

    async deleteMany(args?: any): Promise<{ count: number }> {
      const before = store.length
      if (!args?.where) {
        store.length = 0
        return { count: before }
      }
      const kept = store.filter((item: any) => {
        for (const [key, value] of Object.entries(args.where)) {
          if (item[key] === value) return false
        }
        return true
      })
      const count = store.length - kept.length
      store.length = 0
      store.push(...kept)
      return { count }
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
  chatMessage: makeDelegate(chatMessages),
  depositReminder: makeDelegate(depositReminders),

  async $transaction<T>(cb: (tx: any) => Promise<T>): Promise<T> {
    return cb(mockPrismaClient)
  },
}
