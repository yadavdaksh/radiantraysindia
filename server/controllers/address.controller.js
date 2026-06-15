import { orderService } from "../services/order.service.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await orderService.listAddresses(req.user.id);
  res.json(new ApiResponsive(200, addresses, "Addresses retrieved successfully"));
});

export const createAddress = asyncHandler(async (req, res) => {
  const address = await orderService.createAddress(req.user.id, req.body);
  res.status(201).json(new ApiResponsive(201, address, "Address created successfully"));
});

export const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const address = await orderService.updateAddress(req.user.id, id, req.body);
  res.json(new ApiResponsive(200, address, "Address updated successfully"));
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await orderService.deleteAddress(req.user.id, id);
  res.json(new ApiResponsive(200, null, "Address deleted successfully"));
});
