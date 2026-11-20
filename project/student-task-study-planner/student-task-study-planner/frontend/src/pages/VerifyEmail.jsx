import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { BookOpen, CheckCircle2, XCircle, Loader, Lock, Eye, EyeOff, AlertCircle, ShieldCheck } from "lucide-react";
import { api } from "../api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  // status: "checking" | "setPassword" | "verified" | "error"
  const [status, setStatus] = useState("checking");
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Resend state for expired/invalid tokens
  const [resendEmail, setResendEmail] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("No activation token was found in this link. Please check your email or request a new one.");
      return;
    }

    api.checkVerificationToken(token)
      .then((data) => {
        setUserInfo(data.user || { name: "", email: "" });
        setResendEmail(data.user?.email || "");
        setStatus("setPassword");
      })
      .catch((err) => {
        setStatus("error");
        setError(err.message || "This activation link is invalid or has expired.");
      });
  }, [token]);

  async function handleCompleteSignup(e) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (password !== confirm) {
      return setError("Passwords do not match.");
    }

    setSubmitting(true);
    try {
      await api.completeSignup({ token, password });
      setStatus("verified");
    } catch (err) {
      setError(err.message || "Failed to set password. Link may have expired.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend(e) {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResending(true);
    setResendMsg("");
    try {
      const data = await api.resendVerification(resendEmail.trim());
      setResendMsg(data.message || "A new activation link has been sent!");
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand" style={{ justifyContent: "center" }}>
          <BookOpen size={28} /><span>study<span className="brand-accent">flow</span></span>
        </div>

        {/* ── 1. Checking Token State ──────────────────────────────── */}
        {status === "checking" && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <Loader size={44} className="spin-icon" style={{ color: "#7568d8", margin: "16px auto" }} />
            <p style={{ color: "#66667a" }}>Validating your activation link…</p>
          </div>
        )}

        {/* ── 2. Set Password Form (Step 2 of Signup) ─────────────── */}
        {status === "setPassword" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                width: 50, height: 50, borderRadius: "50%", background: "#eef2ff",
                color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px"
              }}>
                <ShieldCheck size={26} />
              </div>
              <h1 className="auth-title">Create your password</h1>
              <p className="auth-subtitle">
                Welcome, <strong>{userInfo.name || "Student"}</strong> ({userInfo.email})!
                <br />Choose a password to activate and secure your account.
              </p>
            </div>

            {error && (
              <div className="auth-error" style={{ marginBottom: 14 }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleCompleteSignup} className="auth-form">
              <label className="auth-label">
                <span>Password</span>
                <div className="auth-input-wrap">
                  <Lock size={17} className="auth-icon" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    autoFocus
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowPass((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <label className="auth-label">
                <span>Confirm password</span>
                <div className="auth-input-wrap">
                  <Lock size={17} className="auth-icon" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </label>

              <button className="auth-submit" disabled={submitting} style={{ marginTop: 8 }}>
                {submitting ? "Activating account…" : "Set Password & Activate Account"}
              </button>
            </form>
          </>
        )}

        {/* ── 3. Success: Verified & Ready ────────────────────────── */}
        {status === "verified" && (
          <div style={{ textAlign: "center" }}>
            <CheckCircle2 size={56} style={{ color: "#4caa84", margin: "8px auto 16px", display: "block" }} />
            <h2 className="auth-title">Account Verified! 🎉</h2>
            <p className="auth-subtitle" style={{ marginBottom: 24 }}>
              Your password has been created and your account is now fully verified.
              <br />You're all set to begin planning your studies.
            </p>
            <button className="auth-submit" onClick={() => navigate("/")}>
              Go to Login
            </button>
          </div>
        )}

        {/* ── 4. Error: Invalid / Expired Link ────────────────────── */}
        {status === "error" && (
          <div style={{ textAlign: "center" }}>
            <XCircle size={52} style={{ color: "#d35e6c", margin: "8px auto 16px", display: "block" }} />
            <h2 className="auth-title" style={{ color: "#d35e6c" }}>Activation Link Expired</h2>
            <p style={{ color: "#66667a", fontSize: 13, marginBottom: 20 }}>{error}</p>

            <p style={{ fontSize: 12, color: "#9292a5", marginBottom: 10 }}>Need a new activation link?</p>
            <form onSubmit={handleResend} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="Enter your email"
                required
                style={{ flex: 1, border: "1px solid #e5e5ef", borderRadius: 8, padding: "9px 12px", fontSize: 13 }}
              />
              <button className="auth-submit" disabled={resending} style={{ width: "auto", padding: "9px 16px" }}>
                {resending ? "…" : "Resend Link"}
              </button>
            </form>

            {resendMsg && (
              <p style={{ fontSize: 12, color: "#4caa84", marginBottom: 12 }}>
                ✓ {resendMsg}
              </p>
            )}

            <button className="auth-link" onClick={() => navigate("/")} style={{ display: "block", margin: "0 auto" }}>
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

