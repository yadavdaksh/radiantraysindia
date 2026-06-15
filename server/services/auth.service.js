import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { hashToken, signAccessToken, signRefreshToken } from "../utils/token.js";
import { generateOTP } from "../helpers/generateOTP.js";
import { emailService } from "./email.service.js";

const generateAccessAndRefresh = async (userId, role, email, req, isCustomer = false) => {
  const accessToken = signAccessToken({
    sub: userId,
    role: role,
    email: email,
    isCustomer,
  });
  const refreshToken = signRefreshToken({
    sub: userId,
    role: role,
    isCustomer,
  });

  const hashedRefToken = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const device = req.headers["x-device-name"] || null;
  const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;
  const userAgent = req.headers["user-agent"] || null;

  if (isCustomer) {
    await prisma.customerRefreshToken.upsert({
      where: { tokenHash: hashedRefToken },
      update: { expiresAt, device, ipAddress, userAgent },
      create: { tokenHash: hashedRefToken, customerId: userId, expiresAt, device, ipAddress, userAgent },
    });

    // Create Customer Session
    await prisma.customerSession.create({
      data: {
        tokenHash: hashedRefToken,
        customerId: userId,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });
  } else {
    await prisma.refreshToken.upsert({
      where: { tokenHash: hashedRefToken },
      update: { expiresAt, device, ipAddress, userAgent },
      create: { tokenHash: hashedRefToken, userId, expiresAt, device, ipAddress, userAgent },
    });

    // Create User Session
    await prisma.userSession.create({
      data: {
        tokenHash: hashedRefToken,
        userId,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });
  }

  return { accessToken, refreshToken };
};

export const adminAuthService = {
  login: async (email, password, req) => {
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
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
      throw new ApiError(401, "Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefresh(
      user.id,
      user.role.name,
      user.email,
      req,
      false
    );

    const permissions = user.role.name === "SUPER_ADMIN"
      ? ["*"]
      : user.role.permissions.map((p) => `${p.permission.resource}:${p.permission.action}`);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.name,
        permissions,
      },
      accessToken,
      refreshToken,
    };
  },

  refresh: async (token, req) => {
    const hashed = hashToken(token);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashed },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      // Refresh token reuse detection or invalid token
      if (stored) {
        // Revoke all tokens for this user if reused (security breach)
        await prisma.refreshToken.updateMany({
          where: { userId: stored.userId },
          data: { revokedAt: new Date() },
        });
      }
      throw new ApiError(401, "Invalid, expired, or revoked refresh token");
    }

    // Refresh Rotation: revoke old token and create new ones
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    // Invalidate old session
    await prisma.userSession.updateMany({
      where: { tokenHash: hashed },
      data: { isActive: false },
    });

    const tokens = await generateAccessAndRefresh(
      stored.user.id,
      stored.user.role.name,
      stored.user.email,
      req,
      false
    );

    return tokens;
  },

  logout: async (token) => {
    const hashed = hashToken(token);
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashed },
      data: { revokedAt: new Date() },
    });
    await prisma.userSession.updateMany({
      where: { tokenHash: hashed },
      data: { isActive: false },
    });
  },

  logoutAll: async (userId) => {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await prisma.userSession.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  },

  bootstrap: async (name, email, password) => {
    const count = await prisma.user.count();
    if (count > 0) {
      throw new ApiError(409, "Bootstrap is only allowed when no users exist");
    }

    let superAdminRole = await prisma.role.findUnique({
      where: { name: "SUPER_ADMIN" },
    });

    if (!superAdminRole) {
      superAdminRole = await prisma.role.create({
        data: {
          name: "SUPER_ADMIN",
          label: "Super Administrator",
          description: "Full system access",
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        roleId: superAdminRole.id,
      },
    });

    return { id: user.id, name: user.name, email: user.email };
  },
};

export const customerAuthService = {
  register: async (name, email, password, phone) => {
    if (!name || !email || !password) {
      throw new ApiError(400, "Name, email, and password are required");
    }

    const existing = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      throw new ApiError(409, "Customer with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOTP(6);
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const customer = await prisma.customer.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        isVerified: false,
        verifyOtp: otp,
        verifyOtpExpires: otpExpiresAt,
      },
    });

    // Send verify email OTP
    await emailService.sendVerificationOtp(customer.email, customer.name, otp);

    return { id: customer.id, name: customer.name, email: customer.email, isVerified: false };
  },

  verifyOtp: async (email, otp, req) => {
    if (!email || !otp) {
      throw new ApiError(400, "Email and OTP are required");
    }

    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    if (customer.isVerified) {
      throw new ApiError(400, "Customer is already verified");
    }

    if (customer.verifyOtp !== otp || customer.verifyOtpExpires < new Date()) {
      throw new ApiError(400, "Invalid or expired OTP");
    }

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        isVerified: true,
        verifyOtp: null,
        verifyOtpExpires: null,
      },
    });

    const { accessToken, refreshToken } = await generateAccessAndRefresh(
      updated.id,
      "CUSTOMER",
      updated.email,
      req,
      true
    );

    // Send Welcome Email
    await emailService.sendWelcome(updated.email, updated.name);

    return {
      customer: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        isVerified: true,
      },
      accessToken,
      refreshToken,
    };
  },

  login: async (email, password, req) => {
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!customer || !customer.isActive) {
      throw new ApiError(401, "Invalid credentials");
    }

    if (!customer.isVerified) {
      // Regenerate OTP and request verification
      const otp = generateOTP(6);
      const otpExpires = new Date(Date.now() + 15 * 60 * 1000);
      await prisma.customer.update({
        where: { id: customer.id },
        data: { verifyOtp: otp, verifyOtpExpires: otpExpires },
      });
      await emailService.sendVerificationOtp(customer.email, customer.name, otp);
      throw new ApiError(403, "Email is not verified. A new OTP has been sent to your email.");
    }

    const valid = await bcrypt.compare(password, customer.password);
    if (!valid) {
      throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefresh(
      customer.id,
      "CUSTOMER",
      customer.email,
      req,
      true
    );

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        isVerified: true,
      },
      accessToken,
      refreshToken,
    };
  },

  refresh: async (token, req) => {
    const hashed = hashToken(token);
    const stored = await prisma.customerRefreshToken.findUnique({
      where: { tokenHash: hashed },
      include: { customer: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      if (stored) {
        await prisma.customerRefreshToken.updateMany({
          where: { customerId: stored.customerId },
          data: { revokedAt: new Date() },
        });
      }
      throw new ApiError(401, "Invalid, expired, or revoked refresh token");
    }

    await prisma.customerRefreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    await prisma.customerSession.updateMany({
      where: { tokenHash: hashed },
      data: { isActive: false },
    });

    const tokens = await generateAccessAndRefresh(
      stored.customer.id,
      "CUSTOMER",
      stored.customer.email,
      req,
      true
    );

    return tokens;
  },

  logout: async (token) => {
    const hashed = hashToken(token);
    await prisma.customerRefreshToken.updateMany({
      where: { tokenHash: hashed },
      data: { revokedAt: new Date() },
    });
    await prisma.customerSession.updateMany({
      where: { tokenHash: hashed },
      data: { isActive: false },
    });
  },

  logoutAll: async (customerId) => {
    await prisma.customerRefreshToken.updateMany({
      where: { customerId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await prisma.customerSession.updateMany({
      where: { customerId, isActive: true },
      data: { isActive: false },
    });
  },

  forgotPassword: async (email) => {
    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    const otp = generateOTP(6);
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        resetPasswordOtp: otp,
        resetPasswordOtpExpires: expires,
      },
    });

    await emailService.sendForgotPasswordOtp(customer.email, customer.name, otp);
  },

  resetPassword: async (email, otp, newPassword) => {
    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    if (customer.resetPasswordOtp !== otp || customer.resetPasswordOtpExpires < new Date()) {
      throw new ApiError(400, "Invalid or expired OTP");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        password: hashedPassword,
        resetPasswordOtp: null,
        resetPasswordOtpExpires: null,
      },
    });

    await emailService.sendPasswordChanged(customer.email, customer.name);
  },
};
