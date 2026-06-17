import { Router } from "express";
import { createLead, listLeads, updateLead, deleteLead } from "../controllers/lead.controller.js";
import { requireAuth, requirePermission, optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", optionalAuth, createLead);
router.get(
  "/",
  requireAuth,
  (req, res, next) => {
    if (req.user.role === "CUSTOMER") return next();
    requirePermission("lead", "read")(req, res, next);
  },
  listLeads
);
router.put("/:id", requireAuth, requirePermission("lead", "update"), updateLead);
router.delete("/:id", requireAuth, requirePermission("lead", "delete"), deleteLead);

export default router;

