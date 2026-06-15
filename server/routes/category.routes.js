import { Router } from "express";
import {
  createCategory,
  createSubCategory,
  deleteCategory,
  deleteSubCategory,
  listCategories,
  listSubCategories,
  updateCategory,
  updateSubCategory,
} from "../controllers/category.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", listCategories);
router.post("/", requireAuth, requirePermission("category", "create"), createCategory);
router.put("/:id", requireAuth, requirePermission("category", "update"), updateCategory);
router.delete("/:id", requireAuth, requirePermission("category", "delete"), deleteCategory);

router.get("/subcategories", listSubCategories);
router.post(
  "/subcategories",
  requireAuth,
  requirePermission("subcategory", "create"),
  createSubCategory
);
router.put(
  "/subcategories/:id",
  requireAuth,
  requirePermission("subcategory", "update"),
  updateSubCategory
);
router.delete(
  "/subcategories/:id",
  requireAuth,
  requirePermission("subcategory", "delete"),
  deleteSubCategory
);

export default router;

