import crypto from "crypto";
import Razorpay from "razorpay";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paymentService } from "../services/payment.service.js";

const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

const decimal = (value) => new Prisma.Decimal(Number(value || 0));

export const createOrder = asyncHandler(async (req, res) => {
  const { customerName, customerEmail, customerPhone, items = [], shippingAddress, billingAddress, notes } = req.body;
  if (!customerName || !customerPhone || !items.length) {
    throw new ApiError(400, "Customer details and items are required");
  }

  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  });

  const productMap = new Map(products.map((product) => [product.id, product]));
  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) throw new ApiError(400, "One or more products are invalid");
    if (product.productType !== "B2C") {
      throw new ApiError(400, "Only B2C products can be ordered");
    }

    const variant =
      item.variantId && product.variants.find((entry) => entry.id === item.variantId);
    const unitPrice = Number(variant?.price ?? product.basePrice ?? 0);
    const quantity = Math.max(Number(item.quantity || 1), 1);
    subtotal += unitPrice * quantity;

    orderItems.push({
      productId: product.id,
      variantId: variant?.id || null,
      productName: product.name,
      variantName: variant?.name || null,
      sku: variant?.sku || product.sku,
      quantity,
      unitPrice: decimal(unitPrice),
      totalPrice: decimal(unitPrice * quantity),
    });
  }

  const orderNumber = `RR-${Date.now().toString().slice(-8)}`;
  const finalTotal = subtotal;
  const created = await prisma.order.create({
    data: {
      orderNumber,
      customerName,
      customerEmail: customerEmail || null,
      customerPhone,
      subtotal: decimal(subtotal),
      total: decimal(finalTotal),
      shippingAddress: shippingAddress || null,
      billingAddress: billingAddress || null,
      notes: notes || null,
      items: {
        create: orderItems,
      },
    },
    include: {
      items: true,
    },
  });

  let razorpayOrder = null;
  try {
    razorpayOrder = await paymentService.createOrder(created.id);
  } catch (err) {
    console.error("Razorpay order creation failed during createOrder:", err.message);
  }

  res.status(201).json(
    new ApiResponsive(201, {
      order: created,
      razorpayOrder,
    }, "Order created")
  );
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Razorpay verification parameters are required");
  }

  const result = await paymentService.verifyPayment(req.body);
  res.json(new ApiResponsive(200, result, "Payment verified successfully"));
});

export const listOrders = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
  const skip = (page - 1) * limit;
  const status = req.query.status;
  const paymentStatus = req.query.paymentStatus;

  const where = {
    ...(status ? { status } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  res.json(
    new ApiResponsive(200, {
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    })
  );
});

export const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new ApiError(404, "Order not found");

  const newStatus = req.body.status || order.status;
  const updated = await prisma.$transaction(async (tx) => {
    const o = await tx.order.update({
      where: { id },
      data: {
        status: newStatus,
        paymentStatus: req.body.paymentStatus || order.paymentStatus,
        notes: req.body.notes ?? order.notes,
      },
    });
    // Log status change with reason
    if (newStatus !== order.status) {
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: newStatus,
          notes: req.body.reason || req.body.notes || `Status updated to ${newStatus}`,
          updatedById: req.user?.id || null,
        },
      });
    }
    return o;
  });

  res.json(new ApiResponsive(200, updated, "Order updated"));
});

// ── Customer-facing order routes ──────────────────────────────────────────────

export const listMyOrders = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const orders = await prisma.order.findMany({
    where: { customerId },
    include: {
      items: {
        include: {
          product: { select: { name: true, slug: true, images: true } },
          variant: { select: { name: true, images: true, imageUrl: true } },
        },
      },
      shipments: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(new ApiResponsive(200, orders));
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, customerId },
    include: {
      items: {
        include: {
          product: { select: { name: true, slug: true, images: true, productType: true } },
          variant: { select: { name: true, images: true, imageUrl: true, sku: true } },
        },
      },
      payments: true,
      shipments: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) throw new ApiError(404, "Order not found");
  res.json(new ApiResponsive(200, order));
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const { reason } = req.body;
  if (!reason?.trim()) throw new ApiError(400, "Cancellation reason is required");

  const order = await prisma.order.findFirst({ where: { id: req.params.id, customerId } });
  if (!order) throw new ApiError(404, "Order not found");
  if (!["PENDING", "PAID"].includes(order.status)) {
    throw new ApiError(400, `Cannot cancel order in ${order.status} status`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const o = await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "CANCELLED",
        notes: `Cancelled by customer. Reason: ${reason.trim()}`,
      },
    });
    return o;
  });

  res.json(new ApiResponsive(200, updated, "Order cancelled"));
});

export const returnMyOrder = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const { reason } = req.body;
  if (!reason?.trim()) throw new ApiError(400, "Return reason is required");

  const order = await prisma.order.findFirst({ where: { id: req.params.id, customerId } });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.status !== "DELIVERED") {
    throw new ApiError(400, "Only delivered orders can be returned");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const o = await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" }, // marks for return processing
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "CANCELLED",
        notes: `Return requested by customer. Reason: ${reason.trim()}`,
      },
    });
    return o;
  });

  res.json(new ApiResponsive(200, updated, "Return request submitted. Our team will contact you within 24 hours."));
});

