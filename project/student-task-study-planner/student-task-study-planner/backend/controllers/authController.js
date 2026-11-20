import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Task from "../models/Task.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendDeleteAccountEmail,
  getClientUrl
} from "../utils/emailService.js";

function generateJWT(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// ── Register (Step 1: Enter Username & Email, sends verification email) ──────
export async function register(req, res, next) {
  try {
    const { name, email } = req.body;
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ message: "Name and email are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      if (user.isVerified) {
        return res.status(409).json({ message: "An account with that email already exists. Please log in." });
      }
      // If user registered earlier but wasn't verified, update their name and issue fresh token
      user.name = name.trim();
      const token = user.generateToken();
      user.verificationToken = token;
      user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
      await user.save();

      let emailSent = false;
      try {
        await sendVerificationEmail(user, token);
        emailSent = true;
      } catch (emailErr) {
        console.warn("⚠️ Verification email failed to send:", emailErr.message);
      }

      const clientUrl = getClientUrl();
      const verifyLink = `${clientUrl}/verify-email?token=${token}`;

      if (!emailSent) {
        console.log(`[DEMO FALLBACK] Verification link for ${user.email}: ${verifyLink}`);
        return res.status(200).json({
          message: "A verification link has been generated. Use the link below to set your password and activate your account.",
          verifyLink,
          emailSent: false
        });
      }

      return res.status(200).json({
        message: "A verification email has been sent! Please check your inbox to set your password and activate your account.",
        emailSent: true
      });
    }

    // New unverified registration (password is set in step 2 via email link)
    user = new User({ name: name.trim(), email: cleanEmail, isVerified: false });
    const token = user.generateToken();
    user.verificationToken = token;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await user.save();

    let emailSent = false;
    try {
      await sendVerificationEmail(user, token);
      emailSent = true;
    } catch (emailErr) {
      console.warn("⚠️ Verification email failed to send:", emailErr.message);
    }

    const clientUrl = getClientUrl();
    const verifyLink = `${clientUrl}/verify-email?token=${token}`;

    if (!emailSent) {
      console.log(`[DEMO FALLBACK] Verification link for ${user.email}: ${verifyLink}`);
      return res.status(201).json({
        message: "A verification link has been generated. Use the link below to set your password and activate your account.",
        verifyLink,
        emailSent: false
      });
    }

    res.status(201).json({
      message: "A verification email has been sent! Please check your inbox to set your password and activate your account.",
      emailSent: true
    });
  } catch (error) {
    console.error("Registration error:", error);
    next(error);
  }
}

// ── Check Verification Token (Step 2: Validate link before asking for password) ─
export async function checkVerificationToken(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Verification token is missing." });

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "This activation link is invalid or has expired." });
    }

    res.json({
      valid: true,
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
}

export const verifyEmail = checkVerificationToken;

// ── Complete Signup (Step 3: User sets password -> verify and activate) ──────
export async function completeSignup(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token) return res.status(400).json({ message: "Verification token is missing." });
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "This activation link is invalid or has expired." });
    }

    // Set password and mark verified
    user.password = password; // Automatically hashed by userSchema.pre("save")
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    console.log(`[Registration] Account verified & password set for ${user.email}`);

    const jwtToken = generateJWT(user._id);
    res.json({
      message: "Account verified! Your password has been set successfully.",
      token: jwtToken,
      user: { _id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    next(error);
  }
}

// ── Resend verification ─────────────────────────────────────────────────────
export async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: "No account found with that email." });
    if (user.isVerified) return res.status(400).json({ message: "This account is already verified. Please log in." });

    const token = user.generateToken();
    user.verificationToken = token;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    let emailSent = false;
    try {
      await sendVerificationEmail(user, token);
      emailSent = true;
    } catch (emailErr) {
      console.warn("⚠️ Resend verification failed:", emailErr.message);
    }

    const clientUrl = getClientUrl();
    const verifyLink = `${clientUrl}/verify-email?token=${token}`;

    if (!emailSent) {
      console.log(`[DEMO FALLBACK] Resend verification link for ${user.email}: ${verifyLink}`);
      return res.json({
        message: "A new activation link has been generated. Use the link below to set your password and activate your account.",
        verifyLink,
        emailSent: false
      });
    }

    res.json({ message: "A new verification email has been sent. Please check your inbox.", emailSent: true });
  } catch (error) { next(error); }
}

// ── Login ───────────────────────────────────────────────────────────────────
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password)
      return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.password || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Incorrect email or password." });

    if (!user.isVerified)
      return res.status(403).json({
        message: "Please verify your email and set your password before logging in.",
        unverified: true
      });

    const token = generateJWT(user._id);
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (error) { next(error); }
}

// ── Get current user ────────────────────────────────────────────────────────
export async function getMe(req, res) {
  res.json({ user: { _id: req.user._id, name: req.user.name, email: req.user.email } });
}

// ── Get profile ─────────────────────────────────────────────────────────────
export async function getProfile(req, res) {
  const user = await User.findById(req.user._id).select("-password -verificationToken -resetPasswordToken");
  res.json({ user });
}

// ── Update profile (name) ────────────────────────────────────────────────────
export async function updateProfile(req, res, next) {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Name cannot be empty." });
    if (name.trim().length > 60) return res.status(400).json({ message: "Name too long." });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ user: { _id: user._id, name: user.name, email: user.email } });
  } catch (error) { next(error); }
}

// ── Change password (while logged in) ───────────────────────────────────────
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Current and new passwords are required." });
    if (newPassword.length < 6)
      return res.status(400).json({ message: "New password must be at least 6 characters." });

    const user = await User.findById(req.user._id);
    if (!(await user.matchPassword(currentPassword)))
      return res.status(401).json({ message: "Current password is incorrect." });

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password changed successfully." });
  } catch (error) { next(error); }
}

// ── Forgot password ──────────────────────────────────────────────────────────
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always respond OK to prevent email enumeration
    if (!user) return res.json({ message: "If that email exists, a reset link has been sent." });

    const token = user.generateToken();
    user.resetPasswordToken = token;
    user.resetPasswordTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    let emailSent = false;
    try {
      await sendPasswordResetEmail(user, token);
      emailSent = true;
    } catch (emailErr) {
      console.warn("⚠️ Password reset email delivery failed:", emailErr.message);
    }

    const clientUrl = getClientUrl();
    const resetLink = `${clientUrl}/reset-password?token=${token}`;

    if (!emailSent) {
      console.log(`[DEMO FALLBACK] Reset link for ${user.email}: ${resetLink}`);
      return res.json({
        message: "If that email exists, a reset link has been sent.",
        resetLink,
        emailSent: false
      });
    }

    res.json({ message: "If that email exists, a reset link has been sent.", emailSent: true });
  } catch (error) { next(error); }
}

// ── Reset password ───────────────────────────────────────────────────────────
export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ message: "Token and new password are required." });
    if (newPassword.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters." });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpiry: { $gt: Date.now() }
    });
    if (!user)
      return res.status(400).json({ message: "This reset link is invalid or has expired." });

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiry = null;
    await user.save();

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (error) { next(error); }
}

// ── Delete Account (Direct credential verification, NO email required) ───────
export async function deleteAccount(req, res, next) {
  try {
    const { identifier, email, username, password, token } = req.body;
    const cred = (identifier || email || username || "").trim();

    if (!cred || !password) {
      return res.status(400).json({
        message: "Username/Email and password are required to delete your account."
      });
    }

    let user = null;

    // 1. If request is from an authenticated session (e.g. Profile modal)
    if (req.user?._id) {
      const authUser = await User.findById(req.user._id);
      if (authUser) {
        const matchesEmail = authUser.email.toLowerCase() === cred.toLowerCase();
        const matchesName = authUser.name.toLowerCase().trim() === cred.toLowerCase();
        if (matchesEmail || matchesName) {
          user = authUser;
        } else {
          return res.status(401).json({
            message: "Username or email does not match your currently logged-in account."
          });
        }
      }
    }

    // 2. If token is provided from any existing link
    if (!user && token) {
      user = await User.findOne({
        deleteAccountToken: token,
        deleteAccountTokenExpiry: { $gt: Date.now() }
      });
    }

    // 3. Direct lookup by email or username if not yet resolved
    if (!user) {
      const escaped = cred.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      user = await User.findOne({
        $or: [
          { email: cred.toLowerCase() },
          { name: { $regex: new RegExp(`^${escaped}$`, "i") } }
        ]
      });
    }

    if (!user) {
      return res.status(404).json({
        message: "No StudyFlow account was found with that username or email."
      });
    }

    // 4. Verify password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Incorrect password. Account deletion aborted."
      });
    }

    // 5. Cascade delete: Delete all tasks belonging to this user
    const deletedTasks = await Task.deleteMany({ user: user._id });
    console.log(`[Account Delete] Removed ${deletedTasks.deletedCount} tasks for user ${user.email} (${user._id})`);

    // 6. Delete user profile
    await User.findByIdAndDelete(user._id);
    console.log(`[Account Delete] User ${user.email} (${user._id}) permanently deleted from database.`);

    res.json({
      message: "Your StudyFlow account and all associated tasks have been permanently deleted."
    });
  } catch (error) {
    next(error);
  }
}

// ── Backwards compatibility stubs ───────────────────────────────────────────
export async function requestDeleteAccount(req, res) {
  res.json({
    message: "Direct account deletion is active. Please enter your username/password to confirm deletion.",
    direct: true
  });
}

export const confirmDeleteAccount = deleteAccount;

