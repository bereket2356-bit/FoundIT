const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { protect } = require("../middleware/authMiddleware");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../utils/email");

const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to generate 6-digit random code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 🟢 SIGNUP (Public: Forces role to "user", requires email verification)
router.post("/signup", async (req, res) => {
  let { name, email, password } = req.body;
  if (email) email = email.trim().toLowerCase();

  try {
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationCode = generateCode();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    let user = await User.findOne({ email });

    if (user) {
      if (user.isVerified) {
        return res.status(400).json({
          message: "User with this email already exists. Please log in.",
        });
      }

      // Existing unverified account -> update details and re-send code
      user.name = name.trim();
      user.password = hashedPassword;
      user.verificationToken = verificationCode;
      user.verificationTokenExpires = verificationExpires;
      user.lastVerificationResend = new Date();
      await user.save();
    } else {
      user = await User.create({
        name: name.trim(),
        email,
        password: hashedPassword,
        role: "user",
        authProvider: "local",
        isVerified: false,
        verificationToken: verificationCode,
        verificationTokenExpires: verificationExpires,
        lastVerificationResend: new Date(),
      });
    }

    // Send verification email immediately
    await sendVerificationEmail(user.email, user.name, verificationCode);

    res.status(201).json({
      message:
        "Account created! Please check your email for the 6-digit verification code.",
      email: user.email,
      requiresVerification: true,
    });
  } catch (error) {
    console.error("[AUTH SIGNUP ERROR]", error);
    res.status(500).json({ message: error.message });
  }
});

// 🟢 VERIFY EMAIL
router.post("/verify-email", async (req, res) => {
  let { email, token } = req.body;
  if (email) email = email.trim().toLowerCase();
  if (token) token = token.trim();

  try {
    if (!email || !token) {
      return res
        .status(400)
        .json({ message: "Email and verification code are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    if (user.isVerified) {
      const jwtToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );
      return res.json({
        message: "Email is already verified.",
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
        token: jwtToken,
      });
    }

    if (
      user.verificationToken !== token ||
      !user.verificationTokenExpires ||
      user.verificationTokenExpires < new Date()
    ) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code." });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Email verified successfully!",
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || "",
      token: jwtToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🟢 RESEND VERIFICATION CODE (Rate limited: 60 seconds cooldown)
router.post("/resend-verification", async (req, res) => {
  let { email } = req.body;
  if (email) email = email.trim().toLowerCase();

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ message: "Account is already verified. You can log in." });
    }

    // Rate limiting: 60-second cooldown
    if (user.lastVerificationResend) {
      const diffMs =
        Date.now() - new Date(user.lastVerificationResend).getTime();
      if (diffMs < 60 * 1000) {
        const remainingSec = Math.ceil((60 * 1000 - diffMs) / 1000);
        return res.status(429).json({
          message: `Please wait ${remainingSec} seconds before requesting another code.`,
        });
      }
    }

    const verificationCode = generateCode();
    user.verificationToken = verificationCode;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.lastVerificationResend = new Date();
    await user.save();

    await sendVerificationEmail(user.email, user.name, verificationCode);

    res.json({
      message: "A new 6-digit verification code has been sent to your email.",
    });
  } catch (error) {
    console.error("[RESEND VERIFICATION ERROR]", error);
    res.status(500).json({ message: error.message });
  }
});

// 🟢 LOGIN (Enforces email verification for local users)
router.post("/login", async (req, res) => {
  let { email, password } = req.body;
  if (email) email = email.trim().toLowerCase();

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    if (user.authProvider === "local" && user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password." });
      }
    }

    // Check verification status for local accounts (exempt admins)
    if (
      user.authProvider === "local" &&
      !user.isVerified &&
      user.role !== "admin"
    ) {
      return res.status(401).json({
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email before logging in.",
        email: user.email,
      });
    }

    if (user.role === "admin" && !user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || "",
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🟢 GOOGLE AUTH (Signup & Login)
router.post("/google", async (req, res) => {
  let { idToken, email, name, avatar } = req.body;

  try {
    // If idToken is provided, verify it against GOOGLE_CLIENT_ID from .env
    if (idToken) {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (payload) {
        email = payload.email;
        name = payload.name || name;
        avatar = payload.picture || avatar;
      }
    }

    if (email) email = email.trim().toLowerCase();

    if (!email) {
      return res
        .status(400)
        .json({ message: "Google account email is required." });
    }

    let user = await User.findOne({ email });

    if (user) {
      // User exists -> auto verify if needed & update avatar/provider
      if (!user.isVerified) user.isVerified = true;
      if (!user.avatar && avatar) user.avatar = avatar;
      await user.save();
    } else {
      // Create new Google user
      user = await User.create({
        name: name || "Google User",
        email,
        role: "user",
        authProvider: "google",
        isVerified: true,
        avatar: avatar || "",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || "",
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🟢 FORGOT PASSWORD (Generic response for security, protects Google-only users)
router.post("/forgot-password", async (req, res) => {
  let { email } = req.body;
  if (email) email = email.trim().toLowerCase();

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });

    // Protect Google-only accounts
    if (user && user.authProvider === "google" && !user.password) {
      return res.status(400).json({
        message:
          "This account uses Google Sign-In. Please log in with Google instead.",
      });
    }

    if (user) {
      const resetCode = generateCode();
      user.resetPasswordToken = resetCode;
      user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      await user.save();

      await sendPasswordResetEmail(user.email, user.name, resetCode);
    }

    // Generic response to prevent email enumeration
    res.json({
      message:
        "If an account exists with this email, a 6-digit reset code has been sent.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🟢 RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  let { email, token, newPassword } = req.body;
  if (email) email = email.trim().toLowerCase();
  if (token) token = token.trim();

  try {
    if (!email || !token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, reset code, and new password are required." });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters." });
    }

    const user = await User.findOne({ email });

    if (
      !user ||
      user.resetPasswordToken !== token ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset code." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.isVerified = true;
    await user.save();

    res.json({
      message:
        "Password reset successfully! You can now log in with your new password.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🟢 GET CURRENT USER PROFILE
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🟢 UPDATE PROFILE (Name & Avatar)
router.patch("/profile", protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;

    if (name !== undefined) {
      if (!name || name.trim().length < 2 || name.trim().length > 30) {
        return res.status(400).json({
          message: "Username must be between 2 and 30 characters.",
        });
      }
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name !== undefined) user.name = name.trim();
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || "",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🔍 DIAGNOSTIC: TEST EMAIL CONFIGURATION
router.get("/test-email", async (req, res) => {
  const targetEmail = req.query.email || process.env.SMTP_USER || "bereket2356@gmail.com";
  const smtpUserConfigured = Boolean(process.env.SMTP_USER);
  const smtpPassConfigured = Boolean(process.env.SMTP_PASS);

  try {
    const result = await sendVerificationEmail(targetEmail, "Diagnostic Test", "999888");
    if (result && result.messageId) {
      return res.json({
        status: "success",
        message: `Email successfully dispatched to ${targetEmail}`,
        messageId: result.messageId,
        smtpConfig: {
          host: process.env.SMTP_HOST || "default",
          user: process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 3)}***` : "MISSING",
          passConfigured: smtpPassConfigured,
        },
      });
    } else {
      return res.status(500).json({
        status: "error",
        message: "sendVerificationEmail returned null or fallback logger was used.",
        smtpConfig: {
          smtpUserConfigured,
          smtpPassConfigured,
        },
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "exception",
      error: error.message,
      smtpConfig: {
        smtpUserConfigured,
        smtpPassConfigured,
      },
    });
  }
});

module.exports = router;
