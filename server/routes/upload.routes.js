import { Router } from "express";
import { deleteAsset, uploadAsset } from "../controllers/upload.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";
import { imageUpload } from "../middlewares/upload.middleware.js";

const router = Router();

router.post("/", requireAuth, requirePermission("gallery:create", "product:create", "product:update"), imageUpload, uploadAsset);
router.delete("/", requireAuth, requirePermission("gallery:delete", "product:update"), deleteAsset);

export default router;

