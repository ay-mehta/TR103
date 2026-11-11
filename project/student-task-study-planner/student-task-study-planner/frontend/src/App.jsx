import { useCallback, useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import {
  BookOpen, CheckCircle2, Clock3, ListTodo, Plus,
  Search, Sparkles, AlertCircle, LogOut, UserCircle
} from "lucide-react";
import { api } from "./api";
import { useAuth } from "./context/AuthContext";
import TaskForm from "./components/TaskForm";
import TaskCard from "./components/TaskCard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";

const tabs = [
  { id: "all", label: "All tasks" },
  { id: "pending", label: "Pending" },
  { id: "completed", label: "Completed" }
];

// ── Protected wrapper ────────────────────────────────────────────────────────
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}><div className="loader" /></div>;
  return user ? children : <Navigate to="/" replace />;
}

// ── Main dashboard ───────────────────────────────────────────────────────────
function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, categories: [] });
  const [activeTab, setActiveTab] = useState("all");
  const [category, setCategory] = useState("All categories");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setError("");
      const [taskData, statsData] = await Promise.all([api.getTasks(), api.getStats()]);
      setTasks(taskData); setStats(statsData);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const matchesTab = activeTab === "all" || (activeTab === "pending" ? !task.completed : task.completed);
    const matchesCategory = category === "All categories" || task.category === category;
    const matchesSearch = `${task.title} ${task.description}`.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesCategory && matchesSearch;
  }), [tasks, activeTab, category, search]);

  async function saveTask(data) {
    try {
      setSaving(true);
      if (editing) await api.updateTask(editing._id, data);
      else await api.createTask(data);
      setFormOpen(false); setEditing(null); await refresh();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function toggleTask(id) {
    try { await api.toggleTask(id); await refresh(); }
    catch (err) { setError(err.message); }
  }

  async function deleteTask(id) {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    try { await api.deleteTask(id); await refresh(); }
    catch (err) { setError(err.message); }
  }

  function openEdit(task) { setEditing(task); setFormOpen(true); }
  function openAdd() { setEditing(null); setFormOpen(true); }

  const progress = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const avatarLetter = user?.name?.[0]?.toUpperCase() || "S";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#"><span className="brand-mark"><BookOpen size={21} /></span><span>study<span className="brand-accent">flow</span></span></a>
        <div className="side-label">WORKSPACE</div>
        <button className="side-link active"><ListTodo size={18} /> My tasks</button>
        <div className="side-label category-side-label">CATEGORIES</div>
        {["Assignments", "Exams", "Projects", "Personal"].map((item, i) => (
          <button key={item} className={`side-link category-link ${category === item ? "selected" : ""}`}
            onClick={() => setCategory(category === item ? "All categories" : item)}>
            <span className={`side-dot dot-${i}`} />{item}
          </button>
        ))}
        <div className="sidebar-bottom">
          <div className="tip-card"><Sparkles size={17} /><strong>Small steps add up.</strong><p>Stay consistent. Your future self will thank you.</p></div>
          <span className="sidebar-caption">STUDENT TASK PLANNER</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <span className="mobile-brand">study<span>flow</span></span>
          <span className="topbar-date">{today}</span>
          <div className="topbar-user">
            <span className="avatar" title={user?.name}>{avatarLetter}</span>
            <span className="topbar-name">{user?.name}</span>
            <button className="logout-btn profile-nav-btn" onClick={() => navigate("/profile")} title="My Profile">
              <UserCircle size={16} />
            </button>
            <button className="logout-btn" onClick={logout} title="Log out">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div><span className="eyebrow">YOUR PERSONAL WORKSPACE</span><h1>Good things take <span>planning.</span></h1><p>Keep your academic life organised, one task at a time.</p></div>
            <button className="button button-primary add-button" onClick={openAdd}><Plus size={18} /> Add new task</button>
          </section>

          {error && <div className="error-banner"><AlertCircle size={17} />{error}<button onClick={() => setError("")}>Dismiss</button></div>}

          <section className="stats-grid">
            <div className="stat-card"><div className="stat-icon lavender"><ListTodo size={19} /></div><span className="stat-label">Total tasks</span><strong>{stats.total}</strong><small>Across all categories</small></div>
            <div className="stat-card"><div className="stat-icon amber"><Clock3 size={19} /></div><span className="stat-label">Pending</span><strong>{stats.pending}</strong><small>Still on your list</small></div>
            <div className="stat-card"><div className="stat-icon mint"><CheckCircle2 size={19} /></div><span className="stat-label">Completed</span><strong>{stats.completed}</strong><small>Look at you go!</small></div>
            <div className="stat-card progress-card"><div className="progress-heading"><span className="stat-label">Your progress</span><strong>{progress}%</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><small>{stats.completed} of {stats.total} tasks completed</small></div>
          </section>

          <section className="tasks-section">
            <div className="section-heading"><div><span className="eyebrow">THE OVERVIEW</span><h2>Your tasks</h2></div><span className="task-count">{visibleTasks.length} {visibleTasks.length === 1 ? "task" : "tasks"}</span></div>
            <div className="toolbar">
              <div className="tabs">{tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={activeTab === tab.id ? "tab active-tab" : "tab"}>{tab.label}{tab.id === "pending" && <span>{stats.pending}</span>}</button>)}</div>
              <div className="toolbar-right">
                <label className="search-box"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." /></label>
                <select className="filter-select" value={category} onChange={(e) => setCategory(e.target.value)}><option>All categories</option>{["Assignments", "Exams", "Projects", "Personal"].map((c) => <option key={c}>{c}</option>)}</select>
              </div>
            </div>
            <div className="task-list">
              {loading ? <div className="empty-state"><div className="loader" />Loading your tasks…</div> :
                visibleTasks.length ? visibleTasks.map((task) => <TaskCard key={task._id} task={task} onToggle={toggleTask} onEdit={openEdit} onDelete={deleteTask} />) :
                <div className="empty-state"><div className="empty-icon"><BookOpen size={24} /></div><h3>{search || category !== "All categories" ? "No matching tasks" : activeTab === "completed" ? "Nothing completed just yet" : "Your list is clear"}</h3><p>{search || category !== "All categories" ? "Try changing your search or filter." : "Add a task and make a little progress today."}</p>{activeTab !== "completed" && <button className="button button-primary" onClick={openAdd}><Plus size={17} /> Add a task</button>}</div>
              }
            </div>
          </section>
          <footer>Made for focused days and less stressful deadlines.</footer>
        </div>
      </main>

      {formOpen && <TaskForm task={editing} onSave={saveTask} onClose={() => { setFormOpen(false); setEditing(null); }} saving={saving} />}
    </div>
  );
}

// ── Root App with routes ─────────────────────────────────────────────────────
export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}><div className="loader" /></div>;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"               element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup"         element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
      <Route path="/verify-email"   element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/profile"   element={<Protected><Profile /></Protected>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
