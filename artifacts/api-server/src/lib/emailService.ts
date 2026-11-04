import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "./logger";

export interface EmailDispatchOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  category: "invitation" | "approval" | "correction" | "rejection";
  metadata?: Record<string, any>;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  category: string;
  metadata?: Record<string, any>;
  timestamp: string;
  status: "Sent" | "Failed";
  providerMessageId?: string;
  previewUrl?: string;
  error?: string;
}

export interface SmtpStatus {
  configured: boolean;
  provider: "gmail" | "smtp" | "ethereal";
  host: string;
  port: number;
  secure: boolean;
  userConfigured: boolean;
  passConfigured: boolean;
  userMasked?: string;
  senderAddress: string;
  outboxCount: number;
}

// In-memory audit outbox to inspect dispatched emails
const outbox: EmailLog[] = [];

/**
 * Creates and caches a Nodemailer transport instance based on environment configuration.
 */
let cachedTransporter: Transporter | null = null;
let currentProviderType: "gmail" | "smtp" | "ethereal" = "ethereal";

/**
 * Normalizes and determines active SMTP configuration from environment variables.
 */
function resolveSmtpConfig() {
  const host = (process.env.SMTP_HOST || "").trim();
  const service = (process.env.SMTP_SERVICE || "").trim().toLowerCase();
  const user = (process.env.SMTP_USER || "").trim();
  let rawPass = (process.env.SMTP_PASS || "").trim();

  const isGmail =
    service === "gmail" ||
    host.toLowerCase().includes("gmail.com") ||
    user.toLowerCase().endsWith("@gmail.com") ||
    user.toLowerCase().endsWith("@googlemail.com");

  // Gmail App Passwords are 16 letters generated as 4 groups of 4 (e.g. "abcd efgh ijkl mnop").
  // If user pasted with spaces or quotes, strip them cleanly.
  const pass = isGmail ? rawPass.replace(/\s+/g, "") : rawPass;

  const port = process.env.SMTP_PORT
    ? Number(process.env.SMTP_PORT)
    : isGmail
    ? 465
    : 587;

  const secure = process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === "true"
    : port === 465;

  // Determine smart sender address
  let fromAddress = (process.env.EMAIL_FROM || process.env.SMTP_FROM || "").trim();
  if (isGmail) {
    // Gmail requires sender address to match or include the authenticated Gmail user
    if (!fromAddress || fromAddress.includes("tatasteelfoundation.org")) {
      fromAddress = user ? `Tata Steel Foundation <${user}>` : "Tata Steel Foundation <onboarding@gmail.com>";
    }
  } else if (!fromAddress) {
    if (user && user.includes("@")) {
      fromAddress = `Tata Steel Foundation <${user}>`;
    } else {
      fromAddress = "Tata Steel Foundation <onboarding@tatasteelfoundation.org>";
    }
  }

  return {
    host: isGmail && !host ? "smtp.gmail.com" : host,
    port,
    secure,
    user,
    pass,
    isGmail,
    fromAddress,
  };
}

/**
 * Formats user-friendly diagnostic error messages from Nodemailer/SMTP errors.
 */
function translateSmtpError(err: any, config: ReturnType<typeof resolveSmtpConfig>): string {
  const msg = err.message || "";
  const code = err.code || "";
  const responseCode = err.responseCode || 0;

  if (code === "EAUTH" || responseCode === 535 || msg.includes("535") || msg.toLowerCase().includes("badcredentials") || msg.toLowerCase().includes("invalid login")) {
    if (config.isGmail) {
      return "Gmail SMTP Authentication Failed (535): Invalid username or password. You MUST use a 16-character Google App Password (not your standard Gmail account password). Generate one at: https://myaccount.google.com/apppasswords with 2-Step Verification enabled.";
    }
    return `SMTP Authentication Failed (535): Invalid credentials for user '${config.user}'. Please check SMTP_USER and SMTP_PASS.`;
  }

  if (code === "ESOCKETTIMEDOUT" || code === "ETIMEDOUT" || msg.includes("timeout")) {
    return `SMTP Connection Timed Out connecting to ${config.host}:${config.port}. Port ${config.port} may be blocked by your local network, firewall, or ISP. Try port 465 with SMTP_SECURE=true or port 587 with SMTP_SECURE=false.`;
  }

  if (code === "ECONNREFUSED" || msg.includes("ECONNREFUSED")) {
    return `SMTP Connection Refused at ${config.host}:${config.port}. Please verify SMTP_HOST and SMTP_PORT.`;
  }

  if (code === "ENOTFOUND" || msg.includes("getaddrinfo ENOTFOUND")) {
    return `SMTP Host Not Found: Cannot resolve '${config.host}'. Please verify the host name or check internet connectivity.`;
  }

  if (code === "EENVELOPE" || responseCode === 550 || responseCode === 553) {
    return `SMTP Envelope Rejected (${responseCode}): Sender address '${config.fromAddress}' was not accepted by the mail provider. Ensure your authenticated user has permission to send from this address.`;
  }

  return `Email provider transport rejected: ${msg}`;
}

async function getTransporter(): Promise<Transporter> {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const config = resolveSmtpConfig();

  // Mode 1: Gmail SMTP or Custom SMTP Host configured
  if (config.host || config.isGmail) {
    const providerName = config.isGmail ? "Gmail SMTP" : `Custom SMTP (${config.host})`;
    logger.info(
      {
        provider: providerName,
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user ? `${config.user.slice(0, 3)}***` : undefined,
      },
      "Initializing configured SMTP transport"
    );

    if (config.isGmail) {
      currentProviderType = "gmail";
      cachedTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: config.user && config.pass ? { user: config.user, pass: config.pass } : undefined,
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === "production",
        },
      });
      return cachedTransporter;
    }

    currentProviderType = "smtp";
    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user && config.pass ? { user: config.user, pass: config.pass } : undefined,
      requireTLS: !config.secure,
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === "production",
      },
    });
    return cachedTransporter;
  }

  // Mode 2: Local Development Ethereal SMTP Fallback
  currentProviderType = "ethereal";
  logger.warn("SMTP_HOST not configured in environment. Generating local Ethereal test SMTP credentials for development...");

  try {
    const testAccount = await nodemailer.createTestAccount();
    logger.info({ user: testAccount.user }, "Ethereal test SMTP account generated successfully");
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return cachedTransporter;
  } catch (err: any) {
    logger.error({ err: err.message }, "Failed to generate Ethereal test account");
    throw new Error(
      "No SMTP provider configured and automatic Ethereal test account generation failed. Please configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS (or Gmail App Password) in your backend environment."
    );
  }
}

/**
 * Resets cached transporter on error or configuration update.
 */
export function resetTransporter(): void {
  cachedTransporter = null;
}

/**
 * Dispatches an email via real SMTP transport and verifies delivery confirmation.
 * Throws an explicit error if sending fails so caller does not report false success.
 */
export async function dispatchEmail(options: EmailDispatchOptions): Promise<EmailLog> {
  const config = resolveSmtpConfig();
  const fromAddress = config.fromAddress;
  const emailId = `EML-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  try {
    const transporter = await getTransporter();

    logger.info(
      {
        to: options.to,
        subject: options.subject,
        from: fromAddress,
        provider: currentProviderType,
      },
      "Attempting real email transport dispatch"
    );

    const info = await transporter.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;

    const emailLog: EmailLog = {
      id: emailId,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      category: options.category,
      metadata: options.metadata,
      timestamp: new Date().toISOString(),
      status: "Sent",
      providerMessageId: info.messageId,
      previewUrl: typeof previewUrl === "string" ? previewUrl : undefined,
    };

    outbox.unshift(emailLog);
    if (outbox.length > 100) outbox.pop();

    logger.info(
      {
        to: options.to,
        messageId: info.messageId,
        previewUrl,
        logId: emailLog.id,
        provider: currentProviderType,
      },
      "✅ Real email successfully accepted by mail provider"
    );

    return emailLog;
  } catch (err: any) {
    // Invalidate cached transporter on failure so next attempt re-evaluates updated env/credentials
    resetTransporter();

    const translatedError = translateSmtpError(err, config);

    const failedLog: EmailLog = {
      id: emailId,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      category: options.category,
      metadata: options.metadata,
      timestamp: new Date().toISOString(),
      status: "Failed",
      error: translatedError,
    };

    outbox.unshift(failedLog);
    logger.error(
      {
        to: options.to,
        rawError: err.message,
        code: err.code,
        responseCode: err.responseCode,
        translated: translatedError,
      },
      "❌ Email delivery rejected by mail transport"
    );

    // Strictly throw descriptive error so caller knows dispatch failed and does not report false delivery
    throw new Error(translatedError);
  }
}

/**
 * Returns current SMTP status diagnostic information (without revealing secrets).
 */
export function getSmtpStatus(): SmtpStatus {
  const config = resolveSmtpConfig();
  const user = config.user;
  const userMasked = user
    ? user.includes("@")
      ? `${user.slice(0, 2)}***@${user.split("@")[1]}`
      : `${user.slice(0, 3)}***`
    : undefined;

  return {
    configured: Boolean(config.host || config.isGmail),
    provider: config.isGmail ? "gmail" : config.host ? "smtp" : "ethereal",
    host: config.host || "smtp.ethereal.email (auto-generated)",
    port: config.port,
    secure: config.secure,
    userConfigured: Boolean(config.user),
    passConfigured: Boolean(config.pass),
    userMasked,
    senderAddress: config.fromAddress,
    outboxCount: outbox.length,
  };
}

/**
 * Verifies active SMTP connection.
 */
export async function verifySmtpConnection(): Promise<{ ok: boolean; message: string; previewUrl?: string }> {
  try {
    const transporter = await getTransporter();
    await transporter.verify();
    const config = resolveSmtpConfig();
    return {
      ok: true,
      message: `SMTP connection verified successfully with ${config.isGmail ? "Gmail" : config.host}:${config.port}.`,
    };
  } catch (err: any) {
    resetTransporter();
    const config = resolveSmtpConfig();
    return {
      ok: false,
      message: translateSmtpError(err, config),
    };
  }
}

export function getOutbox(): EmailLog[] {
  return [...outbox];
}

export function clearOutbox(): void {
  outbox.length = 0;
}

/**
 * Builds HTML template for FPC Admin Registration Invitation
 */
export function buildInvitationEmailHtml({
  adminName,
  token,
  expiresAt,
  baseUrl,
}: {
  adminName: string;
  token: string;
  expiresAt: string;
  baseUrl: string;
}): { html: string; text: string; subject: string } {
  const registrationUrl = `${baseUrl.replace(/\/+$/, "")}/onboard/register?token=${encodeURIComponent(token)}`;
  const formattedExpiry = new Date(expiresAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const subject = "Invitation to Register Your Farmer Producer Company | TSF FPC Network";

  const text = `Dear ${adminName},

You have been formally invited by Tata Steel Foundation (TSF) to register your Farmer Producer Company (FPC) on the national FPC Management Network.

To complete your company onboarding, please click the secure link below:
${registrationUrl}

Important Notes:
- This single-use link is specifically issued to you and expires on ${formattedExpiry}.
- Please keep your Certificate of Incorporation, CIN/PAN, Board of Directors list, and primary bank details ready.
- If you have questions, please reach out to the TSF Onboarding Helpdesk at onboarding@tatasteelfoundation.org.

Warm regards,
TSF Central Operations Team
Tata Steel Foundation`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f7f2; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f372d; }
    .container { max-width: 620px; margin: 30px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e1e8e2; overflow: hidden; box-shadow: 0 4px 20px rgba(23,107,73,0.06); }
    .header { background: linear-gradient(135deg, #176b49 0%, #0e4c33 100%); padding: 32px 36px; color: #ffffff; text-align: left; }
    .badge { display: inline-block; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 12px; margin-bottom: 12px; color: #f1f8f4; }
    .header h1 { margin: 0 0 6px; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 0; color: #d0e6dc; font-size: 13px; }
    .body-content { padding: 36px; line-height: 1.6; font-size: 14px; color: #2d453b; }
    .salutation { font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #176b49; }
    .highlight-card { background: #f7faf7; border-left: 4px solid #176b49; border-radius: 0 8px 8px 0; padding: 18px 20px; margin: 24px 0; }
    .highlight-card ul { margin: 8px 0 0; padding-left: 18px; }
    .highlight-card li { margin-bottom: 6px; font-size: 13px; color: #435c51; }
    .cta-area { text-align: center; margin: 34px 0 28px; }
    .btn { display: inline-block; background: #176b49; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 34px; border-radius: 8px; box-shadow: 0 3px 10px rgba(23,107,73,0.25); letter-spacing: 0.02em; }
    .expiry-note { font-size: 12px; color: #738a7f; text-align: center; margin-top: 12px; }
    .expiry-note strong { color: #b45309; }
    .link-alt { background: #fbfdfb; border: 1px dashed #c9d8ce; border-radius: 6px; padding: 12px; margin-top: 24px; word-break: break-all; font-family: monospace; font-size: 11px; color: #516b5f; }
    .footer { background: #fbfdfa; border-top: 1px solid #edf2ed; padding: 24px 36px; font-size: 11px; color: #7f948a; text-align: center; }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Official Invitation</div>
      <h1>FPC Onboarding Portal</h1>
      <p>Tata Steel Foundation · Agricultural & Rural Enterprise Development</p>
    </div>
    <div class="body-content">
      <div class="salutation">Dear ${adminName},</div>
      <p>You have been formally nominated as the Lead Administrator to onboard and register your <strong>Farmer Producer Company</strong> on the centralized <strong>TSF FPC Management Network</strong>.</p>
      
      <p>This invitation gives you direct access to complete your company's official registration, statutory compliance records, director roster, and operational details at your own pace.</p>

      <div class="highlight-card">
        <strong>Required information for registration:</strong>
        <ul>
          <li>Company Basic Details & Registered Office Address</li>
          <li>Certificate of Incorporation, CIN, PAN, TAN & GSTIN</li>
          <li>Board of Directors list (Minimum 5 directors with DIN/PAN)</li>
          <li>Operational activities and target farmer membership</li>
          <li>Primary settlement bank account details</li>
        </ul>
      </div>

      <div class="cta-area">
        <a href="${registrationUrl}" class="btn" target="_blank" rel="noopener noreferrer">Complete FPC Registration &rarr;</a>
        <div class="expiry-note">
          ⏰ This registration link is single-use and will expire on <strong>${formattedExpiry}</strong>.
        </div>
      </div>

      <p style="font-size: 12px; color: #5d756b;">If the button above does not open, please copy and paste this secure URL directly into your web browser:</p>
      <div class="link-alt">${registrationUrl}</div>
    </div>
    <div class="footer">
      <p><strong>Tata Steel Foundation (TSF) Central Operations Desk</strong></p>
      <p>Support contact: <a href="mailto:onboarding@tatasteelfoundation.org" style="color: #176b49;">onboarding@tatasteelfoundation.org</a> | +91 94370 04412</p>
      <p style="margin-top: 8px;">Confidential &amp; Proprietary · Issued specifically to recipient</p>
    </div>
  </div>
</body>
</html>`;

  return { html, text, subject };
}

/**
 * Builds HTML template for TSF Approval & Permanent FPC ID Confirmation
 */
export function buildApprovalEmailHtml({
  adminName,
  companyName,
  fpcId,
  baseUrl,
}: {
  adminName: string;
  companyName: string;
  fpcId: string;
  baseUrl: string;
}): { html: string; text: string; subject: string } {
  const loginUrl = `${baseUrl.replace(/\/+$/, "")}/`;
  const subject = `Registration Approved: Welcome to TSF FPC Network (${fpcId})`;

  const text = `Dear ${adminName},

Congratulations! The registration for ${companyName} has been officially approved by Tata Steel Foundation Central Administration.

Your Permanent FPC Identifier is: ${fpcId}

Your company is now active on the national TSF network. You can log into your FPC operations desk to manage farmers, shareholders, input sales, and procurement.

Login Portal: ${loginUrl}

Warm regards,
TSF Central Operations Team
Tata Steel Foundation`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f7f2; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f372d; }
    .container { max-width: 620px; margin: 30px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e1e8e2; overflow: hidden; box-shadow: 0 4px 20px rgba(23,107,73,0.06); }
    .header { background: linear-gradient(135deg, #176b49 0%, #0e4c33 100%); padding: 32px 36px; color: #ffffff; }
    .badge { display: inline-block; background: #22c55e; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 12px; margin-bottom: 12px; color: #ffffff; }
    .header h1 { margin: 0 0 6px; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .body-content { padding: 36px; line-height: 1.6; font-size: 14px; color: #2d453b; }
    .id-box { background: #e8f5ed; border: 2px solid #2e7d32; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
    .id-box span { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #1b5e20; letter-spacing: 0.1em; display: block; }
    .id-box b { font-size: 26px; font-family: monospace; color: #144919; letter-spacing: 0.05em; display: block; margin: 6px 0; }
    .cta-area { text-align: center; margin: 30px 0 20px; }
    .btn { display: inline-block; background: #176b49; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 34px; border-radius: 8px; }
    .footer { background: #fbfdfa; border-top: 1px solid #edf2ed; padding: 24px 36px; font-size: 11px; color: #7f948a; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Official Approval</div>
      <h1>Producer Company Activated</h1>
      <p>Tata Steel Foundation · Partner FPC Network</p>
    </div>
    <div class="body-content">
      <p style="font-size: 16px; font-weight: 700; color: #176b49;">Congratulations ${adminName},</p>
      <p>We are delighted to confirm that the registration application for <strong>${companyName}</strong> has been thoroughly reviewed and approved by TSF Central Operations.</p>
      
      <div class="id-box">
        <span>Permanent Assigned FPC Unique Identifier</span>
        <b>${fpcId}</b>
        <small style="color: #2e7d32;">Active Network Identifier · State Verified</small>
      </div>

      <p>Your Producer Company has been officially provisioned in the centralized directory. You can now access your company workspace to mobilize farmers, issue share certificates, record agri-business sales, and manage compliance.</p>

      <div class="cta-area">
        <a href="${loginUrl}" class="btn" target="_blank" rel="noopener noreferrer">Access FPC Workspace &rarr;</a>
      </div>
    </div>
    <div class="footer">
      <p><strong>Tata Steel Foundation (TSF) Central Operations Desk</strong></p>
      <p>Support: <a href="mailto:onboarding@tatasteelfoundation.org" style="color: #176b49;">onboarding@tatasteelfoundation.org</a></p>
    </div>
  </div>
</body>
</html>`;

  return { html, text, subject };
}

/**
 * Builds HTML template for Correction Request
 */
export function buildCorrectionEmailHtml({
  adminName,
  companyName,
  token,
  remarks,
  baseUrl,
}: {
  adminName: string;
  companyName: string;
  token: string;
  remarks: string;
  baseUrl: string;
}): { html: string; text: string; subject: string } {
  const revisionUrl = `${baseUrl.replace(/\/+$/, "")}/onboard/register?token=${encodeURIComponent(token)}`;
  const subject = `Clarification Required: FPC Registration for ${companyName}`;

  const text = `Dear ${adminName},

During the review of your company registration for ${companyName}, TSF Central Administration noted the following items requiring your clarification or correction:

${remarks}

Please review your application and provide the updated information using the link below:
${revisionUrl}

Warm regards,
TSF Central Operations Team`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f7f2; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f372d; }
    .container { max-width: 620px; margin: 30px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e1e8e2; overflow: hidden; }
    .header { background: #b45309; padding: 30px 36px; color: #ffffff; }
    .body-content { padding: 36px; line-height: 1.6; font-size: 14px; }
    .remarks-box { background: #fffbeb; border-left: 4px solid #d97706; padding: 18px; margin: 20px 0; border-radius: 0 8px 8px 0; font-size: 13px; color: #92400e; }
    .btn { display: inline-block; background: #b45309; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 30px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 20px;">Clarification Required</h1>
      <p style="margin: 4px 0 0; font-size: 13px; color: #fde68a;">TSF Central Administration Review</p>
    </div>
    <div class="body-content">
      <p>Dear ${adminName},</p>
      <p>Thank you for submitting the registration application for <strong>${companyName}</strong>. Our review committee requires the following clarifications before approving your application:</p>
      
      <div class="remarks-box">
        <strong>Reviewer Feedback:</strong><br />
        ${remarks}
      </div>

      <p>Your application draft has been unlocked for revision. Please make the required updates and re-submit.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${revisionUrl}" class="btn" target="_blank" rel="noopener noreferrer">Revise Registration &rarr;</a>
      </div>
    </div>
  </div>
</body>
</html>`;

  return { html, text, subject };
}
