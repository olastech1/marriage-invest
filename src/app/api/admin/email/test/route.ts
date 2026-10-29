import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { auth } from '@/lib/auth'
import { escapeHtml } from '@/lib/utils'

const PASSWORD_MASK = '••••••••'

// The live site sends through Resend when RESEND_API_KEY is set (see src/lib/email.ts),
// so the admin test uses the same connection by default.
const RESEND = process.env.RESEND_API_KEY
const DEFAULT_HOST = RESEND ? 'smtp.resend.com' : process.env.SMTP_HOST || ''
const DEFAULT_PORT = RESEND ? 465 : Number(process.env.SMTP_PORT || 465)
const DEFAULT_USER = RESEND ? 'resend' : process.env.SMTP_USER || ''
const DEFAULT_PASS = RESEND || process.env.SMTP_PASS || ''

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 401 })
    }

    return NextResponse.json({
      configured: Boolean(DEFAULT_HOST && DEFAULT_PASS),
      provider: RESEND ? 'Resend' : 'SMTP',
      host: DEFAULT_HOST,
      port: String(DEFAULT_PORT),
      encryption: DEFAULT_PORT === 465 ? 'SSL/TLS' : 'STARTTLS',
      user: DEFAULT_USER,
      // Never send the stored password / API key to the browser
      pass: DEFAULT_PASS ? PASSWORD_MASK : '',
      fromEmail: process.env.EMAIL_FROM || 'support@unionverify.com',
      fromName: process.env.EMAIL_FROM_NAME || 'Union Verify',
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
      host = DEFAULT_HOST,
      port = DEFAULT_PORT,
      user = DEFAULT_USER,
      pass: rawPass,
      secure = false,
      fromEmail = process.env.EMAIL_FROM || 'support@unionverify.com',
      fromName = process.env.EMAIL_FROM_NAME || 'Union Verify',
      toEmail,
      sendTest = false,
    } = body
    const pass = !rawPass || rawPass === PASSWORD_MASK ? DEFAULT_PASS : rawPass

    // If using Resend API Key directly, test via Resend HTTPS API
    if (pass && pass.startsWith('re_')) {
      const domainsRes = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${pass.trim()}` },
      })
      if (!domainsRes.ok) {
        const errJson = await domainsRes.json().catch(() => ({}))
        return NextResponse.json({ error: errJson.message || 'Resend API authentication failed' }, { status: 400 })
      }

      if (sendTest && toEmail) {
        const formattedDate = new Date().toUTCString()
        const sendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${pass.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `"${fromName}" <${fromEmail}>`,
            to: [toEmail],
            replyTo: fromEmail,
            subject: 'Union Verify test email (Resend)',
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 28px;">
                  <span style="font-size: 26px; font-weight: 800; color: #0F1C3F; letter-spacing: -0.5px;">Union <span style="color: #C9A84C;">Verify</span></span>
                  <p style="font-size: 12px; color: #6b7280; margin-top: 4px;">Building Wealth Together</p>
                </div>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                  <h2 style="font-size: 18px; font-weight: 700; color: #0F1C3F; margin: 0 0 10px;">Test Email (Resend Active)</h2>
                  <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0;">
                    Your Resend integration is working perfectly! Outgoing emails are fully operational from ${escapeHtml(fromEmail)}.
                  </p>
                </div>
                <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                  <p style="margin: 0;">Sent: ${formattedDate}</p>
                </div>
              </div>
            `,
          }),
        })

        const sendData = await sendRes.json()
        if (sendRes.ok && sendData?.id) {
          return NextResponse.json({
            success: true,
            message: `Resend delivered the test email to ${toEmail}. Message ID: ${sendData.id}`,
            messageId: sendData.id,
          })
        } else {
          return NextResponse.json({ error: sendData?.message || 'Resend delivery failed' }, { status: 400 })
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Resend API authenticated successfully. Domain is verified.',
      })
    }

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
      const textAlternative = `Union Verify test email

This message was sent from the Union Verify admin settings to check that outgoing email works.

Sent: ${formattedDate}`

      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: toEmail,
        replyTo: fromEmail,
        subject: 'Union Verify test email',
        text: textAlternative,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 28px;">
              <span style="font-size: 26px; font-weight: 800; color: #0F1C3F; letter-spacing: -0.5px;">Union <span style="color: #C9A84C;">Verify</span></span>
              <p style="font-size: 12px; color: #6b7280; margin-top: 4px;">Building Wealth Together</p>
            </div>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h2 style="font-size: 18px; font-weight: 700; color: #0F1C3F; margin: 0 0 10px;">Test email</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0;">
                This message was sent from the Union Verify admin settings to check that outgoing email works. Sender: ${escapeHtml(fromEmail)}.
              </p>
            </div>

            <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5;">
              <p style="margin: 0;">Sent: ${formattedDate}</p>
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
        message: `The SMTP server accepted the test email for ${toEmail}. Message ID: ${info.messageId}`,
        messageId: info.messageId,
      })
    }

    return NextResponse.json({
      success: true,
      message: user
        ? `Connected to ${host}:${port} and logged in as ${user}.`
        : `Connected to ${host}:${port} (no login used).`,
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
