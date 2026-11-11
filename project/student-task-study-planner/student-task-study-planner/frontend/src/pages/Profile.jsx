import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Mail, Shield, Calendar, Pencil,
  Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Save, X
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
        <div className="profile-danger">
          <span>Want to sign out?</span>
          <button className="profile-btn-danger" onClick={() => { logout(); navigate("/"); }}>
            Sign out of all sessions
          </button>
        </div>
      </div>
    </div>
  );
}

