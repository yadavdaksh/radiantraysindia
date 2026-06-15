import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getMyOrders,
  getMyOrderById,
} from "../controllers/customer.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.get("/orders", getMyOrders);
router.get("/orders/:id", getMyOrderById);

export default router;
