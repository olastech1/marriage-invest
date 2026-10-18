import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import {
  FileText,
  Download,
  ShieldCheck,
  History,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Official Offer Documents & Compliance Disclosures | Union Verify',
  description:
    'Review official investment offer documents, version histories, and legal prospectuses for all Union Verify marriage investment opportunities.',
}

export const revalidate = 60

const disclosures12 = [
  { item: '1', title: 'Issuer & Sponsor Information', desc: 'Full corporate registration, executive management, and operational structure of the issuing entity.' },
  { item: '2', title: 'Investment Description & Purpose', desc: 'Asset strategy, syndication mechanism, and specific deployment into income-producing assets.' },
  { item: '3', title: 'Funding Target & Use of Proceeds', desc: 'Exact capital allocation schedule, escrow safeguards, and allocation breakdown in USD.' },
  { item: '4', title: 'Minimum & Maximum Commitments', desc: 'Individual and joint participation thresholds, minimum contributions, and platform caps.' },
  { item: '5', title: 'Duration & Maturity Conditions', desc: 'Contractual tenure (e.g. 12–36 months), maturity triggers, and closing dates.' },
  { item: '6', title: 'Distributions & Exit Arrangements', desc: 'Monthly/quarterly disbursement calculations, payment waterfall, and terminal principal return.' },
  { item: '7', title: 'Fees, Charges & Deductions', desc: 'All administrative, management, and withdrawal processing deductions disclosed with zero hidden costs.' },
  { item: '8', title: 'Risk Factors & Loss Scenarios', desc: 'Underlying market risks, liquidity constraints, credit counterparties, and downside stress models.' },
  { item: '9', title: 'Investor Eligibility & Requirements', desc: 'KYC/AML identity standards, jurisdictional restrictions, and joint-couple qualification criteria.' },
  { item: '10', title: 'Withdrawal, Cancellation & Default', desc: 'Notice periods, early exit evaluation mechanisms, default remediation, and cure periods.' },
  { item: '11', title: 'Dispute-Resolution Procedures', desc: 'Binding arbitration, governing law jurisdiction, and escalation protocols.' },
  { item: '12', title: 'Legal Disclosures & Contact', desc: 'Regulatory filings, compliance officer details, and investor grievance contact points.' },
]

export const dynamic = 'force-dynamic'

const FALLBACK_DOCS = [
  {
    id: 'doc-1',
    name: 'Form 1-A Offering Circular — Matrimonial Prime Yield Fund I',
    description: 'Statutory offering circular and formal investment memorandum setting out priority allocation and underwriting parameters.',
    type: 'OFFER_DOCUMENT',
    version: '1.2',
    fileUrl: '/documents/offering-circular-fund-i-v1.2.pdf',
    fileSize: 2450000,
    createdAt: new Date('2024-01-15'),
    opportunity: {
      id: 'opp-1',
      title: 'Matrimonial Prime Yield Fund I',
      slug: 'matrimonial-prime-yield-fund-i',
      status: 'ACTIVE',
    },
  },
  {
    id: 'doc-2',
    name: 'Subscription Agreement & Custody Terms',
    description: 'Master investor subscription agreement and escrow custodial procedures for USD wire and card commitments.',
    type: 'INVESTMENT_AGREEMENT',
    version: '2.0',
    fileUrl: '/documents/subscription-agreement-v2.0.pdf',
    fileSize: 1120000,
    createdAt: new Date('2024-02-01'),
    opportunity: {
      id: 'opp-2',
      title: 'Marital Homestead Growth Notes V',
      slug: 'marital-homestead-growth-notes-v',
      status: 'ACTIVE',
    },
  },
  {
    id: 'doc-3',
    name: 'Risk Disclosure & Downside Scenario Analysis',
    description: 'Comprehensive risk disclosure statement addressing liquidity, market cyclicality, and joint-tenancy provisions.',
    type: 'OFFER_DOCUMENT',
    version: '1.1',
    fileUrl: '/documents/risk-disclosure-v1.1.pdf',
    fileSize: 850000,
    createdAt: new Date('2024-03-01'),
    opportunity: {
      id: 'opp-3',
      title: 'Enduring Union Balanced Portfolio',
      slug: 'enduring-union-balanced-portfolio',
      status: 'ACTIVE',
    },
  },
]

export default async function OfferDocumentsPage() {
  let documents: any[] = []
  try {
    documents = await prisma.document.findMany({
      where: { isPublic: true },
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    // Database offline or prerendering
  }

  if (!documents || documents.length === 0) {
    documents = FALLBACK_DOCS
  }

  return (
    <div className="bg-white min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider block mb-2">
            Regulatory Compliance
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F1C3F] mb-4">
            Official Investment Offer Documents
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Every investment opportunity on Union Verify is governed by an audited Offer Document detailing full contractual obligations, fee structures, risk disclosures, and distribution arrangements.
          </p>
        </div>

        {/* 12 Statutory Disclosures Accordion/Overview */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 sm:p-8 mb-14">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-[#C9A84C]" />
            <h2 className="text-lg font-bold text-[#0F1C3F]">
              Standardized 12-Point Disclosure Framework
            </h2>
          </div>
          <p className="text-xs text-gray-600 mb-6">
            Prior to committing capital, all investors are legally provided with comprehensive disclosure across each of the twelve mandatory areas below:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {disclosures12.map((d) => (
              <div key={d.item} className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-[#0F1C3F] text-[#C9A84C] text-[10px] font-bold flex items-center justify-center">
                    {d.item}
                  </span>
                  <h3 className="text-xs font-bold text-[#0F1C3F] truncate">
                    {d.title}
                  </h3>
                </div>
                <p className="text-[11px] text-gray-500 leading-normal pl-7">
                  {d.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Published Documents Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-12">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0F1C3F]">Active Offer Document Repository</h2>
              <p className="text-xs text-gray-500">Official prospectuses with cryptographic version tracking.</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {documents.length} Verified Documents
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-6">Document Title</th>
                  <th className="py-3.5 px-6">Associated Fund</th>
                  <th className="py-3.5 px-6">Classification</th>
                  <th className="py-3.5 px-6">Version</th>
                  <th className="py-3.5 px-6">Published</th>
                  <th className="py-3.5 px-6 text-right">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6 font-semibold text-gray-900 flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                      <div>
                        <span>{doc.name}</span>
                        {doc.description && (
                          <p className="text-[11px] font-normal text-gray-400 mt-0.5 max-w-sm truncate">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-700">
                      {doc.opportunity ? (
                        <Link
                          href={`/investments/${doc.opportunity.slug}`}
                          className="text-[#0F1C3F] font-medium hover:underline flex items-center gap-1"
                        >
                          {doc.opportunity.title}
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </Link>
                      ) : (
                        <span className="text-gray-400">Platform-wide</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-600 font-mono">
                      {(doc.type || 'OFFER_DOCUMENT').replace(/_/g, ' ')}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono font-medium">
                        v{doc.version}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-500 font-mono">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <a
                        href={doc.fileUrl}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[#0F1C3F] font-semibold hover:bg-gray-50 text-[11px]"
                      >
                        <Download className="w-3.5 h-3.5 text-[#C9A84C]" />
                        Download PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Electronic Acknowledgment Notice */}
        <div className="p-6 rounded-2xl bg-[#0F1C3F]/5 border border-[#0F1C3F]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#C9A84C] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-700">
              <strong className="text-gray-900 block mb-0.5">Audited Electronic Signatures</strong>
              Registered investors electronically acknowledge and sign relevant agreements directly within the investor portal. An immutable audit record including IP, timestamp, and document version hash is archived upon execution.
            </div>
          </div>
          <Link
            href="/register"
            className="whitespace-nowrap px-5 py-2.5 rounded-xl bg-[#0F1C3F] text-white text-xs font-semibold hover:bg-[#162c5e]"
          >
            Create Account to Sign
          </Link>
        </div>
      </div>
    </div>
  )
}
