import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "../api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await api.forgotPassword(email);
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
            <h1 className="auth-title">Check your inbox</h1>
            <p className="auth-subtitle">If <strong>{email}</strong> is registered, we've sent a reset link. It expires in 1 hour.</p>
            <p style={{ fontSize: 12, color: "#9292a5", marginTop: 8 }}>Didn't receive it? Check your spam folder or try again.</p>
            <button className="auth-submit" style={{ marginTop: 20 }} onClick={() => navigate("/")}>Back to Login</button>
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

