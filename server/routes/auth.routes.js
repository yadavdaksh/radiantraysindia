import { Router } from "express";
import {
  bootstrapAdmin,
  login,
  logout,
  logoutAll,
  me,
  refresh,
  customerLogin,
  customerRegister,
  customerVerifyOtp,
  customerForgotPassword,
  customerResetPassword,
  changePassword,
  adminForgotPassword,
  adminResetPassword,
} from "../controllers/auth.controller.js";
import { requireAuth, requireRefreshToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Administrative and General Auth
router.post("/bootstrap", bootstrapAdmin);
router.post("/login", login);
router.post("/refresh", requireRefreshToken, refresh);
router.post("/logout", logout);
router.post("/logout-all", requireAuth, logoutAll);
router.get("/me", requireAuth, me);
router.post("/change-password", requireAuth, changePassword);

// Admin password recovery (no auth needed)
router.post("/admin/forgot-password", adminForgotPassword);
router.post("/admin/reset-password", adminResetPassword);

// Customer Specific Auth
router.post("/customer/login", customerLogin);
router.post("/customer/register", customerRegister);
router.post("/customer/verify-otp", customerVerifyOtp);
router.post("/customer/forgot-password", customerForgotPassword);
router.post("/customer/reset-password", customerResetPassword);

export default router;
