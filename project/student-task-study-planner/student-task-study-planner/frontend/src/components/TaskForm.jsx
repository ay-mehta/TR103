import { useEffect, useState } from "react";
import { X } from "lucide-react";

const blank = { title: "", description: "", category: "Assignments", deadline: "" };

export default function TaskForm({ task, onSave, onClose, saving }) {
  const [form, setForm] = useState(blank);
  useEffect(() => {
    setForm(task ? {
      title: task.title || "",
      description: task.description || "",
      category: task.category || "Assignments",
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 10) : ""
    } : blank);
  }, [task]);

  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function submit(event) {
    event.preventDefault();
    onSave({ ...form, deadline: form.deadline || null });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="task-form" onSubmit={submit}>
        <div className="modal-heading">
          <div><span className="eyebrow">{task ? "MAKE AN UPDATE" : "PLAN YOUR WORK"}</span>
            <h2>{task ? "Edit task" : "Add a new task"}</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <label>Task title <span className="required">*</span>
          <input name="title" value={form.title} onChange={change} placeholder="e.g. Prepare DBMS assignment" maxLength="100" required autoFocus />
        </label>
        <label>Description
          <textarea name="description" value={form.description} onChange={change} placeholder="Add a few details (optional)" rows="3" maxLength="1000" />
        </label>
        <div className="form-row">
          <label>Category
            <select name="category" value={form.category} onChange={change}>
              {["Assignments", "Exams", "Projects", "Personal"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label>Deadline
            <input type="date" name="deadline" value={form.deadline} onChange={change} />
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="button button-light" onClick={onClose}>Cancel</button>
          <button className="button button-primary" disabled={saving}>{saving ? "Saving..." : task ? "Save changes" : "Add task"}</button>
        </div>
      </form>
    </div>
  );
}
