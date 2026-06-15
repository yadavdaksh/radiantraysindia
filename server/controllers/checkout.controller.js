import { orderService } from "../services/order.service.js";
import { paymentService } from "../services/payment.service.js";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const validateCheckout = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const { couponCode } = req.body;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      cart: {
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      },
    },
  });

  if (!customer || !customer.cart || !customer.cart.items.length) {
    throw new ApiError(400, "Your cart is empty");
  }

  let subtotal = 0;
  const validationDetails = [];

  for (const item of customer.cart.items) {
    const price = item.variant
      ? item.variant.price || item.product.basePrice
      : item.product.basePrice;

    if (!price) {
      throw new ApiError(400, `Product ${item.product.name} is missing a base price`);
    }

    // Stock check
    if (item.variant && item.variant.stock < item.quantity) {
      throw new ApiError(
        400,
        `Insufficient stock for variant "${item.variant.name}" of product "${item.product.name}"`
      );
    }

    const itemTotal = Number(price) * item.quantity;
    subtotal += itemTotal;

    validationDetails.push({
      productId: item.productId,
      variantId: item.variantId,
      name: item.product.name,
      variantName: item.variant?.name || null,
      sku: item.variant?.sku || item.product.sku,
      quantity: item.quantity,
      unitPrice: Number(price),
      totalPrice: itemTotal,
      inStock: true,
    });
  }

  let discount = 0;
  let coupon = null;
  if (couponCode) {
    try {
      const validation = await orderService.validateCoupon(couponCode, subtotal);
      discount = validation.discount;
      coupon = validation.coupon;
    } catch (err) {
      throw new ApiError(400, err.message || "Invalid coupon code");
    }
  }

  const taxRate = 18; // 18% standard Cleanroom tax
  const taxableAmount = Math.max(subtotal - discount, 0);
  const tax = (taxableAmount * taxRate) / 100;
  const shipping = taxableAmount > 5000 ? 0 : 250; // free shipping above 5000 INR
  const total = taxableAmount + tax + shipping;

  res.json(
    new ApiResponsive(
      200,
      {
        items: validationDetails,
        subtotal,
        discount,
        couponCode: coupon?.code || null,
        tax,
        shipping,
        total,
      },
      "Checkout validated successfully"
    )
  );
});

export const placeOrder = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const { addressId, couponCode, notes } = req.body;

  if (!addressId) throw new ApiError(400, "Shipping address ID is required");

  // Call the robust checkout method inside orderService
  const order = await orderService.checkout(customerId, {
    addressId,
    couponCode,
    notes,
  });

  // Create Razorpay order details
  let razorpayOrder = null;
  try {
    razorpayOrder = await paymentService.createOrder(order.id);
  } catch (err) {
    console.error("Razorpay order creation failed during checkout:", err.message);
  }

  res.status(201).json(
    new ApiResponsive(
      201,
      {
        order,
        razorpayOrder,
      },
      "Order placed successfully"
    )
  );
});
