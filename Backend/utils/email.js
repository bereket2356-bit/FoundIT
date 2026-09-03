const nodemailer = require("nodemailer");

let transporter = null;

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
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
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
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
            tls: {
              rejectUnauthorized: false,
            },
          }
    );
  }

  // Development fallback logger (fast, non-blocking)
  console.warn("[EMAIL WARNING] SMTP_USER or SMTP_PASS not set. Falling back to console logger.");
  return {
    sendMail: async (opts) => {
      console.log("\n--- [DEV CONSOLE EMAIL NOTIFICATION] ---");
      console.log(`TO: ${opts.to}`);
      console.log(`SUBJECT: ${opts.subject}`);
      console.log(`FROM: ${opts.from}`);
      console.log("----------------------------------------\n");
      return { messageId: `dev-msg-${Date.now()}` };
    },
  };
};

const getTransporter = () => {
  if (!transporter) {
    transporter = createEmailTransporter();
  }
  return transporter;
};

const getSenderEmail = (name = "FoundIT Team") => {
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  if (process.env.SMTP_USER) return `"${name}" <${process.env.SMTP_USER}>`;
  return `"${name}" <noreply@foundit.app>`;
};

const sendVerificationEmail = async (email, name, code) => {
  try {
    const trans = getTransporter();
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

    const info = await trans.sendMail({
      from: getSenderEmail("FoundIT Team"),
      to: email,
      subject,
      html,
    });

    console.log(`[EMAIL SUCCESS] Verification email sent to ${email} (messageId: ${info?.messageId || "ok"})`);
    return info;
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send verification email to ${email}:`, err.message);
    // If connection dropped, refresh transporter for next attempt
    transporter = null;
    return null;
  }
};

const sendPasswordResetEmail = async (email, name, code) => {
  try {
    const trans = getTransporter();
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

    const info = await trans.sendMail({
      from: getSenderEmail("FoundIT Security"),
      to: email,
      subject,
      html,
    });

    console.log(`[EMAIL SUCCESS] Password reset email sent to ${email} (messageId: ${info?.messageId || "ok"})`);
    return info;
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send password reset email to ${email}:`, err.message);
    transporter = null;
    return null;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
