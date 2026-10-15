import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 })
    }

    const body = await req.json()
    const {
      host = process.env.SMTP_HOST || 'mail.donateplea.com',
      port = Number(process.env.SMTP_PORT || 587),
      user = process.env.SMTP_USER || 'invest@donateplea.com',
      pass = process.env.SMTP_PASS || 'UnionM@il_98Fid!2026',
      secure = false,
      fromEmail = 'invest@donateplea.com',
      fromName = 'Union Invest Notifications',
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

    // 2. If test email requested and recipient provided, send a test email
    if (sendTest && toEmail) {
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: toEmail,
        subject: 'Union Invest — SMTP Delivery Test (Successful)',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 24px; font-weight: bold; color: #0F1C3F;">Union <span style="color: #C9A84C;">Invest</span></span>
              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #6b7280; margin-top: 4px;">Fiduciary SMTP Dispatch</p>
            </div>
            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
              <p style="color: #065f46; font-weight: 600; margin: 0; font-size: 14px;">✅ SMTP Connection & Delivery Verified</p>
              <p style="color: #047857; margin: 4px 0 0; font-size: 12px;">This test confirms that your VPS SMTP server on <strong>${host}:${port}</strong> is successfully authenticated and delivering messages.</p>
            </div>
            <table style="width: 100%; font-size: 12px; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">SMTP Host</td>
                <td style="padding: 8px 0; font-weight: 600; color: #111827; text-align: right; border-bottom: 1px solid #f3f4f6;">${host}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">SMTP Port</td>
                <td style="padding: 8px 0; font-weight: 600; color: #111827; text-align: right; border-bottom: 1px solid #f3f4f6;">${port}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Authenticated User</td>
                <td style="padding: 8px 0; font-weight: 600; color: #111827; text-align: right; border-bottom: 1px solid #f3f4f6;">${user}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Timestamp</td>
                <td style="padding: 8px 0; font-weight: 600; color: #111827; text-align: right;">${new Date().toISOString()}</td>
              </tr>
            </table>
            <div style="border-top: 1px solid #f3f4f6; padding-top: 16px; text-align: center; font-size: 11px; color: #9ca3af;">
              © ${new Date().getFullYear()} Union Invest Fiduciary AG · Zurich & London
            </div>
          </div>
        `,
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
