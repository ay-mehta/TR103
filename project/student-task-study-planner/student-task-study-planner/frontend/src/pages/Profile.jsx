import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Mail, Shield, Calendar, Pencil,
  Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Save, X,
  Trash2, AlertTriangle
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user: authUser, login: setAuth, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Name edit state
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState({ type: "", text: "" });

  // Password change state
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });

  // Delete account state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteIdentifier, setDeleteIdentifier] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePw, setShowDeletePw] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    api.getProfile()
      .then((data) => { setProfile(data.user); setNameVal(data.user.name); })
      .catch(() => logout())
      .finally(() => setLoadingProfile(false));
  }, [logout]);

  // ── Update name ────────────────────────────────────────────────────────────
  async function saveName(e) {
    e.preventDefault();
    setNameMsg({ type: "", text: "" });
    setSavingName(true);
    try {
      const data = await api.updateProfile({ name: nameVal });
      setProfile((p) => ({ ...p, name: data.user.name }));
      setAuth(data.user, localStorage.getItem("sp_token")); // refresh context
      setEditingName(false);
      setNameMsg({ type: "success", text: "Name updated successfully." });
    } catch (err) {
      setNameMsg({ type: "error", text: err.message });
    } finally { setSavingName(false); }
  }

  // ── Change password ────────────────────────────────────────────────────────
  function pwChange(e) { setPwForm((f) => ({ ...f, [e.target.name]: e.target.value })); }

  async function savePassword(e) {
    e.preventDefault();
    setPwMsg({ type: "", text: "" });
    if (pwForm.newPassword !== pwForm.confirm)
      return setPwMsg({ type: "error", text: "New passwords do not match." });
    if (pwForm.newPassword.length < 6)
      return setPwMsg({ type: "error", text: "New password must be at least 6 characters." });
    setSavingPw(true);
    try {
      const data = await api.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      setPwMsg({ type: "success", text: data.message });
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      setPwMsg({ type: "error", text: err.message });
    } finally { setSavingPw(false); }
  }

  // ── Direct Account Deletion (NO email required) ────────────────────────────
  function openDeleteModal() {
    setDeleteIdentifier(profile?.email || profile?.name || "");
    setDeletePassword("");
    setDeleteError("");
    setShowDeletePw(false);
    setDeleteModalOpen(true);
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    setDeleteError("");
    if (!deleteIdentifier.trim()) return setDeleteError("Please enter your username or email address.");
    if (!deletePassword) return setDeleteError("Please enter your password to confirm deletion.");

    setDeletingAccount(true);
    try {
      await api.deleteAccount({
        identifier: deleteIdentifier.trim(),
        password: deletePassword
      });

      // Clear authentication session
      logout();
      // Redirect to delete-account page showing confirmed deletion message
      navigate("/delete-account?status=deleted");
    } catch (err) {
      setDeleteError(err.message || "Failed to delete account. Please verify your credentials.");
      setDeletingAccount(false);
    }
  }

  if (loadingProfile) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="loader" />
      </div>
    );
  }

  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <div className="profile-shell">
      {/* Header */}
      <div className="profile-topbar">
        <button className="profile-back" onClick={() => navigate("/")}>
          <ArrowLeft size={17} /> Back to Dashboard
        </button>
        <div className="auth-brand" style={{ margin: 0 }}>
          <span style={{ fontSize: 16 }}>study<span className="brand-accent">flow</span></span>
        </div>
      </div>

      <div className="profile-content">
        {/* Avatar hero */}
        <div className="profile-hero">
          <div className="profile-avatar">{profile?.name?.[0]?.toUpperCase() || "S"}</div>
          <div>
            <h1 className="profile-name">{profile?.name}</h1>
            <p className="profile-email-display">{profile?.email}</p>
            <span className={`profile-badge ${profile?.isVerified ? "verified" : "unverified"}`}>
              {profile?.isVerified ? <><CheckCircle2 size={12} /> Verified</> : "⚠ Unverified"}
            </span>
          </div>
        </div>

        <div className="profile-grid">
          {/* ── Account info card ─────────────────────────── */}
          <div className="profile-card">
            <div className="profile-card-header">
              <User size={17} /> Account Information
            </div>

            {/* Name */}
            <div className="profile-field">
              <label>Full name</label>
              {editingName ? (
                <form onSubmit={saveName} style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <input
                    className="profile-input"
                    value={nameVal}
                    onChange={(e) => setNameVal(e.target.value)}
                    maxLength={60}
                    required
                    autoFocus
                  />
                  <button className="profile-btn-sm primary" disabled={savingName}>
                    <Save size={14} /> {savingName ? "…" : "Save"}
                  </button>
                  <button type="button" className="profile-btn-sm" onClick={() => { setEditingName(false); setNameVal(profile.name); }}>
                    <X size={14} />
                  </button>
                </form>
              ) : (
                <div className="profile-value-row">
                  <span>{profile?.name}</span>
                  <button className="profile-edit-btn" onClick={() => setEditingName(true)}>
                    <Pencil size={13} /> Edit
                  </button>
                </div>
              )}
              {nameMsg.text && (
                <p className={`profile-msg ${nameMsg.type}`}>{nameMsg.text}</p>
              )}
            </div>

            {/* Email */}
            <div className="profile-field">
              <label><Mail size={13} /> Email address</label>
              <div className="profile-value-row">
                <span>{profile?.email}</span>
                <span className={`profile-badge sm ${profile?.isVerified ? "verified" : "unverified"}`}>
                  {profile?.isVerified ? "Verified" : "Unverified"}
                </span>
              </div>
            </div>

            {/* Joined */}
            <div className="profile-field">
              <label><Calendar size={13} /> Member since</label>
              <span className="profile-value">{joinedDate}</span>
            </div>

            {/* Security */}
            <div className="profile-field">
              <label><Shield size={13} /> Account status</label>
              <span className="profile-value">
                {profile?.isVerified ? "✅ Email verified & active" : "⚠️ Email not verified"}
              </span>
            </div>
          </div>

          {/* ── Change password card ───────────────────────── */}
          <div className="profile-card">
            <div className="profile-card-header">
              <Lock size={17} /> Change Password
            </div>

            {pwMsg.text && (
              <div className={`profile-banner ${pwMsg.type}`}>
                {pwMsg.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                {pwMsg.text}
              </div>
            )}

            <form onSubmit={savePassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label className="profile-form-label">
                Current password
                <div className="auth-input-wrap" style={{ marginTop: 6 }}>
                  <Lock size={16} className="auth-icon" />
                  <input
                    name="currentPassword"
                    type={showPw ? "text" : "password"}
                    value={pwForm.currentPassword}
                    onChange={pwChange}
                    placeholder="Your current password"
                    required
                    autoComplete="current-password"
                    className="profile-pw-input"
                  />
                </div>
              </label>

              <label className="profile-form-label">
                New password
                <div className="auth-input-wrap" style={{ marginTop: 6 }}>
                  <Lock size={16} className="auth-icon" />
                  <input
                    name="newPassword"
                    type={showPw ? "text" : "password"}
                    value={pwForm.newPassword}
                    onChange={pwChange}
                    placeholder="At least 6 characters"
                    required
                    autoComplete="new-password"
                    className="profile-pw-input"
                  />
                  <button type="button" className="auth-eye" onClick={() => setShowPw((v) => !v)} tabIndex={-1}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </label>

              <label className="profile-form-label">
                Confirm new password
                <div className="auth-input-wrap" style={{ marginTop: 6 }}>
                  <Lock size={16} className="auth-icon" />
                  <input
                    name="confirm"
                    type={showPw ? "text" : "password"}
                    value={pwForm.confirm}
                    onChange={pwChange}
                    placeholder="Repeat new password"
                    required
                    autoComplete="new-password"
                    className="profile-pw-input"
                  />
                </div>
              </label>

              <button className="auth-submit" disabled={savingPw} style={{ marginTop: 4 }}>
                {savingPw ? "Updating…" : "Update password"}
              </button>
            </form>

            <div className="profile-hint">
              Forgot your current password?{" "}
              <button className="auth-link" onClick={() => { logout(); navigate("/forgot-password"); }}>
                Reset via email
              </button>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="profile-danger">
            <span>Want to sign out?</span>
            <button className="profile-btn-danger" onClick={() => { logout(); navigate("/"); }}>
              Sign out of all sessions
            </button>
          </div>

          {/* Delete Account Card */}
          <div className="profile-card" style={{ borderColor: "#fecaca", background: "#fffafb", margin: 0 }}>
            <div className="profile-card-header" style={{ color: "#dc2626" }}>
              <Trash2 size={17} /> Danger Zone: Delete Account
            </div>

            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px", lineHeight: 1.6 }}>
              Permanently delete your profile and all associated study tasks, categories, and records from our database. Once deleted, this data cannot be recovered.
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div>
                <strong style={{ fontSize: 13, color: "#1e293b", display: "block" }}>Delete this account</strong>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  Requires your username/email and password to verify before permanent removal.
                </span>
              </div>
              <button
                type="button"
                className="profile-btn-danger"
                style={{ background: "#dc2626", color: "#fff", padding: "10px 18px", display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={openDeleteModal}
              >
                <Trash2 size={14} />
                Delete Account
              </button>
            </div>

            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed #fecaca", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Direct standalone deletion page:
              </span>
              <button
                type="button"
                onClick={() => navigate("/delete-account")}
                className="auth-link"
                style={{ fontSize: 12, background: "none", border: "none", padding: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                Open /delete-account page →
              </button>
            </div>
          </div>
        </div>

        {/* Direct Delete Account Confirmation Modal */}
        {deleteModalOpen && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16
          }}>
            <div style={{
              background: "#fff", borderRadius: 18, padding: "28px 24px", maxWidth: 460, width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ background: "#fee2e2", padding: 10, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>Permanently Delete Account</h3>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Confirm your credentials to proceed</span>
                </div>
              </div>

              <div style={{
                background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 10,
                padding: "12px 14px", margin: "14px 0 16px", fontSize: 12, color: "#9f1239", lineHeight: 1.5
              }}>
                ⚠️ <strong>Warning:</strong> This will permanently erase your profile and all associated study tasks from the database. This action cannot be undone. No email confirmation is needed.
              </div>

              {deleteError && (
                <div className="auth-error" style={{ marginBottom: 14 }}>
                  <AlertCircle size={15} /> {deleteError}
                </div>
              )}

              <form onSubmit={handleDeleteAccount} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label className="profile-form-label">
                  Username or Email
                  <div className="auth-input-wrap" style={{ marginTop: 6 }}>
                    <User size={16} className="auth-icon" />
                    <input
                      type="text"
                      value={deleteIdentifier}
                      onChange={(e) => setDeleteIdentifier(e.target.value)}
                      placeholder="Username or email address"
                      required
                      className="profile-pw-input"
                    />
                  </div>
                </label>

                <label className="profile-form-label">
                  Password
                  <div className="auth-input-wrap" style={{ marginTop: 6 }}>
                    <Lock size={16} className="auth-icon" />
                    <input
                      type={showDeletePw ? "text" : "password"}
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Enter your account password"
                      required
                      autoComplete="current-password"
                      className="profile-pw-input"
                    />
                    <button
                      type="button"
                      className="auth-eye"
                      onClick={() => setShowDeletePw((v) => !v)}
                      tabIndex={-1}
                    >
                      {showDeletePw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </label>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    className="profile-btn-sm"
                    style={{ padding: "9px 18px", fontSize: 13 }}
                    onClick={() => setDeleteModalOpen(false)}
                    disabled={deletingAccount}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="profile-btn-danger"
                    style={{ background: "#dc2626", color: "#fff", padding: "9px 18px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
                    disabled={deletingAccount}
                  >
                    <Trash2 size={14} />
                    {deletingAccount ? "Deleting Account…" : "Permanently Delete My Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

