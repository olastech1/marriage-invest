'use client'

import { useState } from 'react'
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Check,
  X,
  FileCheck,
} from 'lucide-react'
import type { AccountRating } from '@/lib/rating'
import { formatDate } from '@/lib/utils'

interface DocumentItem {
  id: string
  name: string
  description: string | null
  type: string
  version: string
  fileUrl: string
  opportunity?: { title: string; slug: string } | null
  isAcked: boolean
  signedAt?: string | null
}

interface DocumentLibraryClientProps {
  initialDocuments: DocumentItem[]
  initialRating: AccountRating
  userName: string
}

export default function DocumentLibraryClient({
  initialDocuments,
  initialRating,
  userName,
}: DocumentLibraryClientProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments)
  const [rating, setRating] = useState<AccountRating>(initialRating)
  const [activeModalDoc, setActiveModalDoc] = useState<DocumentItem | null>(null)
  const [signing, setSigning] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  const handleAcknowledge = async (doc: DocumentItem) => {
    setSigning(true)
    try {
      const res = await fetch(`/api/documents/${doc.id}/acknowledge`, {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok) {
        // Update local document list
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id
              ? { ...d, isAcked: true, signedAt: new Date().toISOString() }
              : d
          )
        )

        // Increment local rating score
        setRating((prev) => {
          const newDocCount = prev.documentCount + 1
          const newScore = Math.min(100, prev.score + 10)
          let newTier: AccountRating['tier'] = prev.tier
          let newTitle = prev.title
          if (newScore >= 90) {
            newTier = 'AAA'
            newTitle = 'Sovereign Institutional Fiduciary'
          } else if (newScore >= 75) {
            newTier = 'AA+'
            newTitle = 'Prime Matrimonial Covenant'
          } else if (newScore >= 55) {
            newTier = 'A'
            newTitle = 'Verified Fiduciary Account'
          } else if (newScore >= 35) {
            newTier = 'BBB'
            newTitle = 'Accredited Standard Covenant'
          }

          return {
            ...prev,
            documentCount: newDocCount,
            score: newScore,
            tier: newTier,
            title: newTitle,
            pointsToNextTier: Math.max(0, prev.pointsToNextTier - 10),
          }
        })

        setActiveModalDoc(null)
        setSuccessToast(`"${doc.name}" has been executed! Your Account Rating increased.`)
        setTimeout(() => setSuccessToast(null), 4000)
      } else {
        alert(data.error || 'Failed to acknowledge document.')
      }
    } catch (err) {
      console.error(err)
      alert('Error connecting to document execution registry.')
    } finally {
      setSigning(false)
    }
  }

  const ackedCount = documents.filter((d) => d.isAcked).length

  return (
    <div className="space-y-8">
      {/* ── SUCCESS TOAST NOTIFICATION ── */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 max-w-md bg-[#0F1C3F] text-white rounded-2xl p-4 shadow-2xl border-2 border-[#C9A84C] flex items-start gap-3 animate-slide-up">
          <div className="w-8 h-8 rounded-full bg-[#C9A84C] text-[#0F1C3F] flex items-center justify-center flex-shrink-0 font-bold">
            <Check className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-[#C9A84C] uppercase tracking-wider">
              Document Executed & Rating Raised!
            </h4>
            <p className="text-xs text-gray-200 mt-0.5 leading-relaxed">{successToast}</p>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── TOP HEADER & RATING BANNER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A84C]/15 text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Document Repository
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F1C3F]">
            Investor Document Library & Fiduciary Vault
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
            Execute and maintain your official legal covenants, offering documents, and statutory disclosures. Each accumulated document directly enhances your account credit rating and unlocks institutional privileges.
          </p>
        </div>

        {/* Real Capital Only Rating Pill */}
        <div className="flex items-center gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-sm flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-[#0F1C3F] text-[#C9A84C] flex flex-col items-center justify-center font-serif font-black text-lg border border-[#C9A84C]">
            <span>{rating.tier}</span>
            <span className="text-[7px] uppercase font-sans tracking-widest -mt-1 opacity-80">RATING</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
              Current Rating Grade
            </span>
            <span className="text-sm font-bold text-[#0F1C3F] block">
              {rating.title}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold block">
              {ackedCount} of {documents.length} Executed · Demo Excluded
            </span>
          </div>
        </div>
      </div>

      {/* ── DOCUMENTS TABLE ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
          <div>
            <h2 className="text-base font-bold text-[#0F1C3F]">Document Portfolio</h2>
            <p className="text-xs text-gray-500">
              Cryptographically timestamped and archived under international fiduciary standards.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#0F1C3F] text-[#C9A84C] border border-[#C9A84C]/30 w-fit">
            {ackedCount} of {documents.length} Documents Executed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-6">Document Title</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Scope / Opportunity</th>
                <th className="py-3.5 px-6">Version</th>
                <th className="py-3.5 px-6">Status & Execution</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0F1C3F]/5 text-[#0F1C3F] flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-[#C9A84C]" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{doc.name}</p>
                        {doc.description && (
                          <p className="text-[11px] text-gray-500 mt-0.5 max-w-sm line-clamp-1">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium">
                      {doc.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-700">
                    {doc.opportunity ? doc.opportunity.title : 'General Matrimonial Covenant'}
                  </td>
                  <td className="py-4 px-6 font-mono text-gray-500">
                    v{doc.version}
                  </td>
                  <td className="py-4 px-6">
                    {doc.isAcked ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Signed {doc.signedAt ? formatDate(doc.signedAt) : 'Recorded'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Action Required (+10 Pts)
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!doc.isAcked ? (
                        <button
                          onClick={() => setActiveModalDoc(doc)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2d5e] text-[#C9A84C] font-bold text-[11px] transition-all shadow-xs"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Review & Sign</span>
                        </button>
                      ) : (
                        <a
                          href={doc.fileUrl}
                          download
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-[#0F1C3F] font-semibold hover:bg-gray-50 text-[11px] transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-[#C9A84C]" />
                          Download
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DOCUMENT REVIEW & SIGN MODAL ── */}
      {activeModalDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-gray-200 animate-slide-up relative">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C9A84C] tracking-wider block mb-1">
                  Electronic Execution Protocol
                </span>
                <h3 className="text-lg font-bold text-[#0F1C3F]">{activeModalDoc.name}</h3>
              </div>
              <button
                onClick={() => setActiveModalDoc(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-700 space-y-2 leading-relaxed">
              <p>
                <strong>Document Overview:</strong> {activeModalDoc.description || 'Official statutory covenant document requiring formal electronic acknowledgment by account holders.'}
              </p>
              <p className="text-[11px] text-gray-500 font-mono">
                Version: {activeModalDoc.version} · Category: {activeModalDoc.type}
              </p>
            </div>

            {/* Legal Acknowledgment Statement */}
            <div className="p-4 rounded-2xl bg-[#0F1C3F]/[0.02] border border-[#0F1C3F]/15 space-y-2">
              <span className="text-xs font-bold text-[#0F1C3F] block">
                Legal Electronic Attestation
              </span>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                By clicking &quot;Execute & Sign Acknowledgment&quot;, I, <strong>{userName}</strong>, hereby declare that I have reviewed, understood, and consented to the stipulations outlined in this official filing. My digital acknowledgment will be cryptographically bound to my investor ID and will elevate my account standing.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveModalDoc(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={signing}
                onClick={() => handleAcknowledge(activeModalDoc)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F1C3F] hover:bg-[#1a2d5e] text-[#C9A84C] font-bold text-xs shadow-md shadow-[#0F1C3F]/20 disabled:opacity-50"
              >
                {signing ? (
                  'Executing Signature...'
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Execute & Boost Rating (+10 pts)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
