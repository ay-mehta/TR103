import { Router } from "express";
import {
  register, verifyEmail, resendVerification,
  login, getMe, getProfile, updateProfile,
  changePassword, forgotPassword, resetPassword,
  requestDeleteAccount, confirmDeleteAccount
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Public
router.post("/register",               register);
router.get("/verify-email",            verifyEmail);
router.post("/resend-verification",    resendVerification);
router.post("/login",                  login);
router.post("/forgot-password",        forgotPassword);
router.post("/reset-password",         resetPassword);
router.post("/confirm-delete-account", confirmDeleteAccount);

// Protected
router.get("/me",                      protect, getMe);
router.get("/profile",                 protect, getProfile);
router.put("/profile",                 protect, updateProfile);
router.put("/change-password",         protect, changePassword);
router.post("/request-delete-account", protect, requestDeleteAccount);

export default router;
