import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { BookOpen, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "../api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({ newPassword: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function change(e) { setForm((f) => ({ ...f, [e.target.name]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (form.newPassword !== form.confirm) return setError("Passwords do not match.");
    if (form.newPassword.length < 6) return setError("Password must be at least 6 characters.");
    if (!token) return setError("Reset token is missing. Please use the link from your email.");
    setLoading(true);
    try {
      await api.resetPassword({ token, newPassword: form.newPassword });
      setDone(true);
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

        {done ? (
          <>
            <CheckCircle2 size={48} style={{ color: "#4caa84", display: "block", margin: "4px 0 14px" }} />
            <h1 className="auth-title">Password reset!</h1>
            <p className="auth-subtitle">Your password has been updated. You can now log in with your new password.</p>
            <button className="auth-submit" style={{ marginTop: 20 }} onClick={() => navigate("/")}>Go to Login</button>
          </>
        ) : (
          <>
            <h1 className="auth-title">Set new password</h1>
            <p className="auth-subtitle">Choose a strong password for your account.</p>

            {error && <div className="auth-error"><AlertCircle size={16} /> {error}</div>}

            <form onSubmit={submit} className="auth-form">
              <label className="auth-label">
                <span>New password</span>
                <div className="auth-input-wrap">
                  <Lock size={17} className="auth-icon" />
                  <input name="newPassword" type={showPass ? "text" : "password"} value={form.newPassword}
                    onChange={change} placeholder="At least 6 characters" required autoFocus autoComplete="new-password" />
                  <button type="button" className="auth-eye" onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              <label className="auth-label">
                <span>Confirm new password</span>
                <div className="auth-input-wrap">
                  <Lock size={17} className="auth-icon" />
                  <input name="confirm" type={showPass ? "text" : "password"} value={form.confirm}
                    onChange={change} placeholder="Repeat new password" required autoComplete="new-password" />
                </div>
              </label>
              <button className="auth-submit" disabled={loading}>
                {loading ? "Resetting…" : "Reset password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

