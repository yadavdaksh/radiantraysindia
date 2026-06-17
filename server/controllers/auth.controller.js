import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validatePassword } from "../helpers/validatePassword.js";
import {
  clearAuthCookies,
  hashToken,
  setAuthCookies,
  signAccessToken,
  signRefreshToken,
} from "../utils/token.js";
import { customerAuthService, adminAuthService } from "../services/auth.service.js";

const buildAuthPayload = (user, permissions = []) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role.name,
  permissions,
});

const permissionList = (role) =>
  role.name === "SUPER_ADMIN"
    ? ["*"]
    : role.permissions.map((entry) => `${entry.permission.resource}:${entry.permission.action}`);

const loadUserByEmail = (email) =>
  prisma.user.findUnique({
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

const createRefreshRecord = async ({ token, userId, req }) =>
  prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      device: req.headers["x-device-name"] || null,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
      userAgent: req.headers["user-agent"] || null,
    },
  });

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Attempt admin auth first
  const user = await loadUserByEmail(email);
  if (user && user.isActive) {
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new ApiError(401, "Invalid credentials");
    }

    const permissions = permissionList(user.role);
    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role.name,
      email: user.email,
    });
    const refreshToken = signRefreshToken({
      sub: user.id,
      role: user.role.name,
    });

    await createRefreshRecord({ token: refreshToken, userId: user.id, req });
    setAuthCookies(res, { accessToken, refreshToken }, false);

    const payload = buildAuthPayload(user, permissions);
    delete payload.password;

    return res.status(200).json(
      new ApiResponsive(200, { user: payload, accessToken }, "Login successful")
    );
  }

  // Fallback to customer login
  try {
    const result = await customerAuthService.login(email, password, req);
    setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken }, true);
    return res.status(200).json(
      new ApiResponsive(
        200,
        { customer: result.customer, accessToken: result.accessToken },
        "Login successful"
      )
    );
  } catch (err) {
    throw new ApiError(err.statusCode || 401, err.message || "Invalid credentials");
  }
});

export const customerLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password are required");
  const result = await customerAuthService.login(email, password, req);
  setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken }, true);
  res.status(200).json(new ApiResponsive(200, { customer: result.customer, accessToken: result.accessToken }, "Login successful"));
});

export const customerRegister = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  validatePassword(password);
  const result = await customerAuthService.register(name, email, password, phone);
  res.status(201).json(new ApiResponsive(201, result, "Registration successful. OTP sent."));
});

export const customerVerifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const result = await customerAuthService.verifyOtp(email, otp, req);
  setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken }, true);
  res.status(200).json(new ApiResponsive(200, { customer: result.customer, accessToken: result.accessToken }, "Email verified successfully"));
});

export const customerResendVerifyOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");
  await customerAuthService.resendVerificationOtp(email);
  res.status(200).json(new ApiResponsive(200, null, "Verification OTP resent successfully"));
});

export const customerForgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await customerAuthService.forgotPassword(email);
  res.status(200).json(new ApiResponsive(200, null, "Password reset OTP sent to email"));
});

export const customerResetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  validatePassword(newPassword);
  await customerAuthService.resetPassword(email, otp, newPassword);
  res.status(200).json(new ApiResponsive(200, null, "Password reset successfully"));
});

export const adminForgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // Always 200 — don't leak whether email exists
  if (!user || !user.isActive) {
    return res.status(200).json(new ApiResponsive(200, null, "If this email exists, a reset OTP was sent"));
  }

  const { generateOTP } = await import("../helpers/generateOTP.js");
  const { emailService } = await import("../services/email.service.js");

  const otp = generateOTP(6);
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  await prisma.user.update({
    where: { id: user.id },
    data: { resetOtp: otp, resetOtpExpires: expires },
  });

  try {
    await emailService.sendAdminNotification(
      user.email,
      "Admin Password Reset OTP",
      `Your OTP to reset admin password is: <strong>${otp}</strong><br>Valid for 15 minutes.`
    );
  } catch { /* email failure non-fatal */ }

  res.status(200).json(new ApiResponsive(200, null, "OTP sent to registered email"));
});

export const adminResetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    throw new ApiError(400, "Email, OTP and new password are required");
  }
  validatePassword(newPassword);

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.isActive) throw new ApiError(404, "Admin user not found");
  if (!user.resetOtp || user.resetOtp !== otp) throw new ApiError(400, "Invalid OTP");
  if (!user.resetOtpExpires || user.resetOtpExpires < new Date()) throw new ApiError(400, "OTP expired");

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetOtp: null, resetOtpExpires: null },
  });

  res.json(new ApiResponsive(200, null, "Password reset successfully. Please log in."));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }
  validatePassword(newPassword);

  const userId = req.user.id;
  const isCustomer = req.user.role === "CUSTOMER";

  if (isCustomer) {
    const customer = await prisma.customer.findUnique({ where: { id: userId } });
    if (!customer) throw new ApiError(404, "Customer not found");

    const valid = await bcrypt.compare(oldPassword, customer.password);
    if (!valid) throw new ApiError(400, "Invalid old password");

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.customer.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  } else {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, "User not found");

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) throw new ApiError(400, "Invalid old password");

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  res.json(new ApiResponsive(200, null, "Password changed successfully"));
});

export const me = asyncHandler(async (req, res) => {
  if (req.user.role === "CUSTOMER") {
    const customer = await prisma.customer.findUnique({
      where: { id: req.user.id }
    });
    if (!customer) throw new ApiError(404, "Customer not found");
    res.json(
      new ApiResponsive(200, {
        user: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          role: "CUSTOMER",
          permissions: [],
        }
      })
    );
  } else {
    const user = await loadUserByEmail(req.user.email);
    const permissions = permissionList(user.role);
    res.json(
      new ApiResponsive(200, {
        user: buildAuthPayload(user, permissions),
      })
    );
  }
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.adminRefreshToken || req.cookies?.customerRefreshToken || req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) throw new ApiError(401, "Refresh token required");

  const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

  let tokens;
  if (decoded.isCustomer) {
    tokens = await customerAuthService.refresh(token, req);
  } else {
    tokens = await adminAuthService.refresh(token, req);
  }

  setAuthCookies(res, tokens, decoded.isCustomer);
  res.json(
    new ApiResponsive(200, { accessToken: tokens.accessToken }, "Token refreshed successfully")
  );
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded?.isCustomer) {
        await customerAuthService.logout(token);
      } else {
        await adminAuthService.logout(token);
      }
    } catch (_) {}
  }

  clearAuthCookies(res);
  res.json(new ApiResponsive(200, null, "Logged out successfully"));
});

export const logoutAll = asyncHandler(async (req, res) => {
  const isCustomer = req.user.role === "CUSTOMER";
  if (isCustomer) {
    await customerAuthService.logoutAll(req.user.id);
  } else {
    await adminAuthService.logoutAll(req.user.id);
  }

  clearAuthCookies(res);
  res.json(new ApiResponsive(200, null, "Logged out from all devices"));
});

export const bootstrapAdmin = asyncHandler(async (req, res) => {
  const count = await prisma.user.count();
  if (count > 0) {
    throw new ApiError(409, "Bootstrap is only allowed when no users exist");
  }

  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }

  validatePassword(password);
  const result = await adminAuthService.bootstrap(name, email, password);
  res.status(201).json(new ApiResponsive(201, result, "Bootstrap user created"));
});
