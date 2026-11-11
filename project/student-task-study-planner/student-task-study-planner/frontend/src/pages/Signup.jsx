import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "../api";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  function change(e) { setForm((f) => ({ ...f, [e.target.name]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await api.register({ name: form.name, email: form.email, password: form.password });
      setSubmittedEmail(form.email);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  if (done) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div className="auth-brand" style={{ justifyContent: "center" }}>
            <BookOpen size={28} /><span>study<span className="brand-accent">flow</span></span>
          </div>
          <CheckCircle2 size={56} style={{ color: "#4caa84", display: "block", margin: "8px auto 16px" }} />
          <h1 className="auth-title">Check your inbox! 📬</h1>
          <p className="auth-subtitle">
            We've sent a verification email to <strong>{submittedEmail}</strong>.
            <br />Click the link in the email to activate your account.
          </p>
          <p style={{ fontSize: 12, color: "#9292a5", marginTop: 8, lineHeight: 1.6 }}>
            Didn't receive it? Check your spam folder.
            <br />The link expires in 24 hours.
          </p>
          <button className="auth-submit" style={{ marginTop: 24 }} onClick={() => navigate("/")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <BookOpen size={28} /><span>study<span className="brand-accent">flow</span></span>
        </div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start organising your academic life today.</p>

        {error && <div className="auth-error"><AlertCircle size={16} /> {error}</div>}

        <form onSubmit={submit} className="auth-form">
          <label className="auth-label">
            <span>Full name</span>
            <div className="auth-input-wrap">
              <User size={17} className="auth-icon" />
              <input name="name" type="text" value={form.name} onChange={change}
                placeholder="e.g. Priya Sharma" required autoFocus autoComplete="name" />
            </div>
          </label>

          <label className="auth-label">
            <span>Email address</span>
            <div className="auth-input-wrap">
              <Mail size={17} className="auth-icon" />
              <input name="email" type="email" value={form.email} onChange={change}
                placeholder="you@example.com" required autoComplete="email" />
            </div>
          </label>

          <label className="auth-label">
            <span>Password</span>
            <div className="auth-input-wrap">
              <Lock size={17} className="auth-icon" />
              <input name="password" type={showPass ? "text" : "password"} value={form.password}
                onChange={change} placeholder="At least 6 characters" required autoComplete="new-password" />
              <button type="button" className="auth-eye" onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label className="auth-label">
            <span>Confirm password</span>
            <div className="auth-input-wrap">
              <Lock size={17} className="auth-icon" />
              <input name="confirm" type={showPass ? "text" : "password"} value={form.confirm}
                onChange={change} placeholder="Repeat your password" required autoComplete="new-password" />
            </div>
          </label>

          <button className="auth-submit" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <button onClick={() => navigate("/")} className="auth-link">Log in</button>
        </p>
      </div>
    </div>
  );
}
