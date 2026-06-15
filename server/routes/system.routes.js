import { Router } from "express";
import {
  assignPermissionsToRole,
  createPermission,
  createRole,
  createUser,
  deleteRole,
  deleteUser,
  listActivityLogs,
  listPermissions,
  listRoles,
  listUsers,
  updateRole,
  updateUser,
  listCustomers,
  getCustomerDetail,
  updateCustomerAdmin,
  listNewsletterSubscribers,
  deleteNewsletterSubscriber,
  listAllWishlists,
  listAllAddresses,
} from "../controllers/system.controller.js";
import { requireAuth, requirePermission, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/users", requireAuth, requirePermission("user", "read"), listUsers);
router.post("/users", requireAuth, requirePermission("user", "create"), createUser);
router.put("/users/:id", requireAuth, requirePermission("user", "update"), updateUser);
router.delete("/users/:id", requireAuth, requirePermission("user", "delete"), deleteUser);

router.get("/roles", requireAuth, requirePermission("role", "read"), listRoles);
router.post("/roles", requireAuth, requirePermission("role", "create"), createRole);
router.put("/roles/:id", requireAuth, requirePermission("role", "update"), updateRole);
router.delete("/roles/:id", requireAuth, requirePermission("role", "delete"), deleteRole);
router.post(
  "/roles/permissions",
  requireAuth,
  requirePermission("permission", "read"),
  assignPermissionsToRole
);

router.get("/permissions", requireAuth, requirePermission("permission", "read"), listPermissions);
router.post("/permissions", requireAuth, requireRole("SUPER_ADMIN"), createPermission);

router.get("/activity-logs", requireAuth, requirePermission("dashboard", "read"), listActivityLogs);

// Admin customer management
router.get("/customers",         requireAuth, requirePermission("customer", "read"),   listCustomers);
router.get("/customers/:id",     requireAuth, requirePermission("customer", "read"),   getCustomerDetail);
router.put("/customers/:id",     requireAuth, requirePermission("customer", "update"), updateCustomerAdmin);

// Newsletter subscribers
router.get("/newsletter",        requireAuth, requirePermission("newsletter", "read"),   listNewsletterSubscribers);
router.delete("/newsletter/:id", requireAuth, requirePermission("newsletter", "read"),   deleteNewsletterSubscriber);

// Wishlist overview
router.get("/wishlists",         requireAuth, requirePermission("customer", "read"),   listAllWishlists);

// Addresses overview
router.get("/addresses",         requireAuth, requirePermission("customer", "read"),   listAllAddresses);

export default router;

