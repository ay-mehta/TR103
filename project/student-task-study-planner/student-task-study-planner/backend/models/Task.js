import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"]
    },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    category: {
      type: String,
      enum: ["Assignments", "Exams", "Projects", "Personal"],
      required: true,
      default: "Assignments"
    },
    deadline: { type: Date, default: null },
    completed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
