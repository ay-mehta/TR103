import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/emailService.js";

function generateJWT(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// ── Register ────────────────────────────────────────────────────────────────
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ message: "Name, email and password are required." });

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      if (user.isVerified) {
        return res.status(409).json({ message: "An account with that email already exists. Please log in." });
      }
      // If user registered earlier but wasn't verified, update their info and re-issue token
      user.name = name.trim();
      user.password = password; // Will be hashed by pre-save hook
      const token = user.generateToken();
      user.verificationToken = token;
      user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await user.save();

      await sendVerificationEmail(user, token);
      return res.status(200).json({
        message: "A verification email has been sent! Please check your inbox to activate your account."
      });
    }

    user = new User({ name: name.trim(), email: cleanEmail, password });
    const token = user.generateToken();
    user.verificationToken = token;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await user.save();

    await sendVerificationEmail(user, token);

    res.status(201).json({
      message: "Account created! Please check your email to verify your account before logging in."
    });
  } catch (error) {
    console.error("Registration error:", error);
    next(error);
  }
}

// ── Verify Email ────────────────────────────────────────────────────────────
export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Verification token is missing." });

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() }
    });
    if (!user)
      return res.status(400).json({ message: "This verification link is invalid or has expired." });

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    res.json({ message: "Email verified! You can now log in." });
  } catch (error) { next(error); }
}

// ── Resend verification ─────────────────────────────────────────────────────
export async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: "No account found with that email." });
    if (user.isVerified) return res.status(400).json({ message: "This account is already verified." });

    const token = user.generateToken();
    user.verificationToken = token;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(user, token);

    res.json({ message: "A new verification email has been sent. Please check your inbox." });
  } catch (error) { next(error); }
}

// ── Login ───────────────────────────────────────────────────────────────────
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password)
      return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Incorrect email or password." });

    if (!user.isVerified)
      return res.status(403).json({
        message: "Please verify your email before logging in.",
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

    await sendPasswordResetEmail(user, token);

    res.json({ message: "If that email exists, a reset link has been sent." });
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
