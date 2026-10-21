import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { FileText, Download, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Documents | Union Verify',
  description: 'Documents published for Union Verify investment opportunities.',
}

export const dynamic = 'force-dynamic'

async function getPublicDocuments() {
  try {
    return await prisma.document.findMany({
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
    return []
  }
}

export default async function OfferDocumentsPage() {
  const documents = await getPublicDocuments()

  return (
    <div className="bg-white min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider block mb-2">
            Documents
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F1C3F] mb-4">
            Offer Documents
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Documents published for investment opportunities on Union Verify. Read the documents
            for an opportunity, including its fees and risks, before investing.
          </p>
        </div>

        {/* Published Documents Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-12">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0F1C3F]">Published Documents</h2>
            </div>
            {documents.length > 0 && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                {documents.length} {documents.length === 1 ? 'document' : 'documents'}
              </span>
            )}
          </div>

          {documents.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700">No documents published yet</p>
              <p className="mt-1 text-xs text-gray-500">
                Documents will appear here when they are published for an opportunity.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3.5 px-6">Document Title</th>
                    <th className="py-3.5 px-6">Associated Opportunity</th>
                    <th className="py-3.5 px-6">Type</th>
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
                        {String(doc.type || 'OFFER_DOCUMENT').replace(/_/g, ' ')}
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
                        {doc.fileUrl ? (
                          <a
                            href={doc.fileUrl}
                            download
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[#0F1C3F] font-semibold hover:bg-gray-50 text-[11px]"
                          >
                            <Download className="w-3.5 h-3.5 text-[#C9A84C]" />
                            Download
                          </a>
                        ) : (
                          <span className="text-gray-400">Not available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
