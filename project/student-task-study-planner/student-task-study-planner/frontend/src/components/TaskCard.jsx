import { CalendarDays, Check, Pencil, Trash2, RotateCcw } from "lucide-react";

const colors = {
  Assignments: "violet", Exams: "rose", Projects: "blue", Personal: "green"
};

function dateLabel(value) {
  if (!value) return "No deadline";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const overdue = !task.completed && task.deadline && new Date(task.deadline).setHours(23, 59, 59, 999) < Date.now();
  return (
    <article className={`task-card ${task.completed ? "is-complete" : ""}`}>
      <button className={`check-button ${task.completed ? "checked" : ""}`} onClick={() => onToggle(task._id)} aria-label={task.completed ? "Mark pending" : "Mark completed"}>
        {task.completed && <Check size={15} strokeWidth={3} />}
      </button>
      <div className="task-content">
        <div className="task-topline">
          <span className={`category-tag ${colors[task.category]}`}>{task.category}</span>
          {task.completed && <span className="completed-label">Completed</span>}
        </div>
        <h3>{task.title}</h3>
        {task.description && <p className="task-description">{task.description}</p>}
        <div className={`deadline ${overdue ? "overdue" : ""}`}><CalendarDays size={14} /> {overdue ? "Overdue · " : ""}{dateLabel(task.deadline)}</div>
      </div>
      <div className="task-actions">
        <button className="icon-button" onClick={() => onEdit(task)} aria-label="Edit task"><Pencil size={16} /></button>
        <button className="icon-button danger-hover" onClick={() => onDelete(task._id)} aria-label="Delete task"><Trash2 size={16} /></button>
        {task.completed && <button className="icon-button" onClick={() => onToggle(task._id)} aria-label="Reopen task"><RotateCcw size={16} /></button>}
      </div>
    </article>
  );
}
