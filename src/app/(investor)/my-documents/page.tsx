import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import DocumentLibraryClient from '@/components/investor/DocumentLibraryClient'
import { computeAccountRating, isDemoTransaction, isDemoInvestment } from '@/lib/rating'

export const dynamic = 'force-dynamic'

export default async function InvestorDocumentsPage() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/login')

  // Fetch all documents + current user's acknowledgments + user profile + transactions
  const [
    userRecord,
    documents,
    acknowledgments,
    completedTransactions,
    investments,
    marriageAudit,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, identityVerified: true },
    }),
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
    prisma.transaction.findMany({
      where: { userId, status: 'COMPLETED' },
    }),
    prisma.investment.findMany({
      where: { userId },
    }),
    prisma.auditLog.findFirst({
      where: { userId, action: 'MARRIAGE_REGISTRATION_CREATED' },
    }),
  ])

  // Filter out demo transactions strictly
  const realTransactions = completedTransactions.filter((t) => !isDemoTransaction(t))
  const realInvestments = investments.filter((i) => !isDemoInvestment(i))

  const realDepositedAmount = realTransactions
    .filter((t) => t.type === 'DEPOSIT')
    .reduce((sum, t) => sum + Number(t.netAmount), 0)

  const realInvestedAmount = realInvestments
    .filter((i) => i.status === 'ACTIVE' || i.status === 'MATURED')
    .reduce((sum, i) => sum + Number(i.amount), 0)

  const hasFeeCovenant = realTransactions.some(
    (t) =>
      t.type === 'FEE' &&
      (t.description?.toLowerCase().includes('matrimonial') || t.reference?.startsWith('FEE-REG'))
  )
  const hasMarriageCovenant = Boolean(marriageAudit || hasFeeCovenant)

  const acknowledgedDocIds = new Set(acknowledgments.map((a) => a.documentId))

  const documentItems = documents.map((doc) => {
    const ack = acknowledgments.find((a) => a.documentId === doc.id)
    return {
      id: doc.id,
      name: doc.name,
      description: doc.description,
      type: doc.type,
      version: doc.version,
      fileUrl: doc.fileUrl,
      opportunity: doc.opportunity,
      isAcked: acknowledgedDocIds.has(doc.id),
      signedAt: ack?.signedAt ? ack.signedAt.toISOString() : null,
    }
  })

  const rating = computeAccountRating({
    acknowledgedDocIds: Array.from(acknowledgedDocIds),
    allDocuments: documents,
    isIdentityVerified: Boolean(userRecord?.identityVerified),
    hasMarriageCovenant,
    realDepositedAmount,
    realInvestedAmount,
  })

  return (
    <DocumentLibraryClient
      initialDocuments={documentItems}
      initialRating={rating}
      userName={userRecord?.name || session?.user?.name || 'Member'}
    />
  )
}
