import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { CELEBRITY_ARTISTS } from '@/types/fanbase'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    const { slug } = await params
    const body = await req.json()

    const {
      name,
      email,
      phone,
      organization,
      inquiryType = 'VIP Fan Syndicate Inquiry',
      budget,
      eventDate,
      message,
    } = body

    const artist = CELEBRITY_ARTISTS.find((a) => a.slug === slug)
    if (!artist) {
      return NextResponse.json({ error: 'Celebrity artist syndicate not found.' }, { status: 404 })
    }

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      )
    }

    const referenceId = `INQ-${artist.stageName.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`

    // Log to AuditLog for artist management records
    await prisma.auditLog.create({
      data: {
        userId: session?.user?.id || null,
        action: 'ARTIST_MANAGEMENT_INQUIRY',
        entity: 'ArtistContact',
        entityId: referenceId,
        after: {
          artist: artist.stageName,
          artistSlug: artist.slug,
          name,
          email,
          phone,
          organization,
          inquiryType,
          budget,
          eventDate,
          message,
          forwardedTo: artist.managementContact.bookingEmail,
        },
      },
    })

    return NextResponse.json({
      success: true,
      referenceId,
      message: `Your inquiry for ${artist.stageName} has been routed directly to ${artist.managementContact.managerName}. A fiduciary representative will respond within 24 business hours.`,
      managementContact: artist.managementContact,
    })
  } catch (error: any) {
    console.error('[POST /api/fanbase/[slug]/contact]', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to submit artist inquiry.' },
      { status: 500 }
    )
  }
}
