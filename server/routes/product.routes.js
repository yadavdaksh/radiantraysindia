import { Router } from "express";
import {
  bulkProductActions,
  createProduct,
  deleteProduct,
  duplicateProduct,
  getProductBySlug,
  getProductById,
  listProducts,
  updateProduct,
} from "../controllers/product.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", listProducts);
router.get("/id/:id", requireAuth, requirePermission("product", "read"), getProductById);
router.get("/:slug", getProductBySlug);
router.post("/", requireAuth, requirePermission("product", "create"), createProduct);
router.put("/:id", requireAuth, requirePermission("product", "update"), updateProduct);
router.post("/:id/duplicate", requireAuth, requirePermission("product", "create"), duplicateProduct);
router.delete("/:id", requireAuth, requirePermission("product", "delete"), deleteProduct);
router.post("/bulk/actions", requireAuth, requirePermission("product", "update"), bulkProductActions);

export default router;

