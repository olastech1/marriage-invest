import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { FileText, Download } from 'lucide-react'
import LoadErrorBanner from '@/components/admin/LoadErrorBanner'

export const dynamic = 'force-dynamic'

export default async function AdminDocumentsPage() {
  const session = await auth()
  if (!session?.user?.role || !['ADMIN', 'COMPLIANCE'].includes(session.user.role)) {
    redirect('/login?callbackUrl=/admin/documents')
  }

  let loadError = false
  let documents: any[] = []
  try {
    documents = await prisma.document.findMany({
      include: {
        opportunity: { select: { title: true } },
        acknowledgments: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  } catch (error) {
    console.error('[admin/documents]', error)
    loadError = true
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-xs text-gray-500 mt-1">
            Documents stored on the platform and how many members have acknowledged each one.
          </p>
        </div>
      </div>

      {loadError && <LoadErrorBanner />}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">All Documents</h2>
            <p className="text-xs text-gray-500">Total documents: {documents.length}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3 px-6">Document Title</th>
                <th className="py-3 px-6">Linked Opportunity</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Version</th>
                <th className="py-3 px-6">Acknowledgments</th>
                <th className="py-3 px-6">Published Date</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loadError && documents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 px-6 text-center text-gray-400">
                    No documents yet.
                  </td>
                </tr>
              )}
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/50">
                  <td className="py-3.5 px-6 font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                    <span>{doc.name}</span>
                  </td>
                  <td className="py-3.5 px-6 text-gray-700">
                    {doc.opportunity ? doc.opportunity.title : 'Platform-wide'}
                  </td>
                  <td className="py-3.5 px-6 text-gray-500 font-mono text-[11px]">
                    {doc.type}
                  </td>
                  <td className="py-3.5 px-6 font-mono font-medium text-gray-900">
                    v{doc.version}
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {doc.acknowledgments.length} Acknowledged
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-mono text-gray-500">
                    {formatDate(doc.createdAt)}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <a
                      href={doc.fileUrl}
                      download
                      className="px-3 py-1 rounded-lg border border-gray-200 text-gray-700 text-[11px] font-medium hover:bg-gray-50 inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3 text-[#C9A84C]" />
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
