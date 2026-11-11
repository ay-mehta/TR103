import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { BookOpen, CheckCircle2, XCircle, Loader } from "lucide-react";
import { api } from "../api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("error"); setMessage("No verification token found in the link."); return; }
    api.verifyEmail(token)
      .then((data) => { setStatus("success"); setMessage(data.message); })
      .catch((err) => { setStatus("error"); setMessage(err.message); });
  }, [searchParams]);

  async function handleResend(e) {
    e.preventDefault();
    if (!resendEmail) return;
    setResending(true);
    try {
      const data = await api.resendVerification(resendEmail);
      setResendMsg(data.message);
    } catch (err) {
      setResendMsg(err.message);
    } finally { setResending(false); }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-brand" style={{ justifyContent: "center" }}>
          <BookOpen size={28} /><span>study<span className="brand-accent">flow</span></span>
        </div>

        {status === "loading" && (
          <><Loader size={44} className="spin-icon" style={{ color: "#7568d8", margin: "16px auto" }} />
          <p style={{ color: "#66667a" }}>Verifying your email…</p></>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 size={52} style={{ color: "#4caa84", margin: "8px auto 16px", display: "block" }} />
            <h2 className="auth-title">Email verified! 🎉</h2>
            <p style={{ color: "#66667a", fontSize: 13, marginBottom: 24 }}>{message}</p>
            <button className="auth-submit" onClick={() => navigate("/")}>Go to Login</button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle size={52} style={{ color: "#d35e6c", margin: "8px auto 16px", display: "block" }} />
            <h2 className="auth-title" style={{ color: "#d35e6c" }}>Verification failed</h2>
            <p style={{ color: "#66667a", fontSize: 13, marginBottom: 20 }}>{message}</p>
            <p style={{ fontSize: 12, color: "#9292a5", marginBottom: 10 }}>Need a new verification link?</p>
            <form onSubmit={handleResend} style={{ display: "flex", gap: 8 }}>
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{ flex: 1, border: "1px solid #e5e5ef", borderRadius: 8, padding: "9px 12px", fontSize: 13 }}
              />
              <button className="auth-submit" disabled={resending} style={{ width: "auto", padding: "9px 16px" }}>
                {resending ? "…" : "Resend"}
              </button>
            </form>
            {resendMsg && <p style={{ fontSize: 12, color: "#4caa84", marginTop: 10 }}>{resendMsg}</p>}
            <button className="auth-link" onClick={() => navigate("/")} style={{ marginTop: 18, display: "block" }}>
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

