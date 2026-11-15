import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

function getTransporter() {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "");

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 7000
  });
}

async function sendViaGoogleScript(to, subject, html) {
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL?.trim();
  if (!scriptUrl) return null;

  const res = await fetch(scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ to, subject, html }),
    redirect: "follow"
  });

  const data = await res.json().catch(() => ({}));
  if (data?.status === "error") {
    throw new Error(data.message || "Google Script mail error");
  }
  return data;
}

async function sendViaBrevo(toEmail, toName, subject, html) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) return null;

  const senderEmail = process.env.EMAIL_USER?.trim() || "mehtaayush141106@gmail.com";
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: "StudyFlow",
        email: senderEmail
      },
      to: [{ email: toEmail, name: toName || toEmail }],
      subject,
      htmlContent: html
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Brevo error HTTP ${res.status}`);
  }
  return data;
}

async function sendViaResend(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "StudyFlow <onboarding@resend.dev>",
      to: [to],
      subject,
      html
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Resend error HTTP ${res.status}`);
  }
  return data;
}

function getFromAddress() {
  return process.env.EMAIL_FROM || `"StudyFlow" <${process.env.EMAIL_USER?.trim()}>`;
}

function getClientUrl() {
  return process.env.CLIENT_URL || "http://localhost:5173";
}

// ── Shared email shell ──────────────────────────────────────────────────────
function shell(title, body) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8"/>
    <style>
      body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f5fb;margin:0;padding:0}
      .wrap{max-width:520px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(36,36,58,.08);overflow:hidden}
      .header{background:#6558d3;padding:32px 36px 24px;text-align:center}
      .header h1{color:#fff;font-size:22px;margin:0;letter-spacing:-.5px}
      .header p{color:#cbc4f7;font-size:13px;margin:6px 0 0}
      .body{padding:32px 36px}
      .body p{color:#44445a;font-size:14px;line-height:1.7;margin:0 0 16px}
      .btn{display:inline-block;padding:13px 28px;background:#6558d3;color:#fff!important;border-radius:9px;text-decoration:none;font-weight:700;font-size:14px;margin:8px 0 20px}
      .note{font-size:12px!important;color:#9292a5!important}
      .footer{background:#f8f8fc;padding:18px 36px;text-align:center;font-size:11px;color:#aaaab8}
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="header">
        <h1>📚 StudyFlow</h1>
        <p>Student Task & Study Planner</p>
      </div>
      <div class="body">
        <h2 style="margin:0 0 16px;color:#1e1e30;font-size:18px">${title}</h2>
        ${body}
      </div>
      <div class="footer">© 2024 StudyFlow · You received this because you signed up at StudyFlow.</div>
    </div>
  </body>
  </html>`;
}

// ── Send verification email ─────────────────────────────────────────────────
export async function sendVerificationEmail(user, token) {
  const link = `${getClientUrl()}/verify-email?token=${token}`;
  const subject = "✅ Verify your StudyFlow account";
  const html = shell(
    `Hi ${user.name}, please verify your email`,
    `<p>Thanks for signing up! Click the button below to activate your StudyFlow account. This link expires in <strong>24 hours</strong>.</p>
     <a href="${link}" class="btn">Verify my account</a>
     <p class="note">If the button doesn't work, copy this link:<br/><a href="${link}">${link}</a></p>
     <p class="note">If you didn't create an account, you can safely ignore this email.</p>`
  );

  console.log(`[Email] Sending verification email to ${user.email}...`);

  // 1. Try Google Apps Script Webhook (Zero signup, sends from your real Gmail via HTTPS)
  if (process.env.GOOGLE_SCRIPT_URL) {
    const gRes = await sendViaGoogleScript(user.email, subject, html);
    console.log(`[Email] Verification email sent via Google Script to ${user.email}`);
    return gRes;
  }

  // 2. Try Brevo HTTPS API (port 443)
  if (process.env.BREVO_API_KEY) {
    const brevoRes = await sendViaBrevo(user.email, user.name, subject, html);
    console.log(`[Email] Verification email sent via Brevo API to ${user.email}`);
    return brevoRes;
  }

  // 3. Try Resend HTTPS API (port 443)
  if (process.env.RESEND_API_KEY) {
    const resendRes = await sendViaResend(user.email, subject, html);
    console.log(`[Email] Verification email sent via Resend API to ${user.email}`);
    return resendRes;
  }

  // Fallback to Nodemailer SMTP
  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: getFromAddress(),
    to: user.email,
    subject,
    html
  });
  console.log(`[Email] Verification email sent successfully to ${user.email} (MessageId: ${info.messageId})`);
  return info;
}

// ── Send password reset email ───────────────────────────────────────────────
export async function sendPasswordResetEmail(user, token) {
  const link = `${getClientUrl()}/reset-password?token=${token}`;
  const subject = "🔑 Reset your StudyFlow password";
  const html = shell(
    `Password reset request`,
    `<p>Hi <strong>${user.name}</strong>, we received a request to reset your password.</p>
     <p>Click the button below. This link expires in <strong>1 hour</strong>.</p>
     <a href="${link}" class="btn">Reset my password</a>
     <p class="note">If the button doesn't work, copy this link:<br/><a href="${link}">${link}</a></p>
     <p class="note">If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>`
  );

  console.log(`[Email] Sending password reset email to ${user.email}...`);

  // 1. Try Google Apps Script Webhook (Zero signup, sends from your real Gmail via HTTPS)
  if (process.env.GOOGLE_SCRIPT_URL) {
    const gRes = await sendViaGoogleScript(user.email, subject, html);
    console.log(`[Email] Password reset email sent via Google Script to ${user.email}`);
    return gRes;
  }

  // 2. Try Brevo HTTPS API (port 443)
  if (process.env.BREVO_API_KEY) {
    const brevoRes = await sendViaBrevo(user.email, user.name, subject, html);
    console.log(`[Email] Password reset email sent via Brevo API to ${user.email}`);
    return brevoRes;
  }

  // 3. Try Resend HTTPS API (port 443)
  if (process.env.RESEND_API_KEY) {
    const resendRes = await sendViaResend(user.email, subject, html);
    console.log(`[Email] Password reset email sent via Resend API to ${user.email}`);
    return resendRes;
  }

  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: getFromAddress(),
    to: user.email,
    subject,
    html
  });
  console.log(`[Email] Password reset email sent successfully to ${user.email} (MessageId: ${info.messageId})`);
  return info;
}

// ── Verify transporter (called at server start) ─────────────────────────────
export async function verifyMailer() {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "");

  if (!user || user === "your_gmail@gmail.com" || !pass || pass === "your_16_char_app_password") {
    console.warn("⚠️  Email not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env");
    return false;
  }
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log(`✉️  Email service ready & verified (${user})`);
    return true;
  } catch (err) {
    console.warn("⚠️  Email transporter error:", err.message);
    return false;
  }
}
