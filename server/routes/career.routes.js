import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/auth.middleware.js";
import {
  listActiveJobs,
  getJobBySlug,
  applyForJob,
  adminListJobs,
  adminGetJob,
  adminCreateJob,
  adminUpdateJob,
  adminDeleteJob,
  adminListApplications,
  adminUpdateApplication,
} from "../controllers/career.controller.js";

const router = Router();

// Admin routes — must be before /:slug to avoid conflict
router.get("/admin/jobs", requireAuth, requirePermission("career", "read"), adminListJobs);
router.get("/admin/jobs/:id", requireAuth, requirePermission("career", "read"), adminGetJob);
router.post("/admin/jobs", requireAuth, requirePermission("career", "create"), adminCreateJob);
router.put("/admin/jobs/:id", requireAuth, requirePermission("career", "update"), adminUpdateJob);
router.delete("/admin/jobs/:id", requireAuth, requirePermission("career", "delete"), adminDeleteJob);
router.get("/admin/applications", requireAuth, requirePermission("career", "read"), adminListApplications);
router.get("/admin/applications/:id", requireAuth, requirePermission("career", "read"), adminListApplications);
router.put("/admin/applications/:id", requireAuth, requirePermission("career", "update"), adminUpdateApplication);

// Public routes — after admin so /admin/* matched first
router.get("/", listActiveJobs);
router.get("/:slug", getJobBySlug);
router.post("/:slug/apply", applyForJob);

export default router;
