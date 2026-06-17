import { Router } from "express";
import {
  listAttributes, createAttribute, updateAttribute, deleteAttribute,
  createAttributeValue, deleteAttributeValue, updateAttributeValue,
} from "../controllers/attribute.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/",    requireAuth, requirePermission("attribute", "read"),   listAttributes);
router.post("/",   requireAuth, requirePermission("attribute", "create"), createAttribute);
router.put("/:id", requireAuth, requirePermission("attribute", "update"), updateAttribute);
router.delete("/:id", requireAuth, requirePermission("attribute", "delete"), deleteAttribute);

router.post("/:attributeId/values",            requireAuth, requirePermission("attribute", "create"), createAttributeValue);
router.put("/:attributeId/values/:valueId",    requireAuth, requirePermission("attribute", "update"), updateAttributeValue);
router.delete("/:attributeId/values/:valueId", requireAuth, requirePermission("attribute", "delete"), deleteAttributeValue);

export default router;
