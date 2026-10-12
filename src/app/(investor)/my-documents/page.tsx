import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  Shield,
  ExternalLink,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function InvestorDocumentsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/documents')
  }

  const userId = session.user.id

  // Fetch all documents + current user's acknowledgments
  const [documents, acknowledgments] = await Promise.all([
    prisma.document.findMany({
      include: {
        opportunity: {
          select: { title: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.documentAcknowledgment.findMany({
      where: { userId },
    }),
  ])

  const acknowledgedDocIds = new Set(acknowledgments.map((a) => a.documentId))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1C3F]">Investor Document Library</h1>
        <p className="text-xs text-gray-500 mt-1">
          Secure repository of signed contracts, official offer documents, transaction receipts, and compliance notices.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0F1C3F]">Document Vault</h2>
            <p className="text-xs text-gray-500">Cryptographically versioned PDF files and executed electronic agreements.</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30">
            {acknowledgments.length} of {documents.length} Acknowledged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-6">Document Title</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Associated Opportunity</th>
                <th className="py-3.5 px-6">Version</th>
                <th className="py-3.5 px-6">Acknowledgment</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => {
                const isAcked = acknowledgedDocIds.has(doc.id)
                const ackRecord = acknowledgments.find((a) => a.documentId === doc.id)

                return (
                  <tr key={doc.id} className="hover:bg-gray-50/50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900">{doc.name}</p>
                          {doc.description && (
                            <p className="text-[11px] text-gray-400 mt-0.5 max-w-sm truncate">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600 font-mono text-[11px]">
                      {doc.type.replace('_', ' ')}
                    </td>
                    <td className="py-4 px-6 text-gray-700">
                      {doc.opportunity ? doc.opportunity.title : 'General Account'}
                    </td>
                    <td className="py-4 px-6 font-mono text-gray-500">
                      v{doc.version}
                    </td>
                    <td className="py-4 px-6">
                      {isAcked ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Signed {ackRecord ? formatDate(ackRecord.signedAt) : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Review Required
                        </span>
                      )}
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
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
