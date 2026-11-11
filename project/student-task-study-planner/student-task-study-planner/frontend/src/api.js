const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("sp_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed. Is the backend running?");
  return data;
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  register:           (body)  => request("/auth/register",            { method: "POST", body: JSON.stringify(body) }),
  login:              (body)  => request("/auth/login",               { method: "POST", body: JSON.stringify(body) }),
  verifyEmail:        (token) => request(`/auth/verify-email?token=${token}`),
  resendVerification: (email) => request("/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) }),
  forgotPassword:     (email) => request("/auth/forgot-password",     { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword:      (body)  => request("/auth/reset-password",      { method: "POST", body: JSON.stringify(body) }),

  // ── Profile ───────────────────────────────────────────────────────────────
  getProfile:     ()     => request("/auth/profile"),
  updateProfile:  (body) => request("/auth/profile",         { method: "PUT",  body: JSON.stringify(body) }),
  changePassword: (body) => request("/auth/change-password", { method: "PUT",  body: JSON.stringify(body) }),

  // ── Tasks ─────────────────────────────────────────────────────────────────
  getTasks:   (status = "all") => request(`/tasks${status === "all" ? "" : `?status=${status}`}`),
  getStats:   ()               => request("/tasks/stats"),
  createTask: (task)           => request("/tasks",              { method: "POST",   body: JSON.stringify(task) }),
  updateTask: (id, task)       => request(`/tasks/${id}`,        { method: "PUT",    body: JSON.stringify(task) }),
  toggleTask: (id)             => request(`/tasks/${id}/toggle`, { method: "PATCH" }),
  deleteTask: (id)             => request(`/tasks/${id}`,        { method: "DELETE" })
};
