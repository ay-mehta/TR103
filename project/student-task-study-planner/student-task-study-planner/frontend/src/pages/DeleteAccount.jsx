import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { BookOpen, Lock, User, Eye, EyeOff, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function DeleteAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const token = searchParams.get("token") || "";

  const [identifier, setIdentifier] = useState(authUser?.email || authUser?.name || "");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState(searchParams.get("status") === "deleted");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!identifier.trim()) return setError("Please enter your username or email address.");
    if (!password) return setError("Please enter your password.");

    setLoading(true);
    try {
      await api.deleteAccount({
        identifier: identifier.trim(),
        password,
        ...(token ? { token } : {})
      });

      // Clear any active local authentication session
      logout();
      setDeleted(true);
    } catch (err) {
      setError(err.message || "Failed to delete account. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <BookOpen size={28} />
          <span>study<span className="brand-accent">flow</span></span>
        </div>

        {deleted ? (
          <>
            <CheckCircle2 size={52} style={{ color: "#dc2626", display: "block", margin: "6px auto 16px" }} />
            <h1 className="auth-title">Account Deleted</h1>
            <p className="auth-subtitle">
              Your StudyFlow account and all associated study tasks have been permanently deleted from our database.
            </p>
            <p style={{ fontSize: 12, color: "#9292a5", marginTop: 8 }}>
              We're sorry to see you go! You can always sign up again with a fresh account in the future.
            </p>
            <button
              className="auth-submit"
              style={{ marginTop: 24 }}
              onClick={() => navigate("/")}
            >
              Return to Home
            </button>
          </>
        ) : (
          <>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: "#fee2e2",
              color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px"
            }}>
              <AlertTriangle size={24} />
            </div>

            <h1 className="auth-title">Delete Account</h1>
            <p className="auth-subtitle">
              Please enter your username/email and password to confirm permanent deletion of your account.
            </p>

            <div style={{
              background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 10,
              padding: "12px 14px", margin: "14px 0 18px", fontSize: 12, color: "#9f1239", lineHeight: 1.5
            }}>
              ⚠️ <strong>Warning:</strong> This action cannot be undone. All your study tasks, categories, and account records will be permanently removed.
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={submit} className="auth-form">
              <label className="auth-label">
                <span>Username or Email Address</span>
                <div className="auth-input-wrap">
                  <User size={17} className="auth-icon" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your username or email"
                    required
                    autoFocus
                  />
                </div>
              </label>

              <label className="auth-label">
                <span>Password</span>
                <div className="auth-input-wrap">
                  <Lock size={17} className="auth-icon" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your current password"
                    required
                    autoComplete="current-password"
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

              <button
                className="auth-submit"
                disabled={loading}
                style={{
                  background: "#dc2626",
                  marginTop: 8
                }}
              >
                {loading ? "Deleting Account…" : "Permanently Delete My Account"}
              </button>

              <button
                type="button"
                className="auth-link"
                style={{ marginTop: 14, textAlign: "center", display: "block", width: "100%", background: "none", border: "none", cursor: "pointer" }}
                onClick={() => navigate("/")}
              >
                Cancel and return to home
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
