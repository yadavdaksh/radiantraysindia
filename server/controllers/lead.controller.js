import { leadService } from "../services/lead.service.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createLead = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.auth && req.auth.isCustomer) {
    body.customerId = req.auth.sub;
  }
  const lead = await leadService.create(body);
  res.status(201).json(new ApiResponsive(201, lead, "Inquiry registered successfully"));
});

export const listLeads = asyncHandler(async (req, res) => {
  const customerId = req.user.role === "CUSTOMER" ? req.user.id : null;
  const result = await leadService.list(req.query, customerId);
  res.json(new ApiResponsive(200, result, "Leads retrieved successfully"));
});

export const updateLead = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;
  const lead = await leadService.updateStatus(req.params.id, status, adminNotes);
  res.json(new ApiResponsive(200, lead, "Lead updated successfully"));
});

export const deleteLead = asyncHandler(async (req, res) => {
  await leadService.delete(req.params.id);
  res.json(new ApiResponsive(200, null, "Lead deleted successfully"));
});
