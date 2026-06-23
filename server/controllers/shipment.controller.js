import { shipmentService } from "../services/shipment.service.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../utils/logActivity.js";

export const createShipment = asyncHandler(async (req, res) => {
  const { orderId, courierId } = req.body;
  const shipment = await shipmentService.createShipment(orderId, courierId);
  res.status(201).json(new ApiResponsive(201, shipment, "Shipment processed in Shiprocket successfully"));
});

export const getRates = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const rates = await shipmentService.checkRates(orderId);
  res.json(new ApiResponsive(200, rates, "Courier rates retrieved successfully"));
});

export const cancelShipment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const result = await shipmentService.cancelShipment(orderId);
  res.json(new ApiResponsive(200, result, "Shipment cancelled successfully"));
});

export const syncShipmentTracking = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const tracking = await shipmentService.syncTracking(orderId);
  res.json(new ApiResponsive(200, tracking, "Shipment tracking updated successfully"));
});

export const getShipmentLabel = asyncHandler(async (req, res) => {
  const { shipmentId } = req.params;
  const label = await shipmentService.getLabel(shipmentId);
  res.json(new ApiResponsive(200, label, "Label URL retrieved successfully"));
});

export const getShipmentManifest = asyncHandler(async (req, res) => {
  const { shipmentId } = req.params;
  const manifest = await shipmentService.getManifest(shipmentId);
  res.json(new ApiResponsive(200, manifest, "Manifest URL retrieved successfully"));
});

export const getShiprocketSettings = asyncHandler(async (req, res) => {
  const settings = await shipmentService.getSettings();
  res.json(new ApiResponsive(200, settings, "Shiprocket settings retrieved successfully"));
});

export const updateShiprocketSettings = asyncHandler(async (req, res) => {
  const settings = await shipmentService.updateSettings(req.body);
  logActivity({ type: "UPDATE", title: "Shiprocket settings updated", entityType: "setting", actorId: req.user?.id });
  res.json(new ApiResponsive(200, settings, "Shiprocket settings updated successfully"));
});

export const listPickupAddresses = asyncHandler(async (req, res) => {
  const addresses = await shipmentService.listPickupAddresses();
  res.json(new ApiResponsive(200, addresses, "Pickup addresses retrieved successfully"));
});

export const createPickupAddress = asyncHandler(async (req, res) => {
  const address = await shipmentService.createPickupAddress(req.body);
  logActivity({ type: "CREATE", title: `Pickup address created: ${address.nickname}`, entityType: "setting", entityId: address.id, actorId: req.user?.id });
  res.status(201).json(new ApiResponsive(201, address, "Pickup address created successfully"));
});
