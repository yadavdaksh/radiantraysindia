import { Router } from "express";
import {
  createShipment,
  cancelShipment,
  syncShipmentTracking,
  getShipmentLabel,
  getShipmentManifest,
  getShiprocketSettings,
  updateShiprocketSettings,
  listPickupAddresses,
  createPickupAddress,
  getRates,
} from "../controllers/shipment.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/create", requirePermission("order", "update"), createShipment);
router.get("/rates/:orderId", requirePermission("order", "read"), getRates);
router.post("/cancel", requirePermission("order", "update"), cancelShipment);
router.post("/sync", requirePermission("order", "update"), syncShipmentTracking);
router.get("/label/:shipmentId", requirePermission("order", "read"), getShipmentLabel);
router.get("/manifest/:shipmentId", requirePermission("order", "read"), getShipmentManifest);
router.get("/settings", requirePermission("setting", "read"), getShiprocketSettings);
router.put("/settings", requirePermission("setting", "update"), updateShiprocketSettings);
router.get("/pickup-addresses", requirePermission("setting", "read"), listPickupAddresses);
router.post("/pickup-addresses", requirePermission("setting", "update"), createPickupAddress);

export default router;
