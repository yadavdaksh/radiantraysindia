import { Router } from "express";
import {
  createIndustry,
  deleteIndustry,
  listIndustries,
  updateIndustry,
} from "../controllers/industry.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", listIndustries);
router.post("/", requireAuth, requirePermission("industry", "create"), createIndustry);
router.put("/:id", requireAuth, requirePermission("industry", "update"), updateIndustry);
router.delete("/:id", requireAuth, requirePermission("industry", "delete"), deleteIndustry);

export default router;

