import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  function change(e) { setForm((f) => ({ ...f, [e.target.name]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    setError(""); setUnverified(false); setLoading(true);
    try {
      const { token, user } = await api.login({ email: form.email, password: form.password });
      login(user, token);
    } catch (err) {
      if (err.message?.includes("verify")) setUnverified(true);
      setError(err.message);
    } finally { setLoading(false); }
  }

  async function resendVerification() {
    try {
      await api.resendVerification(form.email);
      setResent(true);
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <BookOpen size={28} /><span>study<span className="brand-accent">flow</span></span>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Log in to continue planning your studies.</p>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} /> {error}
            {unverified && !resent && (
              <button onClick={resendVerification} className="auth-link" style={{ marginLeft: 8, fontSize: 11 }}>
                Resend verification email
              </button>
            )}
            {resent && <span style={{ marginLeft: 8, fontSize: 11, color: "#4caa84" }}>✓ Sent!</span>}
          </div>
        )}

        <form onSubmit={submit} className="auth-form">
          <label className="auth-label">
            <span>Email address</span>
            <div className="auth-input-wrap">
              <Mail size={17} className="auth-icon" />
              <input name="email" type="email" value={form.email} onChange={change}
                placeholder="you@example.com" required autoFocus autoComplete="email" />
            </div>
          </label>

          <label className="auth-label">
            <span>Password</span>
            <div className="auth-input-wrap">
              <Lock size={17} className="auth-icon" />
              <input name="password" type={showPass ? "text" : "password"} value={form.password}
                onChange={change} placeholder="Your password" required autoComplete="current-password" />
              <button type="button" className="auth-eye" onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <div style={{ textAlign: "right", marginBottom: 4 }}>
            <button type="button" className="auth-link" style={{ fontSize: 11 }}
              onClick={() => navigate("/forgot-password")}>
              Forgot password?
            </button>
          </div>

          <button className="auth-submit" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account?{" "}
          <button onClick={() => navigate("/signup")} className="auth-link">Sign up</button>
        </p>
      </div>
    </div>
  );
}
