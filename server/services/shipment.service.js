import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import {
  processOrderForShipping,
  cancelShiprocketOrder,
  trackShipment,
  generateManifest,
  generateLabel,
  printManifest,
  getShiprocketSettings
} from "../utils/shiprocket.js";
import { getPaginationParams, formatPaginatedResponse } from "../helpers/pagination.js";

export const shipmentService = {
  createShipment: async (orderId) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true, variant: true } } }
    });

    if (!order) throw new ApiError(404, "Order not found");

    // Process via Shiprocket utility
    const response = await processOrderForShipping(orderId);

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
