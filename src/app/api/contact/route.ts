import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().or(z.literal('')),
  department: z.string().min(1),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = contactSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten().fieldErrors },
        { status: 422 },
      )
    }

    const { name, email, phone, department, subject, message } = parsed.data

    // Log the contact ticket
    console.info(`[Contact Desk] Received inquiry from ${name} <${email}> regarding ${department}: ${subject}`)

    // Send email to admin / compliance desk
    const adminEmail = process.env.ADMIN_EMAIL || 'compliance@unionverify.com'
    await sendEmail({
      to: adminEmail,
      subject: `[Union Verify Desk] ${department}: ${subject}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #1f2937;">
          <h2 style="color: #0F1C3F;">New Investor Inquiry Received</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Department:</strong> ${department}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
    }).catch((err) => {
      console.warn('[Contact Desk] Notification email dispatch warning:', err)
    })

    return NextResponse.json(
      { success: true, message: 'Your inquiry has been successfully received.' },
      { status: 200 },
    )
  } catch (error) {
    console.error('[POST /api/contact]', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred while submitting your inquiry.' },
      { status: 500 },
    )
  }
}
