import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 })
    }

    return NextResponse.json({
      host: process.env.SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
      port: process.env.SMTP_PORT || '465',
      encryption: (process.env.SMTP_PORT === '465' || !process.env.SMTP_PORT) ? 'SSL/TLS' : 'STARTTLS',
      user: process.env.SMTP_USER || 'AKIAVHXIDBLGLO4ATDEA',
      pass: process.env.SMTP_PASS || 'BAEcA3rSWKXc6pukKBAb+EbAtpshVIFI5RWgBSkGHeSp',
      fromEmail: process.env.EMAIL_FROM || 'support@unionverify.com',
      fromName: process.env.EMAIL_FROM_NAME || 'Union Verify',
      testRecipient: 'support@unionverify.com',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 })
    }

    const body = await req.json()
    const {
      host = process.env.SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
      port = Number(process.env.SMTP_PORT || 465),
      user = process.env.SMTP_USER || 'AKIAVHXIDBLGLO4ATDEA',
      pass = process.env.SMTP_PASS || 'BAEcA3rSWKXc6pukKBAb+EbAtpshVIFI5RWgBSkGHeSp',
      secure = false,
      fromEmail = process.env.EMAIL_FROM || 'support@unionverify.com',
      fromName = process.env.EMAIL_FROM_NAME || 'Union Verify',
      toEmail,
      sendTest = false,
    } = body

    if (!host) {
      return NextResponse.json({ error: 'SMTP Host is required' }, { status: 400 })
    }

    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Boolean(secure) || Number(port) === 465,
      auth: user && pass ? { user, pass } : undefined,
      tls: {
        rejectUnauthorized: false, // Allow self-signed or internal routing if necessary
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    })

    // 1. Verify connection
    await transporter.verify()

    // 2. If test email requested and recipient provided, send a clean verification email
    if (sendTest && toEmail) {
      const formattedDate = new Date().toUTCString()
      const textAlternative = `Welcome to Union Verify!

This test message confirms that transactional emails from Union Verify are working correctly.

Your joint savings and investment account is active and protected by bank-grade security.

Visit Union Verify: https://unionverify.com
If you have any questions, our support team is available at support@unionverify.com.

© ${new Date().getFullYear()} Union Verify. All rights reserved.`

      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: toEmail,
        replyTo: fromEmail,
        subject: 'Welcome to Union Verify — Account Verification',
        text: textAlternative,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 28px;">
              <span style="font-size: 26px; font-weight: 800; color: #0F1C3F; letter-spacing: -0.5px;">Union <span style="color: #C9A84C;">Verify</span></span>
              <p style="font-size: 12px; color: #6b7280; margin-top: 4px;">Building Wealth Together</p>
            </div>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h2 style="font-size: 18px; font-weight: 700; color: #0F1C3F; margin: 0 0 10px;">Account Verification Test</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px;">
                This message confirms that transactional communication for your <strong>Union Verify</strong> investor account is successfully authenticated and delivered.
              </p>
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px 16px;">
                <p style="font-size: 13px; font-weight: 600; color: #065f46; margin: 0;">✓ Authenticated Delivery Confirmed</p>
                <p style="font-size: 12px; color: #047857; margin: 4px 0 0;">Sender: ${fromEmail} &middot; Verified via Amazon SES</p>
              </div>
            </div>

            <div style="text-align: center; margin-bottom: 28px;">
              <a href="https://unionverify.com/dashboard" style="display: inline-block; padding: 12px 28px; background-color: #0F1C3F; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px;">
                Access Your Dashboard &rarr;
              </a>
            </div>

            <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5;">
              <p style="margin: 0;">Union Verify &middot; Joint Savings & Investment Platform</p>
              <p style="margin: 4px 0 0;">Timestamp: ${formattedDate}</p>
              <p style="margin: 8px 0 0;">&copy; ${new Date().getFullYear()} Union Verify. All rights reserved.</p>
            </div>
          </div>
        `,
        headers: {
          'List-Unsubscribe': `<mailto:admin@unionverify.com?subject=unsubscribe>`,
          'X-Entity-Ref-ID': `UI-${Date.now()}`,
        },
      })

      return NextResponse.json({
        success: true,
        message: `SMTP verified successfully! Test email delivered to ${toEmail}. Message ID: ${info.messageId}`,
        messageId: info.messageId,
      })
    }

    return NextResponse.json({
      success: true,
      message: `SMTP Server on ${host}:${port} responded with 250 OK. Authentication successful for ${user}.`,
    })
  } catch (error: any) {
    console.error('SMTP verification failed:', error)
    return NextResponse.json(
      {
        error: error.message || 'SMTP connection failed',
        code: error.code || 'SMTP_ERROR',
        details: error.response || error.toString(),
      },
      { status: 500 }
    )
  }
}
