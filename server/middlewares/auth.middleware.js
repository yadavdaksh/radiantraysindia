import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "../utils/token.js";

const resolveToken = (req, cookieName) => {
  const isCustomerPath = (req.originalUrl.includes("/customer") && !req.originalUrl.includes("/system/")) || 
                         req.originalUrl.includes("/cart") || 
                         req.originalUrl.includes("/addresses") || 
                         req.originalUrl.includes("/checkout") || 
                         req.originalUrl.includes("/wishlist") ||
                         req.originalUrl.includes("/reviews") ||
                         req.originalUrl.includes("/orders/mine") ||
                         (req.originalUrl.includes("/leads") && !req.headers.referer?.includes("5173") && !req.headers.origin?.includes("5173"));
  
  if (cookieName === ACCESS_COOKIE) {
    if (isCustomerPath) {
      return req.cookies?.customerAccessToken || req.cookies?.[cookieName] || req.headers?.authorization?.replace("Bearer ", "") || req.query?.token;
    } else {
      return req.cookies?.adminAccessToken || req.cookies?.[cookieName] || req.headers?.authorization?.replace("Bearer ", "") || req.query?.token;
    }
  }

  if (cookieName === REFRESH_COOKIE) {
    if (isCustomerPath) {
      return req.cookies?.customerRefreshToken || req.cookies?.[cookieName];
    } else {
      return req.cookies?.adminRefreshToken || req.cookies?.[cookieName];
    }
  }

  return req.cookies?.[cookieName] || req.headers?.authorization?.replace("Bearer ", "") || req.query?.token;
};

const buildPermissionSet = (permissions = []) =>
  new Set(permissions.map((permission) => `${permission.resource}:${permission.action}`));

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = resolveToken(req, ACCESS_COOKIE);
  if (!token) throw new ApiError(401, "Authentication required");

  const decoded = jwt.verify(token, process.env.ACCESS_JWT_SECRET);

  if (decoded.isCustomer) {
    // Prevent customer tokens from being used on admin-only routes (triggers 401 for redirect)
    const isAdminRoute = req.originalUrl.includes("/system/") ||
                         (req.originalUrl.includes("/orders") && !req.originalUrl.includes("/orders/mine")) ||
                         req.originalUrl.includes("/users") ||
                         req.originalUrl.includes("/roles") ||
                         req.originalUrl.includes("/permissions") ||
                         req.originalUrl.includes("/uploads");
    if (isAdminRoute) {
      throw new ApiError(401, "Admin authentication required");
    }

    const customer = await prisma.customer.findUnique({
      where: { id: decoded.sub },
    });

    if (!customer || !customer.isActive) {
      throw new ApiError(401, "Invalid or inactive customer account");
    }

    if (!customer.isVerified) {
      throw new ApiError(403, "Customer email is not verified");
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

