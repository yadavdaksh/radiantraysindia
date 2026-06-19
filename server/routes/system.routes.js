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
  deleteCustomerAdmin,
  listNewsletterSubscribers,
  deleteNewsletterSubscriber,
  listAllWishlists,
  listAllAddresses,
  listContactSubmissionsAdmin,
  updateContactSubmissionAdmin,
  deleteContactSubmissionAdmin,
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
  requirePermission("role", "update"),
  assignPermissionsToRole
);

router.get("/permissions", requireAuth, requirePermission("permission", "read"), listPermissions);
router.post("/permissions", requireAuth, requireRole("SUPER_ADMIN"), createPermission);

router.get("/activity-logs", requireAuth, requirePermission("dashboard", "read"), listActivityLogs);

// Admin customer management
router.get("/customers",         requireAuth, requirePermission("customer", "read"),   listCustomers);
router.get("/customers/:id",     requireAuth, requirePermission("customer", "read"),   getCustomerDetail);
router.put("/customers/:id",     requireAuth, requirePermission("customer", "update"), updateCustomerAdmin);
router.delete("/customers/:id",  requireAuth, requirePermission("customer", "delete"), deleteCustomerAdmin);


// Newsletter subscribers
router.get("/newsletter",        requireAuth, requirePermission("newsletter", "read"),   listNewsletterSubscribers);
router.delete("/newsletter/:id", requireAuth, requirePermission("newsletter", "read"),   deleteNewsletterSubscriber);

// Contact submissions
router.get("/contact-submissions", requireAuth, requirePermission("lead", "read"), listContactSubmissionsAdmin);
router.put("/contact-submissions/:id", requireAuth, requirePermission("lead", "update"), updateContactSubmissionAdmin);
router.delete("/contact-submissions/:id", requireAuth, requirePermission("lead", "delete"), deleteContactSubmissionAdmin);

// Wishlist overview
router.get("/wishlists",         requireAuth, requirePermission("customer", "read"),   listAllWishlists);

// Addresses overview
router.get("/addresses",         requireAuth, requirePermission("customer", "read"),   listAllAddresses);

export default router;

