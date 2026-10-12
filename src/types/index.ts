/**
 * Centralised TypeScript type definitions for the Marriage Investment platform (Union Invest).
 */

import type {
  User,
  Investment,
  InvestmentOpportunity,
  Transaction,
  WithdrawalRequest,
  Distribution,
  Document,
  DocumentAcknowledgment,
  AuditLog,
  Notification,
  UserRole,
  OpportunityStatus,
  RiskLevel,
  DistributionType,
  InvestmentStatus,
  TransactionType,
  TransactionStatus,
  WithdrawalStatus,
  DocumentType,
  NotificationType,
} from '@prisma/client'

// Re-export all Prisma model types and enums
export type {
  User,
  Investment,
  InvestmentOpportunity,
  Transaction,
  WithdrawalRequest,
  Distribution,
  Document,
  DocumentAcknowledgment,
  AuditLog,
  Notification,
  UserRole,
  OpportunityStatus,
  RiskLevel,
  DistributionType,
  InvestmentStatus,
  TransactionType,
  TransactionStatus,
  WithdrawalStatus,
  DocumentType,
  NotificationType,
}

// ---------------------------------------------------------------------------
// Standard API response wrappers
// ---------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
  message?: string
}

export interface PaginatedResponse<T = unknown> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  error?: string
}

// ---------------------------------------------------------------------------
// Session & Auth Types
// ---------------------------------------------------------------------------

export interface UserSession {
  id: string
  email: string
  name: string
  phone?: string | null
  role: UserRole
  emailVerified: Date | null
  twoFactorEnabled: boolean
  identityVerified: boolean
}

// ---------------------------------------------------------------------------
// Dashboard Statistics
// ---------------------------------------------------------------------------

export interface DashboardStats {
  totalInvested: number
  totalDistributions: number
  activeInvestments: number
  pendingTransactions: number
  availableFunds: number
  recentTransactions: TransactionWithDetails[]
  activeInvestmentsList: InvestmentWithDetails[]
  upcomingMaturities: {
    id: string
    title: string
    maturityDate: Date | null
    amount: number
  }[]
}

export interface AdminStats {
  totalInvestors: number
  totalInvested: number
  pendingWithdrawalsCount: number
  pendingWithdrawalsAmount: number
  transactionsThisMonthCount: number
  transactionsThisMonthAmount: number
  monthlyData: {
    month: string
    contributions: number
    distributions: number
  }[]
  opportunityBreakdown: {
    title: string
    fundedAmount: number
    targetAmount: number
    investorCount: number
  }[]
}

// ---------------------------------------------------------------------------
// Enriched Entity Types
// ---------------------------------------------------------------------------

export type InvestmentWithDetails = Investment & {
  opportunity: InvestmentOpportunity
  user?: Pick<User, 'id' | 'name' | 'email' | 'phone'>
  transactions?: Transaction[]
  distributions?: Distribution[]
}

export type TransactionWithDetails = Transaction & {
  user?: Pick<User, 'id' | 'name' | 'email'>
  investment?: (Investment & { opportunity: Pick<InvestmentOpportunity, 'id' | 'title'> }) | null
}

export type WithdrawalWithDetails = WithdrawalRequest & {
  user?: Pick<User, 'id' | 'name' | 'email'>
  investment?: (Investment & { opportunity: Pick<InvestmentOpportunity, 'id' | 'title'> }) | null
}

export type DocumentWithAcknowledgments = Document & {
  opportunity?: InvestmentOpportunity | null
  acknowledgments?: DocumentAcknowledgment[]
}

// ---------------------------------------------------------------------------
// Chart & Analytics Types
// ---------------------------------------------------------------------------

export interface ChartDataPoint {
  label: string
  value: number
  secondary?: number
}

// ---------------------------------------------------------------------------
// Query Parameters & Filters
// ---------------------------------------------------------------------------

export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface InvestmentFilters extends PaginationParams {
  status?: OpportunityStatus
  riskLevel?: RiskLevel
}

export interface TransactionFilters extends PaginationParams {
  type?: TransactionType
  status?: TransactionStatus
  userId?: string
  dateFrom?: string
  dateTo?: string
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  link?: string | null
  createdAt: Date | string
}
