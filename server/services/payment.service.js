import Razorpay from "razorpay";
import crypto from "crypto";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { emailService } from "./email.service.js";
import { orderService } from "./order.service.js";
import { Prisma } from "@prisma/client";

// Initialize Razorpay SDK
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mockKeyId",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "mockKeySecret",
});

const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.startsWith("rzp_test_mock");

export const paymentService = {
  createOrder: async (orderId) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new ApiError(404, "Order not found");

    const amountInPaise = Math.round(Number(order.total) * 100);

    let razorpayOrder;
    if (isMock) {
      // Create mock Razorpay order details for sandbox testing
      razorpayOrder = {
        id: `order_mock_${Date.now()}`,
        amount: amountInPaise,
        currency: "INR",
        receipt: order.orderNumber,
        status: "created",
      };
    } else {
      try {
        razorpayOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: order.orderNumber,
          payment_capture: 1,
        });
      } catch (err) {
        console.error("Razorpay order creation error:", err);
        throw new ApiError(500, "Failed to create payment order in Razorpay");
      }
    }

    // Save payment details in database
    await prisma.payment.create({
      data: {
        orderId: order.id,
        customerId: order.customerId,
        razorpayOrderId: razorpayOrder.id,
        amount: order.total,
        status: "PENDING",
      },
    });

    return razorpayOrder;
  },

  verifyPayment: async (body) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new ApiError(400, "Missing Razorpay verification parameters");
    }

    // Check payment record
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
      include: { order: true },
    });
    if (!payment) throw new ApiError(404, "Payment record not found");

    if (isMock) {
      // Mock validation success
      await paymentService.captureSuccess({
        paymentId: payment.id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        method: "Mock Card",
        response: { verified: "mocked" },
      });
      return { verified: true };
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      // Mark payment as failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", gatewayResponse: { error: "Signature mismatch" } },
      });
      throw new ApiError(400, "Payment signature verification failed");
    }

    // Retrieve payment details from Razorpay to log payment method
    let paymentDetails = {};
    try {
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (err) {
      console.warn("Failed to fetch Razorpay payment info. Logging standard verification:", err.message);
    }

    await paymentService.captureSuccess({
      paymentId: payment.id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      method: paymentDetails.method || "Razorpay API",
      response: paymentDetails,
    });

    return { verified: true };
  },

  captureSuccess: async ({ paymentId, razorpayPaymentId, razorpaySignature, method, response }) => {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          razorpayPaymentId,
          razorpaySignature,
          paymentMethod: method,
          status: "SUCCESS",
          gatewayResponse: response || null,
        },
        include: { order: true },
      });

      // Update Order Status
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: "PAID",
          paymentStatus: "SUCCESS",
        },
      });

      // Create Order status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: "PAID",
          notes: `Payment captured successfully via Razorpay. Payment ID: ${razorpayPaymentId}`,
        },
      });

      // Send payment email receipt
      try {
        await emailService.sendPaymentSuccess(payment.order.customerEmail, payment.order.customerName, {
          amount: payment.amount,
          paymentId: razorpayPaymentId,
          date: new Date(),
        });

        // Send order confirmation
        const fullOrder = await tx.order.findUnique({
          where: { id: payment.orderId },
          include: { items: true },
        });
        await emailService.sendOrderConfirmation(payment.order.customerEmail, payment.order.customerName, fullOrder);
      } catch (err) {
        console.warn("Failed to send order transaction emails:", err.message);
      }

      return payment;
    });
  },

  webhookHandler: async (req) => {
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!isMock && (!signature || !webhookSecret)) {
      throw new ApiError(400, "Missing webhook verification headers");
    }

    if (!isMock) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (expectedSignature !== signature) {
        throw new ApiError(400, "Invalid webhook signature");
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === "payment.captured") {
      const paymentEntity = payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId },
        include: { order: true },
      });

      if (payment && payment.status !== "SUCCESS") {
        await paymentService.captureSuccess({
          paymentId: payment.id,
          razorpayPaymentId,
          razorpaySignature: signature || "webhook_captured",
          method: paymentEntity.method,
          response: paymentEntity,
        });
      }
    }

    return { status: "OK" };
  },

  refund: async (paymentId, amount) => {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) throw new ApiError(404, "Payment record not found");
    if (payment.status !== "SUCCESS") throw new ApiError(400, "Can only refund successful payments");

    const refundAmount = amount ? Number(amount) : Number(payment.amount);
    const amountInPaise = Math.round(refundAmount * 100);

    let refundResponse;
    if (isMock) {
      refundResponse = {
        id: `rfnd_mock_${Date.now()}`,
        amount: amountInPaise,
        status: "processed",
      };
    } else {
      try {
        refundResponse = await razorpay.payments.refund(payment.razorpayPaymentId, {
          amount: amountInPaise,
        });
      } catch (err) {
        console.error("Razorpay refund error:", err);
        throw new ApiError(500, "Failed to process refund with Razorpay");
      }
    }

    // Log refund
    return prisma.$transaction(async (tx) => {
      // Update Payment status to REFUNDED
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: "REFUNDED",
          gatewayResponse: {
            ...(typeof payment.gatewayResponse === "object" ? payment.gatewayResponse : {}),
            refund: refundResponse,
          },
        },
      });

      // Update Order Status
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: "REFUNDED",
          paymentStatus: "REFUNDED",
        },
      });

      // Create Order status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: "REFUNDED",
          notes: `Refund of ₹${refundAmount.toFixed(2)} processed successfully. Refund ID: ${refundResponse.id}`,
        },
      });

      return { success: true };
    });
  },
};
