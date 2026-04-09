import nodemailer from "nodemailer";

export type SmtpConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  useTls?: boolean;
};

export type SmtpSendParams = {
  to: string;
  from: string;
  senderName?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export type SmtpSendResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

/**
 * Create a nodemailer transporter from SMTP config
 */
function createTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465, // SSL for 465, STARTTLS for others
    auth: {
      user: config.username,
      pass: config.password,
    },
    tls: {
      rejectUnauthorized: config.useTls !== false,
    },
    // Connection timeout
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

/**
 * Verify SMTP connection before sending
 */
export async function verifySmtpConnection(
  config: SmtpConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter(config);
    await transporter.verify();
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "SMTP connection failed";
    console.error("[SMTP] Verification failed:", message);
    return { success: false, error: message };
  }
}

/**
 * Send an email via custom SMTP
 */
export async function sendViaSmtp(
  config: SmtpConfig,
  params: SmtpSendParams
): Promise<SmtpSendResult> {
  try {
    const transporter = createTransporter(config);

    const fromAddress = params.senderName
      ? `${params.senderName} <${params.from}>`
      : params.from;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo || undefined,
      headers: {
        "X-Mailer": "PitchMint",
        "List-Unsubscribe": `<mailto:${params.from}?subject=unsubscribe>`,
      },
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "SMTP send failed";
    console.error("[SMTP] Send failed:", message);
    return { success: false, error: message };
  }
}

/**
 * Send a test email via custom SMTP to verify configuration
 */
export async function sendSmtpTestEmail(
  config: SmtpConfig,
  toEmail: string
): Promise<SmtpSendResult> {
  return sendViaSmtp(config, {
    to: toEmail,
    from: config.username,
    senderName: "PitchMint",
    subject: "✅ PitchMint SMTP Test — Configuration Verified",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #7c3aed; margin-bottom: 16px;">🎉 SMTP Configuration Verified!</h2>
        <p style="color: #374151; line-height: 1.6;">
          Your custom SMTP settings are working correctly. Emails sent through PitchMint will now be delivered via your own mail server.
        </p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; color: #6b7280;"><strong>Server:</strong> ${config.host}:${config.port}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;"><strong>Username:</strong> ${config.username}</p>
        </div>
        <p style="font-size: 12px; color: #9ca3af;">
          Sent from PitchMint at ${new Date().toISOString()}
        </p>
      </div>
    `,
    text: `PitchMint SMTP Test — Your SMTP configuration (${config.host}:${config.port}) is working correctly!`,
  });
}
