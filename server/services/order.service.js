import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { getPaginationParams, formatPaginatedResponse } from "../helpers/pagination.js";

export const orderService = {
  // Address management
  listAddresses: async (customerId) => {
    return prisma.address.findMany({
      where: { customerId },
      orderBy: { isDefault: "desc" },
    });
  },

  createAddress: async (customerId, body) => {
    if (!body.addressLine1 || !body.city || !body.state || !body.postalCode) {
      throw new ApiError(400, "AddressLine1, city, state, and postalCode are required");
    }

    return prisma.$transaction(async (tx) => {
      if (body.isDefault === true) {
        await tx.address.updateMany({
          where: { customerId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          customerId,
          label: body.label || "Home",
          addressLine1: body.addressLine1,
          addressLine2: body.addressLine2 || null,
          city: body.city,
          state: body.state,
          postalCode: body.postalCode,
          country: body.country || "India",
          isDefault: body.isDefault === true,
        },
      });
    });
  },

  updateAddress: async (customerId, addressId, body) => {
    const existing = await prisma.address.findFirst({
      where: { id: addressId, customerId },
    });
    if (!existing) throw new ApiError(404, "Address not found");

    return prisma.$transaction(async (tx) => {
      if (body.isDefault === true) {
        await tx.address.updateMany({
          where: { customerId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: addressId },
        data: {
          label: body.label || existing.label,
          addressLine1: body.addressLine1 || existing.addressLine1,
          addressLine2: body.addressLine2 !== undefined ? body.addressLine2 : existing.addressLine2,
          city: body.city || existing.city,
          state: body.state || existing.state,
          postalCode: body.postalCode || existing.postalCode,
          country: body.country || existing.country,
          isDefault: body.isDefault !== undefined ? Boolean(body.isDefault) : existing.isDefault,
        },
      });
    });
  },

  deleteAddress: async (customerId, addressId) => {
    const existing = await prisma.address.findFirst({
      where: { id: addressId, customerId },
    });
    if (!existing) throw new ApiError(404, "Address not found");

    await prisma.address.delete({ where: { id: addressId } });
    return { success: true };
  },

  // Cart management
  getCart: async (customerId) => {
    let cart = await prisma.cart.findUnique({
      where: { customerId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { customerId },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });
    }

    return cart;
  },

  addToCart: async (customerId, body) => {
    const { productId, variantId, quantity = 1 } = body;
    if (!productId) throw new ApiError(400, "Product ID is required");

    const cart = await orderService.getCart(customerId);

    // Verify product and stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || !product.isActive) {
      throw new ApiError(404, "Product not found or inactive");
    }

    let itemPrice = product.basePrice;

    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
      });
      if (!variant || !variant.isActive || variant.productId !== productId) {
        throw new ApiError(404, "Variant not found");
      }
      if (variant.stock < quantity) {
        throw new ApiError(400, `Insufficient stock. Only ${variant.stock} items available.`);
      }
      itemPrice = variant.price || itemPrice;
    }

    // Upsert cart item
    await prisma.cartItem.upsert({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId,
          variantId: variantId || null,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
        quantity,
      },
    });

    return orderService.getCart(customerId);
  },

  updateCartItem: async (customerId, itemId, quantity) => {
    if (quantity <= 0) {
      return orderService.deleteCartItem(customerId, itemId);
    }

    const cart = await orderService.getCart(customerId);
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.cartId !== cart.id) {
      throw new ApiError(404, "Cart item not found");
    }

    // Check stock if variant
    if (item.variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
      });
      if (variant && variant.stock < quantity) {
        throw new ApiError(400, `Insufficient stock. Only ${variant.stock} available.`);
      }
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return orderService.getCart(customerId);
  },

  deleteCartItem: async (customerId, itemId) => {
    const cart = await orderService.getCart(customerId);
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.cartId !== cart.id) {
      throw new ApiError(404, "Cart item not found");
    }

    await prisma.cartItem.delete({ where: { id: itemId } });
    return orderService.getCart(customerId);
  },

  clearCart: async (customerId) => {
    const cart = await orderService.getCart(customerId);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return orderService.getCart(customerId);
  },

  // Wishlist management
  getWishlist: async (customerId) => {
    return prisma.wishlist.findMany({
      where: { customerId },
      include: {
        product: {
          include: {
            images: true,
          },
        },
      },
    });
  },

  addToWishlist: async (customerId, productId) => {
    if (!productId) throw new ApiError(400, "Product ID is required");

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new ApiError(404, "Product not found");

    return prisma.wishlist.upsert({
      where: {
        customerId_productId: { customerId, productId },
      },
      update: {},
      create: { customerId, productId },
    });
  },

  removeFromWishlist: async (customerId, productId) => {
    await prisma.wishlist.delete({
      where: {
        customerId_productId: { customerId, productId },
      },
    });
    return { success: true };
  },

  // Checkout order handling
  validateCoupon: async (code, orderAmount) => {
    if (!code) throw new ApiError(400, "Coupon code is required");
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      throw new ApiError(400, "Invalid or inactive coupon code");
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new ApiError(400, "Coupon is not active yet");
    }

    if (coupon.endsAt && coupon.endsAt < now) {
      throw new ApiError(400, "Coupon has expired");
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new ApiError(400, "Coupon usage limit has been reached");
    }

    if (coupon.minOrderValue && Number(orderAmount) < Number(coupon.minOrderValue)) {
      throw new ApiError(400, `Minimum order value for this coupon is ₹${coupon.minOrderValue}`);
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

    return { coupon, discount };
  },

  checkout: async (customerId, body) => {
    const { addressId, couponCode, notes } = body;
    if (!addressId) throw new ApiError(400, "Shipping Address ID is required");

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

    const address = await prisma.address.findFirst({
      where: { id: addressId, customerId },
    });
    if (!address) throw new ApiError(404, "Address not found");

    // Calculate pricing totals
    let subtotal = 0;
    const itemsData = [];

    for (const item of customer.cart.items) {
      const price = item.variant ? (item.variant.price || item.product.basePrice) : item.product.basePrice;
      if (!price) {
        throw new ApiError(400, `Product ${item.product.name} is missing a base price`);
      }

      const itemTotal = Number(price) * item.quantity;
      subtotal += itemTotal;

      itemsData.push({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product.name,
        variantName: item.variant?.name || null,
        sku: item.variant?.sku || item.product.sku,
        quantity: item.quantity,
        unitPrice: price,
        totalPrice: itemTotal,
      });
    }

    // Apply Coupon
    let discount = 0;
    let validatedCoupon = null;
    if (couponCode) {
      try {
        const validation = await orderService.validateCoupon(couponCode, subtotal);
        discount = validation.discount;
        validatedCoupon = validation.coupon;
      } catch (err) {
        throw new ApiError(400, err.message);
      }
    }

    const taxRate = 18; // 18% standard Cleanroom tax
    const taxableAmount = Math.max(subtotal - discount, 0);
    const tax = (taxableAmount * taxRate) / 100;
    const shipping = taxableAmount > 5000 ? 0 : 250; // free shipping above 5000 INR
    const total = taxableAmount + tax + shipping;

    const orderNumber = `RR-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          customerId,
          orderNumber,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone || address.postalCode, // fallback if phone missing
          subtotal: new Prisma.Decimal(subtotal),
          discount: new Prisma.Decimal(discount),
          tax: new Prisma.Decimal(tax),
          shipping: new Prisma.Decimal(shipping),
          total: new Prisma.Decimal(total),
          couponCode: couponCode || null,
          couponDetails: validatedCoupon ? {
            code: validatedCoupon.code,
            description: validatedCoupon.description,
            discountType: validatedCoupon.discountType,
            discountValue: Number(validatedCoupon.discountValue),
            minOrderValue: validatedCoupon.minOrderValue ? Number(validatedCoupon.minOrderValue) : null,
            maxDiscount: validatedCoupon.maxDiscount ? Number(validatedCoupon.maxDiscount) : null,
          } : null,
          shippingAddress: address,
          billingAddress: address, // default same as shipping
          notes: notes || null,
          items: {
            create: itemsData.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.productName,
              variantName: item.variantName,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: new Prisma.Decimal(item.unitPrice),
              totalPrice: new Prisma.Decimal(item.totalPrice),
            })),
          },
          statusHistory: {
            create: {
              status: "PENDING",
              notes: "Order placed successfully, awaiting payment.",
            },
          },
        },
        include: {
          items: true,
        },
      });

      return newOrder;
    });

    return order;
  },

  // Admin order methods
  listOrders: async (query) => {
    const { page, limit, skip } = getPaginationParams(query);
    const status = query.status;
    const paymentStatus = query.paymentStatus;
    const search = String(query.search || "").trim();

    const where = {
      ...(status ? { status } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: "insensitive" } },
              { customerName: { contains: search, mode: "insensitive" } },
              { customerEmail: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          payments: true,
          shipments: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return formatPaginatedResponse(items, page, limit, total);
  },

  getOrderById: async (id) => {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
        shipments: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!order) throw new ApiError(404, "Order not found");
    return order;
  },

  getCustomerOrders: async (customerId) => {
    return prisma.order.findMany({
      where: { customerId },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  updateOrderStatus: async (id, status, notes, adminUserId = null) => {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new ApiError(404, "Order not found");

    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status,
          notes: notes || `Order status updated to ${status}`,
          updatedById: adminUserId,
        },
      });

      // Send status update email notification
      try {
        await emailService.sendOrderSuccess(order.customerEmail, order.customerName, updated);
      } catch (err) {
        console.warn("Failed to send status update email:", err.message);
      }

      return updated;
    });
  },
};
