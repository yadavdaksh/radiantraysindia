import { Router } from "express";
import { deleteAsset, uploadAsset } from "../controllers/upload.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";
import { imageUpload } from "../middlewares/upload.middleware.js";

const router = Router();

router.post("/", requireAuth, requirePermission("gallery", "create"), imageUpload, uploadAsset);
router.delete("/", requireAuth, requirePermission("gallery", "delete"), deleteAsset);

export default router;

