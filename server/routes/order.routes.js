import { Router } from "express";
import {
  createOrder,
  listOrders,
  updateOrder,
  verifyPayment,
  listMyOrders,
  getMyOrder,
  cancelMyOrder,
  returnMyOrder,
} from "../controllers/order.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";

const router = Router();

// Public / customer checkout
router.post("/", createOrder);
router.post("/verify", verifyPayment);

// Customer: their own orders (requires customer auth)
router.get("/mine", requireAuth, listMyOrders);
router.get("/mine/:id", requireAuth, getMyOrder);
router.post("/mine/:id/cancel", requireAuth, cancelMyOrder);
router.post("/mine/:id/return", requireAuth, returnMyOrder);

// Admin
router.get("/", requireAuth, requirePermission("order", "read"), listOrders);
router.put("/:id", requireAuth, requirePermission("order", "update"), updateOrder);

export default router;

