import { Router } from "express";
import {
  listCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from "../controllers/coupon.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";

const router = Router();

// Public route for cart coupon validation
router.post("/validate", validateCoupon);

// Admin routes
router.get("/", requireAuth, requirePermission("coupon", "read"), listCoupons);
router.get("/:id", requireAuth, requirePermission("coupon", "read"), getCoupon);
router.post("/", requireAuth, requirePermission("coupon", "create"), createCoupon);
router.put("/:id", requireAuth, requirePermission("coupon", "update"), updateCoupon);
router.delete("/:id", requireAuth, requirePermission("coupon", "delete"), deleteCoupon);

export default router;
