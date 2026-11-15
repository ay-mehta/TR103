import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "../api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetLink, setResetLink] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await api.forgotPassword(email);
      if (data?.resetLink) {
        setResetLink(data.resetLink);
      }
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <BookOpen size={28} /><span>study<span className="brand-accent">flow</span></span>
        </div>

        {sent ? (
          <>
            <CheckCircle2 size={48} style={{ color: "#4caa84", display: "block", margin: "4px 0 14px" }} />
            <h1 className="auth-title">Password Reset Requested</h1>
            <p className="auth-subtitle">If <strong>{email}</strong> is registered, a reset link was generated (valid for 1 hour).</p>
            
            {resetLink ? (
              <div style={{ background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: 10, padding: "14px 16px", margin: "16px 0", textAlign: "left" }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#6366f1" }}>
                  💡 Demo/Cloud Fallback:
                </p>
                <p style={{ margin: "0 0 12px", fontSize: 12, color: "#9292a5", lineHeight: 1.5 }}>
                  Outbound SMTP ports are blocked on free cloud hosts. You can test your reset link directly below:
                </p>
                <a href={resetLink} className="auth-submit" style={{ display: "block", textAlign: "center", textDecoration: "none", padding: "10px 16px", fontSize: 13 }}>
                  👉 Click Here to Reset Password
                </a>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "#9292a5", marginTop: 8 }}>Didn't receive it? Check your spam folder or try again.</p>
            )}

            <button className="auth-submit" style={{ marginTop: 20, background: "transparent", border: "1px solid #3b3f54", color: "#e2e8f0" }} onClick={() => navigate("/")}>Back to Login</button>
          </>
        ) : (
          <>
            <h1 className="auth-title">Forgot password?</h1>
            <p className="auth-subtitle">Enter your email and we'll send you a reset link.</p>

            {error && <div className="auth-error"><AlertCircle size={16} /> {error}</div>}

            <form onSubmit={submit} className="auth-form">
              <label className="auth-label">
                <span>Email address</span>
                <div className="auth-input-wrap">
                  <Mail size={17} className="auth-icon" />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" required autoFocus
                  />
                </div>
              </label>
              <button className="auth-submit" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <p className="auth-switch">
              <button onClick={() => navigate("/")} className="auth-link">← Back to Login</button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

