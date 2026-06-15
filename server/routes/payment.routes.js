import { Router } from "express";
import { handleWebhook, processRefund } from "../controllers/payment.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/webhook", handleWebhook);
router.post("/refund", requireAuth, requirePermission("order", "update"), processRefund);

export default router;
