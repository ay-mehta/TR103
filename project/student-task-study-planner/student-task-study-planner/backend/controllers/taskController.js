import mongoose from "mongoose";
import Task from "../models/Task.js";

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

export async function getTasks(req, res, next) {
  try {
    const filter = { user: req.user._id };
    if (req.query.status === "pending") filter.completed = false;
    if (req.query.status === "completed") filter.completed = true;
    if (req.query.category) filter.category = req.query.category;
    const tasks = await Task.find(filter).sort({ completed: 1, deadline: 1, createdAt: -1 });
    res.json(tasks);
  } catch (error) { next(error); }
}

export async function getStats(req, res, next) {
  try {
    const userId = req.user._id;
    const [total, completed, pending, categoryCounts] = await Promise.all([
      Task.countDocuments({ user: userId }),
      Task.countDocuments({ user: userId, completed: true }),
      Task.countDocuments({ user: userId, completed: false }),
      Task.aggregate([
        { $match: { user: userId } },
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ])
    ]);
    res.json({ total, completed, pending, categories: categoryCounts });
  } catch (error) { next(error); }
}

export async function createTask(req, res, next) {
  try {
    const { title, description, category, deadline } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: "Please enter a task title." });
    const task = await Task.create({
      user: req.user._id,
      title, description, category,
      deadline: deadline || null
    });
    res.status(201).json(task);
  } catch (error) { next(error); }
}

export async function updateTask(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid task ID." });
    const allowed = ["title", "description", "category", "deadline", "completed"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (updates.title !== undefined && !updates.title.trim()) {
      return res.status(400).json({ message: "Task title cannot be empty." });
    }
    if (updates.deadline === "") updates.deadline = null;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json(task);
  } catch (error) { next(error); }
}

export async function toggleTask(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid task ID." });
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: "Task not found." });
    task.completed = !task.completed;
    await task.save();
    res.json(task);
  } catch (error) { next(error); }
}

export async function deleteTask(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid task ID." });
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json({ message: "Task deleted." });
  } catch (error) { next(error); }
}
