const nodemailer = require("nodemailer");

let transporter = null;

const getSenderEmail = (name = "FoundIT Team") => {
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  if (process.env.BREVO_SENDER_EMAIL) return `"${name}" <${process.env.BREVO_SENDER_EMAIL}>`;
  if (process.env.SMTP_USER) return `"${name}" <${process.env.SMTP_USER}>`;
  return `"${name}" <noreply@foundit.app>`;
};

// 1. Send via Brevo REST API (HTTPS port 443 - zero domain restriction, instant cloud delivery)
const sendViaBrevo = async (to, name, subject, html, fromName) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;

  try {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || "bereket2356@gmail.com";
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: fromName, email: senderEmail },
        to: [{ email: to, name: name || to }],
        subject: subject,
        htmlContent: html,
      }),
    });

    const data = await response.json();
    if (response.ok && data.messageId) {
      console.log(`[EMAIL REST BREVO SUCCESS] Sent to ${to} (id: ${data.messageId})`);
      return { messageId: data.messageId, provider: "brevo" };
    } else {
      console.error("[EMAIL BREVO ERROR]", data);
      return null;
    }
  } catch (err) {
    console.error("[EMAIL BREVO FETCH ERROR]", err.message);
    return null;
  }
};

// 2. Send via Nodemailer SMTP (For local environments / unblocked SMTP ports)
const createEmailTransporter = () => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT) || 587;

  if (smtpUser && smtpPass) {
    const isGmail =
      (smtpHost && smtpHost.includes("gmail")) ||
      (smtpUser && smtpUser.endsWith("@gmail.com"));

    return nodemailer.createTransport(
      isGmail
        ? {
            service: "gmail",
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
            pool: true,
            maxConnections: 5,
            maxMessages: Infinity,
            connectionTimeout: 8000,
            greetingTimeout: 8000,
            socketTimeout: 8000,
          }
        : {
            host: smtpHost || "smtp.gmail.com",
            port: smtpPort,
            secure: smtpPort === 465,
            pool: true,
            maxConnections: 5,
            maxMessages: Infinity,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
            connectionTimeout: 8000,
            greetingTimeout: 8000,
            socketTimeout: 8000,
            tls: {
              rejectUnauthorized: false,
            },
          }
    );
  }

  return null;
};

const getTransporter = () => {
  if (!transporter) {
    transporter = createEmailTransporter();
  }
  return transporter;
};

// Unified Sender Function: Prioritizes Brevo HTTPS REST API -> Nodemailer SMTP
const dispatchEmail = async ({ to, name, subject, html, fromName }) => {
  // 1. Try Brevo HTTPS REST API first
  if (process.env.BREVO_API_KEY) {
    const brevoResult = await sendViaBrevo(to, name, subject, html, fromName);
    if (brevoResult) return brevoResult;
  }

  // 2. Fallback to Nodemailer SMTP
  const trans = getTransporter();
  if (trans) {
    try {
      const info = await trans.sendMail({
        from: getSenderEmail(fromName),
        to,
        subject,
        html,
      });
      console.log(`[EMAIL SMTP SUCCESS] Sent to ${to} (messageId: ${info?.messageId || "ok"})`);
      return { messageId: info?.messageId || `msg-${Date.now()}`, provider: "smtp" };
    } catch (err) {
      console.error(`[EMAIL SMTP ERROR] Failed for ${to}:`, err.message);
      transporter = null;
    }
  }

  // 3. Dev console fallback
  console.warn(`[EMAIL DEV FALLBACK] No email service succeeded for ${to}`);
  return { messageId: `dev-${Date.now()}`, provider: "dev-logger" };
};

const sendVerificationEmail = async (email, name, code) => {
  const subject = "FoundIT - Verify Your Email Address";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #0b0c2a; text-align: center; margin-bottom: 20px;">Welcome to FoundIT!</h2>
      <p style="color: #333; font-size: 15px;">Hi ${name || "there"},</p>
      <p style="color: #555; font-size: 14px; line-height: 22px;">Thank you for signing up for FoundIT. Please use the 6-digit verification code below to confirm your email address:</p>
      <div style="background: #f4f4f5; padding: 18px; border-radius: 8px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0b0c2a; font-family: monospace;">${code}</span>
      </div>
      <p style="color: #777; font-size: 13px; line-height: 18px;">This code will expire in 24 hours. If you did not create a FoundIT account, please ignore this email.</p>
    </div>
  `;

  return await dispatchEmail({
    to: email,
    name,
    subject,
    html,
    fromName: "FoundIT Team",
  });
};

const sendPasswordResetEmail = async (email, name, code) => {
  const subject = "FoundIT - Password Reset Request";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #0b0c2a; text-align: center; margin-bottom: 20px;">Reset Your Password</h2>
      <p style="color: #333; font-size: 15px;">Hi ${name || "there"},</p>
      <p style="color: #555; font-size: 14px; line-height: 22px;">We received a request to reset your FoundIT password. Use the 6-digit code below to set a new password:</p>
      <div style="background: #f4f4f5; padding: 18px; border-radius: 8px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0b0c2a; font-family: monospace;">${code}</span>
      </div>
      <p style="color: #777; font-size: 13px; line-height: 18px;">This code will expire in 30 minutes. If you did not request a password reset, you can safely ignore this message.</p>
    </div>
  `;

  return await dispatchEmail({
    to: email,
    name,
    subject,
    html,
    fromName: "FoundIT Security",
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
