import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "../utils/token.js";

const resolveToken = (req, cookieName) =>
  req.cookies?.[cookieName] ||
  req.headers?.authorization?.replace("Bearer ", "") ||
  req.query?.token;

const buildPermissionSet = (permissions = []) =>
  new Set(permissions.map((permission) => `${permission.resource}:${permission.action}`));

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = resolveToken(req, ACCESS_COOKIE);
  if (!token) throw new ApiError(401, "Authentication required");

  const decoded = jwt.verify(token, process.env.ACCESS_JWT_SECRET);

  if (decoded.isCustomer) {
    const customer = await prisma.customer.findUnique({
      where: { id: decoded.sub },
    });

    if (!customer || !customer.isActive) {
      throw new ApiError(401, "Invalid or inactive customer account");
    }

    req.user = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      role: "CUSTOMER",
      permissions: new Set(),
    };
  } else {
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, "Invalid or inactive account");
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role.name,
      permissions: buildPermissionSet(user.role.permissions.map((entry) => entry.permission)),
    };
  }

  next();
});

export const requireRole = (...roles) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) throw new ApiError(401, "Authentication required");
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "Insufficient role permissions");
    }
    next();
  });

export const requirePermission = (resource, action) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) throw new ApiError(401, "Authentication required");
    if (req.user.role === "SUPER_ADMIN") return next();

    const permission = `${resource}:${action}`;
    if (!req.user.permissions.has(permission)) {
      throw new ApiError(403, "Insufficient permissions");
    }
    next();
  });

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = resolveToken(req, ACCESS_COOKIE);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_JWT_SECRET);
    req.auth = decoded;
  } catch (_) {
    req.auth = null;
  }
  next();
});

export const requireRefreshToken = asyncHandler(async (req, _res, next) => {
  const token = resolveToken(req, REFRESH_COOKIE);
  if (!token) throw new ApiError(401, "Refresh token required");
  req.refreshToken = token;
  next();
});

