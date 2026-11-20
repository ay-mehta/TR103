import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Mail, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "../api";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [verifyLink, setVerifyLink] = useState("");
  const [emailSent, setEmailSent] = useState(true);

  function change(e) { setForm((f) => ({ ...f, [e.target.name]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Please enter your name.");
    if (!form.email.trim()) return setError("Please enter your email address.");
    setLoading(true);
    try {
      const data = await api.register({ name: form.name.trim(), email: form.email.trim() });
      setSubmittedEmail(form.email.trim());
      setVerifyLink(data?.verifyLink || "");
      setEmailSent(data?.emailSent !== false);
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
          <h1 className="auth-title">
            {emailSent ? "Check your inbox! 📬" : "Activation Link Ready 🚀"}
          </h1>
          <p className="auth-subtitle">
            {emailSent ? (
              <>
                We've sent an activation link to <strong>{submittedEmail}</strong>.
                <br />Open the link in your email to choose your password and activate your account.
              </>
            ) : (
              <>
                Resend Free Sandbox restricts outbound emails strictly to the account owner.
                <br />Use the direct link below to choose your password and activate <strong>{submittedEmail}</strong>:
              </>
            )}
          </p>

          {emailSent && (
            <p style={{ fontSize: 12, color: "#9292a5", marginTop: 8, lineHeight: 1.6 }}>
              Didn't receive it? Check your spam folder.
              <br />The link expires in 24 hours.
            </p>
          )}

          {verifyLink && (
            <div style={{ marginTop: 18 }}>
              <a
                href={verifyLink}
                className="auth-submit"
                style={{
                  display: "inline-block",
                  textDecoration: "none",
                  fontSize: 13,
                  padding: "11px 20px"
                }}
              >
                👉 {emailSent ? "Direct Activation Link (Fallback)" : "Set Password & Activate Account"}
              </a>
            </div>
          )}

          <button className="auth-link" style={{ marginTop: 20, display: "block", width: "100%", textAlign: "center" }} onClick={() => navigate("/")}>
            Back to Login
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
        <p className="auth-subtitle">
          Enter your name and email to receive a secure activation link.
        </p>

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

          <p style={{ fontSize: 12, color: "#9292a5", margin: "2px 0 6px", lineHeight: 1.5 }}>
            🔒 You will set your password after clicking the verification link sent to your inbox.
          </p>

          <button className="auth-submit" disabled={loading}>
            {loading ? "Sending link…" : "Send Verification Link"}
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
