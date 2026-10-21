import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

    const { id: documentId } = await params

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const userAgent = req.headers.get('user-agent') || 'Unknown'

    // Upsert acknowledgment
    const acknowledgment = await prisma.documentAcknowledgment.upsert({
      where: {
        userId_documentId: {
          userId,
          documentId: document.id,
        },
      },
      update: {
        signedAt: new Date(),
        ipAddress,
        userAgent,
      },
      create: {
        userId,
        documentId: document.id,
        signedAt: new Date(),
        ipAddress,
        userAgent,
      },
    })

    // Log in AuditLog
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DOCUMENT_ACKNOWLEDGED',
        entity: 'Document',
        entityId: document.id,
        after: {
          documentName: document.name,
          documentType: document.type,
          version: document.version,
          signedAt: acknowledgment.signedAt,
        },
        ipAddress,
        userAgent,
      },
    }).catch(() => null)

    return NextResponse.json({
      success: true,
      message: `Document "${document.name}" successfully executed and recorded.`,
      acknowledgment,
    })
  } catch (error: any) {
    console.error('[POST /api/documents/[id]/acknowledge]', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to acknowledge document' },
      { status: 500 }
    )
  }
}
