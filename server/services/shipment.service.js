import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import {
  processOrderForShipping,
  cancelShiprocketOrder,
  trackShipment,
  generateManifest,
  generateLabel,
  printManifest,
  getShiprocketSettings,
  checkServiceability
} from "../utils/shiprocket.js";
import { getPaginationParams, formatPaginatedResponse } from "../helpers/pagination.js";

export const shipmentService = {
  createShipment: async (orderId, courierId = null) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true, variant: true } } }
    });

    if (!order) throw new ApiError(404, "Order not found");

    // Process via Shiprocket utility
    const response = await processOrderForShipping(orderId, courierId);

    // Fetch the updated order (the utility modifies order fields directly)
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (updatedOrder && updatedOrder.shiprocketOrderId) {
      // Create or update record in Shipment table
      const shipment = await prisma.shipment.upsert({
        where: { id: orderId }, // using orderId or unique CUID
        update: {
          shiprocketOrderId: String(updatedOrder.shiprocketOrderId),
          shiprocketShipmentId: String(updatedOrder.shiprocketShipmentId),
          awbCode: updatedOrder.awbCode || null,
          status: updatedOrder.shiprocketStatus || "CREATED",
        },
        create: {
          orderId,
          shiprocketOrderId: String(updatedOrder.shiprocketOrderId),
          shiprocketShipmentId: String(updatedOrder.shiprocketShipmentId),
          awbCode: updatedOrder.awbCode || null,
          status: updatedOrder.shiprocketStatus || "CREATED",
        }
      });
      return shipment;
    }

    return null;
  },

  checkRates: async (orderId) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true, variant: true } } }
    });

    if (!order) throw new ApiError(404, "Order not found");

    const settings = await getShiprocketSettings();
    const pickupAddress = await prisma.shiprocketPickupAddress.findFirst({
      where: { isDefault: true }
    });

    if (!pickupAddress) throw new ApiError(400, "No pickup address configured");

    const shippingAddress = order.shippingAddress;
    if (!shippingAddress || !shippingAddress.postalCode) {
      throw new ApiError(400, "Order is missing delivery postal code");
    }

    // Calculate total weight — use variant.weight, fallback to defaultWeight from settings
    let totalWeight = 0;
    for (const item of order.items) {
      const weight = item.variant?.weight || settings.defaultWeight || 0.5;
      totalWeight += weight * item.quantity;
    }

    try {
      const response = await checkServiceability({
        pickupPincode: String(pickupAddress.pincode),
        deliveryPincode: String(shippingAddress.postalCode),
        weight: totalWeight,
        cod: order.paymentMethod === "CASH"
      });

      return response.data || response;
    } catch (error) {
      const isCreds = error.message?.includes("credentials not configured") || error.message?.includes("401");
      throw new ApiError(503, isCreds ? "Shiprocket not configured — add credentials in Settings → Shiprocket tab" : `Shiprocket error: ${error.message}`);
    }
  },

  cancelShipment: async (orderId) => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || !order.shiprocketOrderId) {
      throw new ApiError(400, "Order does not have a linked Shiprocket order ID");
    }

    // Cancel in Shiprocket
    await cancelShiprocketOrder(order.shiprocketOrderId);

    // Update Order & Shipment
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" }
    });

    await prisma.shipment.updateMany({
      where: { orderId },
      data: { status: "CANCELLED" }
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: "CANCELLED",
        notes: "Shipment cancelled via Shiprocket."
      }
    });

    return { success: true };
  },

  syncTracking: async (orderId) => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || !order.awbCode) {
      throw new ApiError(400, "AWB Code not assigned to this order");
    }

    // Fetch tracking details
    const trackingResponse = await trackShipment(order.awbCode);
    const trackingData = trackingResponse?.tracking_data || {};
    const shipmentTrack = trackingData.shipment_track?.[0] || {};

    const status = shipmentTrack.current_status || "UNKNOWN";
    const statusDetails = shipmentTrack.current_status_body || null;

    // Update Shipment in database
    await prisma.shipment.updateMany({
      where: { orderId },
      data: {
        status,
        statusDetails,
      }
    });

    // Map Shiprocket status to Order status
    let orderStatus = order.status;
    if (status === "Delivered") {
      orderStatus = "DELIVERED";
    } else if (["In Transit", "Out For Delivery", "Shipped"].includes(status)) {
      orderStatus = "SHIPPED";
    } else if (status === "Cancelled") {
      orderStatus = "CANCELLED";
    }

    if (orderStatus !== order.status) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: orderStatus }
      });

      await prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: orderStatus,
          notes: `Shiprocket tracking synced. Current courier status: ${status}.`
        }
      });
    }

    return { status, statusDetails };
  },

  getLabel: async (shipmentId) => {
    const response = await generateLabel(shipmentId);
    const labelUrl = response?.label_url || null;

    await prisma.shipment.updateMany({
      where: { shiprocketShipmentId: String(shipmentId) },
      data: { labelUrl }
    });

    return { labelUrl };
  },

  getManifest: async (shipmentId) => {
    const response = await generateManifest(shipmentId);
    const manifestUrl = response?.manifest_url || null;

    await prisma.shipment.updateMany({
      where: { shiprocketShipmentId: String(shipmentId) },
      data: { manifestUrl }
    });

    return { manifestUrl };
  },

  getSettings: async () => {
    return getShiprocketSettings();
  },

  updateSettings: async (body) => {
    const settings = await getShiprocketSettings();
    return prisma.shiprocketSettings.update({
      where: { id: settings.id },
      data: {
        isEnabled: body.isEnabled !== undefined ? Boolean(body.isEnabled) : settings.isEnabled,
        email: body.email || settings.email,
        password: body.password || settings.password,
        defaultLength: body.defaultLength !== undefined ? Number(body.defaultLength) : settings.defaultLength,
        defaultBreadth: body.defaultBreadth !== undefined ? Number(body.defaultBreadth) : settings.defaultBreadth,
        defaultHeight: body.defaultHeight !== undefined ? Number(body.defaultHeight) : settings.defaultHeight,
        defaultWeight: body.defaultWeight !== undefined ? Number(body.defaultWeight) : settings.defaultWeight,
      }
    });
  },

  listPickupAddresses: async () => {
    return prisma.shiprocketPickupAddress.findMany({
      orderBy: { isDefault: "desc" }
    });
  },

  createPickupAddress: async (body) => {
    if (!body.nickname || !body.name || !body.email || !body.phone || !body.address || !body.city || !body.state || !body.pincode) {
      throw new ApiError(400, "All primary address fields are required");
    }

    return prisma.$transaction(async (tx) => {
      if (body.isDefault === true) {
        await tx.shiprocketPickupAddress.updateMany({
          where: { isDefault: true },
          data: { isDefault: false }
        });
      }

      return tx.shiprocketPickupAddress.create({
        data: {
          nickname: body.nickname,
          name: body.name,
          email: body.email,
          phone: body.phone,
          address: body.address,
          address2: body.address2 || null,
          city: body.city,
          state: body.state,
          country: body.country || "India",
          pincode: Number(body.pincode),
          isDefault: body.isDefault === true,
        }
      });
    });
  }
};
