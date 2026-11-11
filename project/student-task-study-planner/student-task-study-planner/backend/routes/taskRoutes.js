import { Router } from "express";
import { getTasks, getStats, createTask, updateTask, toggleTask, deleteTask } from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// All task routes require authentication
router.use(protect);

router.get("/stats", getStats);
router.get("/", getTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.patch("/:id/toggle", toggleTask);
router.delete("/:id", deleteTask);

export default router;
