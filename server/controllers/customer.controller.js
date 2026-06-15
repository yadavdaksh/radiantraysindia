import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { orderService } from "../services/order.service.js";

export const getProfile = asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isVerified: true,
      isActive: true,
      createdAt: true,
    },
  });
  if (!customer) throw new ApiError(404, "Customer not found");
  res.json(new ApiResponsive(200, customer, "Profile retrieved successfully"));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const updated = await prisma.customer.update({
    where: { id: req.user.id },
    data: {
      name: name || undefined,
      phone: phone !== undefined ? phone : undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isVerified: true,
      createdAt: true,
    },
  });

  res.json(new ApiResponsive(200, updated, "Profile updated successfully"));
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getCustomerOrders(req.user.id);
  res.json(new ApiResponsive(200, orders, "Orders retrieved successfully"));
});

export const getMyOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await prisma.order.findFirst({
    where: { id, customerId: req.user.id },
    include: {
      items: { include: { product: true, variant: true } },
      payments: true,
      shipments: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) throw new ApiError(404, "Order not found");
  res.json(new ApiResponsive(200, order, "Order retrieved successfully"));
});
