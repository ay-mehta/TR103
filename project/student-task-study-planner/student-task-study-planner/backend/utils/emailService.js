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

  // 1. Try POST with text/plain body
  try {
    const res = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: JSON.stringify({ to, subject, html }),
      redirect: "follow"
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch {}
    if (data && (data.status === "success" || data.ok)) {
      console.log(`[Google Script] POST email delivered to ${to}`);
      return data;
    }
  } catch (err) {
    console.warn("⚠️ Google Script POST attempt failed, trying GET fallback:", err.message);
  }

  // 2. Try GET with query parameters (bypasses 302 payload-dropping redirect)
  try {
    const getUrl = new URL(scriptUrl);
    getUrl.searchParams.set("to", to);
    getUrl.searchParams.set("subject", subject);
    getUrl.searchParams.set("html", html);

    const getRes = await fetch(getUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      redirect: "follow"
    });

    const getText = await getRes.text();
    let getData;
    try { getData = JSON.parse(getText); } catch {}
    if (getData && (getData.status === "success" || getData.ok)) {
      console.log(`[Google Script] GET email delivered to ${to}`);
      return getData;
    }

    if (getText.includes("accounts.google.com") || getText.includes("<html")) {
      throw new Error("Google Script is requiring login. In Google Script: Deploy -> Manage Deployments -> Edit -> set 'Who has access' to 'Anyone'");
    }
    throw new Error(`Google Script returned: ${getText.slice(0, 100)}`);
  } catch (err) {
    throw new Error(`Google Script error: ${err.message}`);
  }
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

export function getClientUrl() {
  let url = (process.env.CLIENT_URL || "http://localhost:5173").trim().replace(/\/+$/, "");
  if (url === "*" || url === "http://*" || url === "https://*") {
    console.warn("⚠️ CLIENT_URL is set to '*'! Please set CLIENT_URL in Render to your actual Netlify URL (e.g. https://<site>.netlify.app).");
    return "http://localhost:5173";
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url;
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

// ── Unified Email Pipeline with Resend Priority & Automatic Fallback ───────
async function sendMailPipeline({ to, name, subject, html }) {
  let lastError = null;

  // 1. Primary: Try Resend HTTPS API (port 443)
  if (process.env.RESEND_API_KEY) {
    try {
      const resendRes = await sendViaResend(to, subject, html);
      console.log(`[Email] Successfully delivered via Resend API to ${to}`);
      return resendRes;
    } catch (err) {
      console.warn(`⚠️ Resend API failed for ${to}:`, err.message);
      lastError = err;
    }
  }

  // 2. Secondary: Try Google Apps Script Webhook
  if (process.env.GOOGLE_SCRIPT_URL) {
    try {
      const gRes = await sendViaGoogleScript(to, subject, html);
      console.log(`[Email] Successfully delivered via Google Script to ${to}`);
      return gRes;
    } catch (err) {
      console.warn(`⚠️ Google Script failed for ${to}:`, err.message);
      lastError = err;
    }
  }

  // 3. Tertiary: Try Brevo HTTPS API (port 443)
  if (process.env.BREVO_API_KEY) {
    try {
      const brevoRes = await sendViaBrevo(to, name, subject, html);
      console.log(`[Email] Successfully delivered via Brevo API to ${to}`);
      return brevoRes;
    } catch (err) {
      console.warn(`⚠️ Brevo API failed for ${to}:`, err.message);
      lastError = err;
    }
  }

  // 4. Fallback: Nodemailer SMTP
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject,
      html
    });
    console.log(`[Email] Delivered via Nodemailer SMTP to ${to} (MessageId: ${info.messageId})`);
    return info;
  } catch (err) {
    console.warn(`⚠️ Nodemailer SMTP failed for ${to}:`, err.message);
    lastError = err;
  }

  throw lastError || new Error("All configured email providers failed to deliver.");
}

// ── Send verification email ─────────────────────────────────────────────────
export async function sendVerificationEmail(user, token) {
  const link = `${getClientUrl()}/verify-email?token=${token}`;
  const subject = "✅ Activate your StudyFlow account & set your password";
  const html = shell(
    `Welcome to StudyFlow, ${user.name}!`,
    `<p>Thanks for starting your registration at StudyFlow.</p>
     <p>To confirm that you own this email address and complete your account setup, click the button below to choose your password and activate your account. This link expires in <strong>24 hours</strong>.</p>
     <a href="${link}" class="btn">Set Password & Activate Account</a>
     <p class="note">If the button doesn't work, copy this link into your browser:<br/><a href="${link}">${link}</a></p>
     <p class="note">If you did not sign up for StudyFlow, you can safely ignore this email. No account will be created without setting a password.</p>`
  );

  console.log(`[Email] Dispatching activation email to ${user.email}...`);
  return await sendMailPipeline({ to: user.email, name: user.name, subject, html });
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

  console.log(`[Email] Dispatching password reset email to ${user.email}...`);
  return await sendMailPipeline({ to: user.email, name: user.name, subject, html });
}

// ── Send account deletion confirmation email ────────────────────────────────
export async function sendDeleteAccountEmail(user, token) {
  const link = `${getClientUrl()}/delete-account?token=${token}`;
  const subject = "⚠️ Confirm StudyFlow Account Deletion";
  const html = shell(
    `Confirm Account Deletion`,
    `<p>Hi <strong>${user.name}</strong>, we received a request to permanently delete your StudyFlow account.</p>
     <p style="color:#d93025;font-weight:600;">⚠️ This action is permanent and cannot be undone. All your tasks, study progress, and data will be erased from our database.</p>
     <p>If you requested this, click the button below and confirm with your username and password. This link expires in <strong>1 hour</strong>.</p>
     <a href="${link}" class="btn" style="background:#e53e3e;">Confirm Account Deletion</a>
     <p class="note">If the button doesn't work, copy this link:<br/><a href="${link}">${link}</a></p>
     <p class="note">If you did not request this, please ignore this email. Your account remains safe and active.</p>`
  );

  console.log(`[Email] Dispatching account deletion email to ${user.email}...`);
  return await sendMailPipeline({ to: user.email, name: user.name, subject, html });
}

// ── Verify transporter (called at server start) ─────────────────────────────
export async function verifyMailer() {
  if (process.env.RESEND_API_KEY) {
    console.log("✉️  Email service active via Resend HTTPS API");
    return true;
  }
  if (process.env.GOOGLE_SCRIPT_URL) {
    console.log("✉️  Email service active via Google Apps Script Webhook");
    return true;
  }
  if (process.env.BREVO_API_KEY) {
    console.log("✉️  Email service active via Brevo HTTPS API");
    return true;
  }

  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "");

  if (!user || user === "your_gmail@gmail.com" || !pass || pass === "your_16_char_app_password") {
    console.warn("⚠️  Email not configured. Set RESEND_API_KEY or EMAIL_USER/EMAIL_PASS in backend/.env");
    return false;
  }
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log(`✉️  Email service ready & verified via Nodemailer (${user})`);
    return true;
  } catch (err) {
    console.warn("⚠️  Email transporter error:", err.message);
    return false;
  }
}
