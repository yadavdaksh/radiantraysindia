import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createSlug } from "../helpers/Slug.js";

import { leadService } from "../services/lead.service.js";
import { validatePassword } from "../helpers/validatePassword.js";
import { logActivity } from "../utils/logActivity.js";

export const listUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { updatedAt: "desc" },
  });
  res.json(new ApiResponsive(200, users));
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, roleId, phone } = req.body;
  if (!name || !email || !password || !roleId) {
    throw new ApiError(400, "Name, email, password and role are required");
  }
  validatePassword(password);
  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashed,
      roleId,
      phone: phone || null,
    },
  });
  logActivity({ type: "CREATE", title: `User created: ${name}`, entityType: "user", entityId: user.id, actorId: req.user?.id, metadata: { email } });
  res.status(201).json(new ApiResponsive(201, user, "User created"));
});

export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "User not found");

  const data = {
    name: req.body.name ?? existing.name,
    email: req.body.email ? req.body.email.toLowerCase() : existing.email,
    phone: req.body.phone ?? existing.phone,
    roleId: req.body.roleId ?? existing.roleId,
    isActive: req.body.isActive ?? existing.isActive,
  };

  if (req.body.password) {
    validatePassword(req.body.password);
    data.password = await bcrypt.hash(req.body.password, 12);
  }

  const user = await prisma.user.update({ where: { id }, data });
  logActivity({ type: "UPDATE", title: `User updated: ${user.name}`, entityType: "user", entityId: id, actorId: req.user?.id });
  res.json(new ApiResponsive(200, user, "User updated"));
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });
  res.json(new ApiResponsive(200, null, "User archived"));
});

export const listRoles = asyncHandler(async (_req, res) => {
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: { permission: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  res.json(new ApiResponsive(200, roles));
});

export const createRole = asyncHandler(async (req, res) => {
  if (!req.body.name || !req.body.label) {
    throw new ApiError(400, "Role name and label are required");
  }

  const role = await prisma.role.create({
    data: {
      name: req.body.name,
      label: req.body.label,
      description: req.body.description || null,
    },
  });

  logActivity({ type: "CREATE", title: `Role created: ${role.label}`, entityType: "role", entityId: role.id, actorId: req.user?.id });
  res.status(201).json(new ApiResponsive(201, role, "Role created"));
});

export const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw new ApiError(404, "Role not found");

  const updated = await prisma.role.update({
    where: { id },
    data: {
      label: req.body.label ?? role.label,
      description: req.body.description ?? role.description,
      isActive: req.body.isActive ?? role.isActive,
    },
  });

  logActivity({ type: "UPDATE", title: `Role updated: ${updated.label}`, entityType: "role", entityId: id, actorId: req.user?.id });
  res.json(new ApiResponsive(200, updated, "Role updated"));
});

export const deleteRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.role.update({ where: { id }, data: { isActive: false } });
  res.json(new ApiResponsive(200, null, "Role archived"));
});

export const listPermissions = asyncHandler(async (_req, res) => {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ resource: "asc" }, { action: "asc" }],
  });
  res.json(new ApiResponsive(200, permissions));
});

export const createPermission = asyncHandler(async (req, res) => {
  if (!req.body.resource || !req.body.action) {
    throw new ApiError(400, "Resource and action are required");
  }

  const permission = await prisma.permission.create({
    data: {
      resource: req.body.resource,
      action: req.body.action,
      description: req.body.description || `${req.body.resource}:${req.body.action}`,
    },
  });

  res.status(201).json(new ApiResponsive(201, permission, "Permission created"));
});

export const assignPermissionsToRole = asyncHandler(async (req, res) => {
  const { roleId, permissionIds = [] } = req.body;
  if (!roleId || !Array.isArray(permissionIds)) {
    throw new ApiError(400, "Role and permissions are required");
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  await prisma.rolePermission.deleteMany({ where: { roleId } });
  await prisma.rolePermission.createMany({
    data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
    skipDuplicates: true,
  });

  logActivity({ type: "UPDATE", title: `Permissions updated for role: ${role?.label || roleId}`, entityType: "role", entityId: roleId, actorId: req.user?.id, metadata: { permissionCount: permissionIds.length } });
  res.json(new ApiResponsive(200, null, "Permissions assigned"));
});

// ── Admin Customer Management ─────────────────────────────────────────────────

export const listCustomers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Number(req.query.limit || 50), 200);
  const search = String(req.query.search || "").trim();
  const where = search ? {
    OR: [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ],
  } : {};
  const [items, total] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      select: {
        id: true, name: true, email: true, phone: true,
        isVerified: true, isActive: true, createdAt: true,
        _count: { select: { orders: true, addresses: true, wishlist: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);
  res.json(new ApiResponsive(200, { items, total, page, limit }));
});

export const getCustomerDetail = asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 10, include: { items: true } },
      addresses: true,
      wishlist: { include: { product: { select: { name: true, slug: true, images: true } } } },
    },
  });
  if (!customer) throw new ApiError(404, "Customer not found");
  res.json(new ApiResponsive(200, customer));
});

export const updateCustomerAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Customer not found");
  const data = {};
  if (req.body.isActive !== undefined) data.isActive = Boolean(req.body.isActive);
  if (req.body.isVerified !== undefined) data.isVerified = Boolean(req.body.isVerified);
  if (req.body.name) data.name = req.body.name;
  if (req.body.phone !== undefined) data.phone = req.body.phone;
  // Reset password
  if (req.body.newPassword) {
    const hashed = await bcrypt.hash(req.body.newPassword, 12);
    data.password = hashed;
    data.resetPasswordOtp = null;
    data.resetPasswordOtpExpires = null;
  }
  const updated = await prisma.customer.update({ where: { id }, data });
  res.json(new ApiResponsive(200, updated, "Customer updated"));
});

export const deleteCustomerAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Customer not found");

  await prisma.customer.delete({ where: { id } });
  res.json(new ApiResponsive(200, null, "Customer deleted successfully"));
});

// ── Admin Newsletter subscribers ──────────────────────────────────────────────

export const listNewsletterSubscribers = asyncHandler(async (req, res) => {
  const items = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(new ApiResponsive(200, { items, total: items.length }));
});

export const deleteNewsletterSubscriber = asyncHandler(async (req, res) => {
  await prisma.newsletterSubscriber.delete({ where: { id: req.params.id } });
  res.json(new ApiResponsive(200, null, "Subscriber removed"));
});

// ── Admin Wishlist overview ───────────────────────────────────────────────────

export const listAllWishlists = asyncHandler(async (req, res) => {
  const items = await prisma.wishlist.findMany({
    include: {
      customer: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true, images: true, productType: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(new ApiResponsive(200, { items, total: items.length }));
});

// ── Admin Addresses overview ──────────────────────────────────────────────────

export const listAllAddresses = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Number(req.query.limit || 50), 200);
  const [items, total] = await prisma.$transaction([
    prisma.address.findMany({
      include: { customer: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.address.count(),
  ]);
  res.json(new ApiResponsive(200, { items, total }));
});

export const listActivityLogs = asyncHandler(async (req, res) => {
  const items = await prisma.activityLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json(new ApiResponsive(200, items));
});


export const listContactSubmissionsAdmin = asyncHandler(async (req, res) => {
  const submissions = await leadService.listContactSubmissions();
  res.json(new ApiResponsive(200, submissions, "Contact submissions retrieved successfully"));
});

export const updateContactSubmissionAdmin = asyncHandler(async (req, res) => {
  const submission = await leadService.updateContactSubmission(req.params.id, req.body);
  res.json(new ApiResponsive(200, submission, "Contact submission updated successfully"));
});

export const deleteContactSubmissionAdmin = asyncHandler(async (req, res) => {
  await leadService.deleteContactSubmission(req.params.id);
  res.json(new ApiResponsive(200, null, "Contact submission deleted successfully"));
});
