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
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [requestingDelete, setRequestingDelete] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState({ type: "", text: "", link: "" });

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

  // ── Request Account Deletion ───────────────────────────────────────────────
  async function handleRequestDelete() {
    setRequestingDelete(true);
    setDeleteMsg({ type: "", text: "", link: "" });
    try {
      const data = await api.requestDeleteAccount();
      setDeleteMsg({
        type: "success",
        text: data.message,
        link: data.deleteLink || ""
      });
      setConfirmDeleteModal(false);
    } catch (err) {
      setDeleteMsg({ type: "error", text: err.message, link: "" });
      setConfirmDeleteModal(false);
    } finally {
      setRequestingDelete(false);
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
              Permanently delete your profile and all associated study tasks, categories, and records. Once deleted, this data cannot be recovered.
            </p>

            {deleteMsg.text && (
              <div className={`profile-banner ${deleteMsg.type}`} style={{ marginBottom: 16 }}>
                {deleteMsg.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <div>
                  <div>{deleteMsg.text}</div>
                  {deleteMsg.link && (
                    <div style={{ marginTop: 8 }}>
                      <a href={deleteMsg.link} className="auth-submit" style={{ display: "inline-block", padding: "6px 14px", fontSize: 12, textDecoration: "none" }}>
                        👉 Direct Confirmation Link (Demo Fallback)
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div>
                <strong style={{ fontSize: 13, color: "#1e293b", display: "block" }}>Delete this account</strong>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  A verification email will be sent to <strong>{profile?.email}</strong> requiring your credentials to confirm.
                </span>
              </div>
              <button
                type="button"
                className="profile-btn-danger"
                style={{ background: "#dc2626", color: "#fff", padding: "10px 18px", display: "inline-flex", alignItems: "center", gap: 6 }}
                disabled={requestingDelete}
                onClick={() => setConfirmDeleteModal(true)}
              >
                <Trash2 size={14} />
                {requestingDelete ? "Sending email…" : "Delete Account"}
              </button>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {confirmDeleteModal && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16
          }}>
            <div style={{
              background: "#fff", borderRadius: 16, padding: "28px 24px", maxWidth: 460, width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, color: "#dc2626" }}>
                <div style={{ background: "#fee2e2", padding: 10, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, color: "#0f172a" }}>Confirm Account Deletion</h3>
                  <span style={{ fontSize: 12, color: "#64748b" }}>This action is permanent and irreversible</span>
                </div>
              </div>

              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: "0 0 20px" }}>
                We will send a secure verification email to <strong>{profile?.email}</strong>. Clicking the link will ask for your username and password to permanently erase your profile and all your study tasks.
              </p>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  className="profile-btn-sm"
                  style={{ padding: "9px 18px", fontSize: 13 }}
                  onClick={() => setConfirmDeleteModal(false)}
                  disabled={requestingDelete}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="profile-btn-danger"
                  style={{ background: "#dc2626", color: "#fff", padding: "9px 18px", fontSize: 13 }}
                  disabled={requestingDelete}
                  onClick={handleRequestDelete}
                >
                  {requestingDelete ? "Sending…" : "Yes, Send Deletion Email"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

