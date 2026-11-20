import { Router } from "express";
import {
  register, verifyEmail, resendVerification,
  login, getMe, getProfile, updateProfile,
  changePassword, forgotPassword, resetPassword,
  deleteAccount, confirmDeleteAccount, requestDeleteAccount
} from "../controllers/authController.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";

const router = Router();

// Public / Direct Account Operations
router.post("/register",               register);
router.get("/verify-email",            verifyEmail);
router.post("/resend-verification",    resendVerification);
router.post("/login",                  login);
router.post("/forgot-password",        forgotPassword);
router.post("/reset-password",         resetPassword);
router.post("/delete-account",         optionalProtect, deleteAccount);
router.post("/confirm-delete-account", optionalProtect, confirmDeleteAccount);

// Protected (requires active user login)
router.get("/me",                      protect, getMe);
router.get("/profile",                 protect, getProfile);
router.put("/profile",                 protect, updateProfile);
router.put("/change-password",         protect, changePassword);
router.post("/request-delete-account", protect, requestDeleteAccount);

export default router;
