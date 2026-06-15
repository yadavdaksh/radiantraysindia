import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPaginationParams, formatPaginatedResponse } from "../helpers/pagination.js";

export const listCoupons = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const search = String(req.query.search || "").trim();

  const where = {
    ...(search ? { code: { contains: search, mode: "insensitive" } } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.coupon.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.coupon.count({ where }),
  ]);

  res.json(new ApiResponsive(200, formatPaginatedResponse(items, page, limit, total)));
});

export const getCoupon = asyncHandler(async (req, res) => {
  const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!coupon) throw new ApiError(404, "Coupon not found");
  res.json(new ApiResponsive(200, coupon));
});

export const createCoupon = asyncHandler(async (req, res) => {
  const {
    code, description, discountType, discountValue,
    minOrderValue, maxDiscount, usageLimit, startsAt, endsAt,
  } = req.body;

  if (!code || !discountType || !discountValue) {
    throw new ApiError(400, "Code, discountType, and discountValue are required");
  }

  const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (existing) throw new ApiError(409, "Coupon code already exists");

  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      description: description || null,
      discountType,
      discountValue,
      minOrderValue: minOrderValue || null,
      maxDiscount: maxDiscount || null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
      isActive: true,
    },
  });

  res.status(201).json(new ApiResponsive(201, coupon, "Coupon created successfully"));
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Coupon not found");

  const {
    description, discountType, discountValue,
    minOrderValue, maxDiscount, usageLimit,
    startsAt, endsAt, isActive,
  } = req.body;

  const updated = await prisma.coupon.update({
    where: { id },
    data: {
      description: description !== undefined ? description : existing.description,
      discountType: discountType || existing.discountType,
      discountValue: discountValue !== undefined ? discountValue : existing.discountValue,
      minOrderValue: minOrderValue !== undefined ? minOrderValue : existing.minOrderValue,
      maxDiscount: maxDiscount !== undefined ? maxDiscount : existing.maxDiscount,
      usageLimit: usageLimit !== undefined ? (usageLimit ? Number(usageLimit) : null) : existing.usageLimit,
      startsAt: startsAt !== undefined ? (startsAt ? new Date(startsAt) : null) : existing.startsAt,
      endsAt: endsAt !== undefined ? (endsAt ? new Date(endsAt) : null) : existing.endsAt,
      isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
    },
  });

  res.json(new ApiResponsive(200, updated, "Coupon updated successfully"));
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Coupon not found");
  await prisma.coupon.delete({ where: { id } });
  res.json(new ApiResponsive(200, null, "Coupon deleted successfully"));
});

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;
  if (!code || !orderAmount) throw new ApiError(400, "Code and orderAmount are required");

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.isActive) throw new ApiError(400, "Invalid or inactive coupon");

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw new ApiError(400, "Coupon not active yet");
  if (coupon.endsAt && coupon.endsAt < now) throw new ApiError(400, "Coupon has expired");
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, "Coupon usage limit reached");
  }
  if (coupon.minOrderValue && Number(orderAmount) < Number(coupon.minOrderValue)) {
    throw new ApiError(400, `Minimum order value is ₹${coupon.minOrderValue}`);
  }

  let discount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discount = (Number(orderAmount) * Number(coupon.discountValue)) / 100;
    if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
      discount = Number(coupon.maxDiscount);
    }
  } else {
    discount = Number(coupon.discountValue);
  }

  res.json(new ApiResponsive(200, { coupon, discount }, "Coupon is valid"));
});
