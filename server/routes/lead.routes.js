import { Router } from "express";
import { createLead, listLeads, updateLead } from "../controllers/lead.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", createLead);
router.get("/", requireAuth, requirePermission("lead", "read"), listLeads);
router.put("/:id", requireAuth, requirePermission("lead", "update"), updateLead);

export default router;

