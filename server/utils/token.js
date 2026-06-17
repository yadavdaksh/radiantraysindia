import crypto from "crypto";
import jwt from "jsonwebtoken";

export const ACCESS_COOKIE = "accessToken";
export const REFRESH_COOKIE = "refreshToken";

export const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.ACCESS_JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_LIFE || "15m",
  });

export const signRefreshToken = (payload) =>
  jwt.sign(
    { ...payload, jti: crypto.randomBytes(16).toString("hex") },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_LIFE || "7d" }
  );

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  path: "/",
};

export const setAuthCookies = (res, { accessToken, refreshToken }, isCustomer = false) => {
  const refreshMaxAge = 7 * 24 * 60 * 60 * 1000;
  const accessMaxAge = 15 * 60 * 1000;

  if (isCustomer) {
    res.cookie("customerAccessToken", accessToken, {
      ...authCookieOptions,
      maxAge: accessMaxAge,
    });
    res.cookie("customerRefreshToken", refreshToken, {
      ...authCookieOptions,
      maxAge: refreshMaxAge,
    });
  } else {
    res.cookie("adminAccessToken", accessToken, {
      ...authCookieOptions,
      maxAge: accessMaxAge,
    });
    res.cookie("adminRefreshToken", refreshToken, {
      ...authCookieOptions,
      maxAge: refreshMaxAge,
    });
  }
};
export const clearAuthCookies = (res) => {
  res.clearCookie("customerAccessToken", authCookieOptions);
  res.clearCookie("customerRefreshToken", authCookieOptions);
  res.clearCookie("adminAccessToken", authCookieOptions);
  res.clearCookie("adminRefreshToken", authCookieOptions);
  res.clearCookie(ACCESS_COOKIE, authCookieOptions);
  res.clearCookie(REFRESH_COOKIE, authCookieOptions);
};

