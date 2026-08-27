const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Ethereal auto-generated test SMTP for development
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (e) {
      console.log("Could not create Ethereal SMTP transporter:", e.message);
      // Fallback dummy logger transporter
      transporter = {
        sendMail: async (opts) => {
          console.log("\n--- [EMAIL OUTBOX] ---");
          console.log(`TO: ${opts.to}`);
          console.log(`SUBJECT: ${opts.subject}`);
          console.log(`BODY:\n${opts.text || opts.html}`);
          console.log("----------------------\n");
          return { messageId: "dummy-id" };
        },
      };
    }
  }

  return transporter;
};

const sendVerificationEmail = async (email, name, code) => {
  const trans = await getTransporter();
  const subject = "FoundIT - Verify Your Email Address";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; borderRadius: 12px;">
      <h2 style="color: #0b0c2a; text-align: center;">Welcome to FoundIT!</h2>
      <p>Hi ${name || "there"},</p>
      <p>Thank you for signing up for FoundIT. Please use the 6-digit verification code below to confirm your email address:</p>
      <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0b0c2a;">${code}</span>
      </div>
      <p style="color: #666; font-size: 13px;">This code will expire in 24 hours. If you did not create a FoundIT account, please ignore this email.</p>
    </div>
  `;

  const info = await trans.sendMail({
    from: '"FoundIT Team" <bereket2356@gmail.com>',
    to: email,
    subject,
    html,
  });

  if (nodemailer.getTestMessageUrl && info) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(
        `\n📬 [VERIFICATION EMAIL SENT] Preview URL: ${previewUrl}\n`,
      );
    }
  }

  return info;
};

const sendPasswordResetEmail = async (email, name, code) => {
  const trans = await getTransporter();
  const subject = "FoundIT - Password Reset Request";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; borderRadius: 12px;">
      <h2 style="color: #0b0c2a; text-align: center;">Reset Your Password</h2>
      <p>Hi ${name || "there"},</p>
      <p>We received a request to reset your FoundIT password. Use the 6-digit code below to set a new password:</p>
      <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0b0c2a;">${code}</span>
      </div>
      <p style="color: #666; font-size: 13px;">This code will expire in 30 minutes. If you did not request a password reset, you can safely ignore this message.</p>
    </div>
  `;

  const info = await trans.sendMail({
    from: '"FoundIT Security" <bereket2356@gmail.com>',
    to: email,
    subject,
    html,
  });

  if (nodemailer.getTestMessageUrl && info) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(
        `\n🔑 [PASSWORD RESET EMAIL SENT] Preview URL: ${previewUrl}\n`,
      );
    }
  }

  return info;
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
