'use server'

/**
 * Email utility module for the Marriage Investment platform.
 *
 * Supports two transports:
 *  1. Resend  — set RESEND_API_KEY in your environment
 *  2. SMTP    — set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS
 *
 * Resend is preferred when RESEND_API_KEY is present.
 */

import nodemailer, { type Transporter } from 'nodemailer'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

interface InvestmentEmailDetails {
  reference: string
  planName: string
  amount: number
  returnRate: number
  termMonths: number
  startDate: Date | string
  maturityDate: Date | string
}

interface TransactionEmailDetails {
  reference: string
  type: string
  amount: number
  status: string
  date: Date | string
  description?: string
}

// ---------------------------------------------------------------------------
// Transport factory
// ---------------------------------------------------------------------------

let _transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (_transporter) return _transporter

  if (process.env.RESEND_API_KEY) {
    // Resend via SMTP bridge (no additional SDK dependency required)
    _transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    })
  } else {
    // Generic SMTP transport
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const smtpPort = Number(process.env.SMTP_PORT ?? 465)

    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'email-smtp.us-east-1.amazonaws.com',
      port: smtpPort,
      secure: smtpPort === 465,
      auth:
        smtpUser && smtpPass
          ? {
              user: smtpUser,
              pass: smtpPass,
            }
          : undefined,
      tls: {
        rejectUnauthorized: false,
      },
    })
  }

  return _transporter
}

// ---------------------------------------------------------------------------
// Shared template helpers
// ---------------------------------------------------------------------------

const FROM = `${process.env.EMAIL_FROM_NAME ?? 'Union Verify'} <${process.env.EMAIL_FROM ?? 'support@unionverify.com'}>`
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://unionverify.com'
const BRAND_COLOR = '#0F1C3F'

function baseTemplate(body: string, preheader = ''): string {
  return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Union Verify</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .header { background: ${BRAND_COLOR}; padding: 28px 32px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -.5px; }
    .header p { margin: 4px 0 0; color: rgba(255,255,255,.8); font-size: 13px; }
    .body { padding: 32px; color: #374151; font-size: 15px; line-height: 1.65; }
    .body h2 { margin: 0 0 16px; font-size: 18px; color: #111827; }
    .body p { margin: 0 0 16px; }
    .btn { display: inline-block; padding: 12px 28px; background: ${BRAND_COLOR}; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .table td:first-child { color: #6b7280; width: 45%; }
    .table td:last-child { font-weight: 600; color: #111827; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-error { background: #fee2e2; color: #991b1b; }
    .footer { padding: 20px 32px; text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.5; }
    .footer a { color: #9ca3af; }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}&zwnj;&nbsp;` + '&#8203;'.repeat(100) + '</div>' : ''}
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>💍 Union Verify</h1>
        <p>Secure your future together</p>
      </div>
      <div class="body">
        ${body}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Union Verify. All rights reserved.</p>
        <p>
          <a href="${APP_URL}/privacy">Privacy Policy</a> &middot;
          <a href="${APP_URL}/terms">Terms of Service</a> &middot;
          <a href="${APP_URL}/contact">Contact Us</a>
        </p>
        <p style="margin-top:8px;">
          If you did not request this email, you can safely ignore it.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function fmtDate(d: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(d))
}

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

/**
 * Send an email. Returns `true` on success, `false` on failure.
 * Errors are logged to the console but never thrown to avoid crashing callers.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, html, text } = options

  try {
    const transporter = getTransporter()
    const info = await transporter.sendMail({
      from: FROM,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text: text ?? html.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim(),
    })

    if (process.env.NODE_ENV === 'development') {
      console.info('[email] sent:', info.messageId, '→', to)
    }

    return true
  } catch (error) {
    console.error('[email] failed to send to', to, error)
    return false
  }
}

// ---------------------------------------------------------------------------
// Verification email
// ---------------------------------------------------------------------------

/**
 * Send an email-address verification link.
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
): Promise<boolean> {
  const url = `${APP_URL}/auth/verify-email?token=${encodeURIComponent(token)}`

  const html = baseTemplate(
    /* html */ `
    <h2>Verify your email address</h2>
    <p>Thanks for signing up with Union Verify! Please verify your email address by clicking the button below. This link expires in <strong>24 hours</strong>.</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${url}" class="btn">Verify Email Address</a>
    </p>
    <p>Or paste this URL into your browser:</p>
    <p style="word-break:break-all;font-size:13px;color:#6b7280;">${url}</p>
    <hr class="divider" />
    <p style="font-size:13px;color:#6b7280;">
      Didn't create an account? You can safely ignore this email.
    </p>
    `,
    'Please verify your email address to activate your account.',
  )

  return sendEmail({
    to: email,
    subject: 'Verify your Union Verify email address',
    html,
  })
}

// ---------------------------------------------------------------------------
// Welcome email
// ---------------------------------------------------------------------------

/**
 * Send a welcome email after the user has verified their account.
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
): Promise<boolean> {
  const html = baseTemplate(
    /* html */ `
    <h2>Welcome aboard, ${name}! 🎉</h2>
    <p>Your Union Verify account is now active. We're thrilled to have you join a community building a secure financial future together.</p>
    <p>Here's how to get started:</p>
    <ol style="padding-left:20px;line-height:2;">
      <li>Browse available <a href="${APP_URL}/plans" style="color:${BRAND_COLOR};">investment plans</a></li>
      <li>Complete your <a href="${APP_URL}/profile" style="color:${BRAND_COLOR};">profile and KYC</a></li>
      <li>Make your first investment</li>
    </ol>
    <p style="text-align:center;margin:28px 0;">
      <a href="${APP_URL}/dashboard" class="btn">Go to Your Dashboard</a>
    </p>
    <hr class="divider" />
    <p style="font-size:13px;color:#6b7280;">
      Questions? Reply to this email or visit our <a href="${APP_URL}/faq" style="color:${BRAND_COLOR};">FAQ</a>.
    </p>
    `,
    `Welcome to Union Verify, ${name}! Your account is ready.`,
  )

  return sendEmail({
    to: email,
    subject: `Welcome to Union Verify, ${name}!`,
    html,
  })
}

// ---------------------------------------------------------------------------
// Password reset email
// ---------------------------------------------------------------------------

/**
 * Send a password-reset link.
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<boolean> {
  const url = `${APP_URL}/auth/reset-password?token=${encodeURIComponent(token)}`

  const html = baseTemplate(
    /* html */ `
    <h2>Reset your password</h2>
    <p>We received a request to reset the password for your Union Verify account associated with <strong>${email}</strong>.</p>
    <p>Click the button below to choose a new password. This link is valid for <strong>1 hour</strong>.</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${url}" class="btn">Reset Password</a>
    </p>
    <p>Or paste this URL into your browser:</p>
    <p style="word-break:break-all;font-size:13px;color:#6b7280;">${url}</p>
    <hr class="divider" />
    <p style="font-size:13px;color:#6b7280;">
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
    `,
    'Reset your Union Verify account password.',
  )

  return sendEmail({
    to: email,
    subject: 'Reset your Union Verify password',
    html,
  })
}

// ---------------------------------------------------------------------------
// Investment confirmation email
// ---------------------------------------------------------------------------

/**
 * Send an investment confirmation email after a new investment is created.
 */
export async function sendInvestmentConfirmationEmail(
  email: string,
  name: string,
  details: InvestmentEmailDetails,
): Promise<boolean> {
  const expectedReturn =
    details.amount * (1 + (details.returnRate / 100) * (details.termMonths / 12))

  const html = baseTemplate(
    /* html */ `
    <h2>Investment Confirmed ✅</h2>
    <p>Hi ${name}, your investment has been successfully created. Here is a summary:</p>
    <table class="table">
      <tr><td>Reference</td><td>${details.reference}</td></tr>
      <tr><td>Plan</td><td>${details.planName}</td></tr>
      <tr><td>Amount Invested</td><td>${fmtCurrency(details.amount)}</td></tr>
      <tr><td>Annual Return Rate</td><td>${details.returnRate}%</td></tr>
      <tr><td>Term</td><td>${details.termMonths} month${details.termMonths !== 1 ? 's' : ''}</td></tr>
      <tr><td>Start Date</td><td>${fmtDate(details.startDate)}</td></tr>
      <tr><td>Maturity Date</td><td>${fmtDate(details.maturityDate)}</td></tr>
      <tr><td>Expected Return</td><td><strong>${fmtCurrency(expectedReturn)}</strong></td></tr>
    </table>
    <p>You can track your investment at any time from your dashboard.</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${APP_URL}/dashboard/investments/${details.reference}" class="btn">View Investment</a>
    </p>
    <hr class="divider" />
    <p style="font-size:13px;color:#6b7280;">
      Please keep this email for your records. If you have questions, contact our support team.
    </p>
    `,
    `Investment ${details.reference} for ${fmtCurrency(details.amount)} confirmed.`,
  )

  return sendEmail({
    to: email,
    subject: `Investment Confirmation — ${details.reference}`,
    html,
  })
}

// ---------------------------------------------------------------------------
// Withdrawal status email
// ---------------------------------------------------------------------------

type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'

/**
 * Send an email notifying the user of a change in their withdrawal request status.
 */
export async function sendWithdrawalStatusEmail(
  email: string,
  name: string,
  status: WithdrawalStatus,
  amount: number,
): Promise<boolean> {
  const statusMessages: Record<WithdrawalStatus, { label: string; color: string; body: string }> = {
    pending: {
      label: 'Pending Review',
      color: '#f59e0b',
      body: 'Your withdrawal request has been received and is pending review by our finance team. You will be notified once it is processed.',
    },
    processing: {
      label: 'Processing',
      color: '#3b82f6',
      body: 'Your withdrawal is being processed. Funds are on their way and should arrive within 1–3 business days depending on your bank.',
    },
    approved: {
      label: 'Approved',
      color: '#10b981',
      body: 'Great news — your withdrawal request has been approved! Funds will be transferred to your registered bank account within 1–3 business days.',
    },
    completed: {
      label: 'Completed',
      color: '#10b981',
      body: 'Your withdrawal has been completed. The funds have been sent to your registered bank account. Please allow a short time for your bank to process the credit.',
    },
    rejected: {
      label: 'Rejected',
      color: '#ef4444',
      body: 'Unfortunately, your withdrawal request has been rejected. This may be due to insufficient funds, pending KYC, or a policy restriction. Please contact support for clarification.',
    },
  }

  const info = statusMessages[status] ?? statusMessages.pending

  const html = baseTemplate(
    /* html */ `
    <h2>Withdrawal Update</h2>
    <p>Hi ${name}, the status of your withdrawal request has been updated.</p>
    <table class="table">
      <tr><td>Amount</td><td>${fmtCurrency(amount)}</td></tr>
      <tr>
        <td>Status</td>
        <td>
          <span style="display:inline-block;padding:2px 12px;border-radius:999px;font-size:12px;font-weight:700;background:${info.color}20;color:${info.color};">
            ${info.label}
          </span>
        </td>
      </tr>
    </table>
    <p>${info.body}</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${APP_URL}/dashboard/withdrawals" class="btn">View Withdrawal History</a>
    </p>
    `,
    `Your withdrawal of ${fmtCurrency(amount)} is now ${info.label}.`,
  )

  return sendEmail({
    to: email,
    subject: `Withdrawal ${info.label} — ${fmtCurrency(amount)}`,
    html,
  })
}

// ---------------------------------------------------------------------------
// Payment receipt email
// ---------------------------------------------------------------------------

/**
 * Send a payment receipt email after a transaction is confirmed.
 */
export async function sendPaymentReceiptEmail(
  email: string,
  name: string,
  transaction: TransactionEmailDetails,
): Promise<boolean> {
  const statusBadgeStyle = (s: string): string => {
    const map: Record<string, string> = {
      COMPLETED: 'background:#d1fae5;color:#065f46;',
      SUCCESS: 'background:#d1fae5;color:#065f46;',
      PENDING: 'background:#fef3c7;color:#92400e;',
      FAILED: 'background:#fee2e2;color:#991b1b;',
    }
    return map[s.toUpperCase()] ?? 'background:#f3f4f6;color:#374151;'
  }

  const html = baseTemplate(
    /* html */ `
    <h2>Payment Receipt</h2>
    <p>Hi ${name}, here is your receipt for the following transaction:</p>
    <table class="table">
      <tr><td>Reference</td><td>${transaction.reference}</td></tr>
      <tr><td>Type</td><td>${transaction.type}</td></tr>
      <tr><td>Amount</td><td><strong>${fmtCurrency(transaction.amount)}</strong></td></tr>
      <tr>
        <td>Status</td>
        <td>
          <span style="display:inline-block;padding:2px 12px;border-radius:999px;font-size:12px;font-weight:700;${statusBadgeStyle(transaction.status)}">
            ${transaction.status}
          </span>
        </td>
      </tr>
      <tr><td>Date</td><td>${fmtDate(transaction.date)}</td></tr>
      ${transaction.description ? `<tr><td>Description</td><td>${transaction.description}</td></tr>` : ''}
    </table>
    <p>Please keep this receipt for your records. If you did not authorise this transaction, contact our support team immediately.</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${APP_URL}/dashboard/transactions" class="btn">View All Transactions</a>
    </p>
    `,
    `Receipt for ${transaction.type} of ${fmtCurrency(transaction.amount)}.`,
  )

  return sendEmail({
    to: email,
    subject: `Payment Receipt — ${transaction.reference}`,
    html,
  })
}

// ---------------------------------------------------------------------------
// Deposit Reminder email
// ---------------------------------------------------------------------------

/**
 * Send an automated or spousal deposit reminder email to a partner.
 */
export async function sendDepositReminderEmail({
  to,
  recipientName,
  senderName,
  amount,
  vaultName = 'Jane Doe & Marcus Vance Spousal Contribution',
  note,
  frequency = 'Monthly',
}: {
  to: string
  recipientName: string
  senderName: string
  amount: number
  vaultName?: string
  note?: string
  frequency?: string
}): Promise<boolean> {
  const html = baseTemplate(
    /* html */ `
    <div style="text-align:center;margin-bottom:20px;">
      <span style="display:inline-block;padding:4px 14px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;background:#FEF3C7;color:#92400E;">
        ⏰ Matrimonial Deposit Reminder
      </span>
    </div>
    <h2>Deposit Reminder from ${senderName}</h2>
    <p>Hi ${recipientName},</p>
    <p>
      <strong>${senderName}</strong> has sent you a scheduled deposit reminder for your joint matrimonial wealth vault:
      <strong style="color:#0F1C3F;">${vaultName}</strong>.
    </p>

    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;padding:20px;margin:24px 0;">
      <table class="table" style="margin:0;">
        <tr>
          <td>Target Amount</td>
          <td><strong style="font-size:18px;color:#0F1C3F;">${fmtCurrency(amount)}</strong></td>
        </tr>
        <tr>
          <td>Vault Target</td>
          <td>${vaultName}</td>
        </tr>
        <tr>
          <td>Compounding Yield</td>
          <td><strong style="color:#059669;">6.8% APY (Compounding Every Second)</strong></td>
        </tr>
        <tr>
          <td>Schedule</td>
          <td>${frequency} Spousal Contribution</td>
        </tr>
        ${note ? `<tr><td>Personal Note</td><td><em>&ldquo;${note}&rdquo;</em></td></tr>` : ''}
      </table>
    </div>

    <p style="font-size:13px;color:#64748B;line-height:1.6;">
      Under your Spousal Covenant, maintaining consistent matching deposits preserves maximum compounding acceleration and protects your dual-signatory liquidity covenant.
    </p>

    <p style="text-align:center;margin:32px 0 24px;">
      <a href="${APP_URL}/save?amount=${amount}&target=joint" class="btn" style="background:#0F1C3F;color:#ffffff;padding:14px 32px;font-weight:700;border-radius:12px;text-decoration:none;display:inline-block;">
        Deposit ${fmtCurrency(amount)} Now ↗
      </a>
    </p>
    `,
    `Deposit Reminder: ${senderName} sent you a reminder to deposit ${fmtCurrency(amount)} into your joint vault.`,
  )

  return sendEmail({
    to,
    subject: `⏰ Deposit Reminder: ${senderName} nudged you to deposit ${fmtCurrency(amount)}`,
    html,
  })
}

