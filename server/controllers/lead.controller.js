import { leadService } from "../services/lead.service.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createLead = asyncHandler(async (req, res) => {
  const lead = await leadService.create(req.body);
  res.status(201).json(new ApiResponsive(201, lead, "Inquiry registered successfully"));
});

export const listLeads = asyncHandler(async (req, res) => {
  const result = await leadService.list(req.query);
  res.json(new ApiResponsive(200, result, "Leads retrieved successfully"));
});

export const updateLead = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;
  const lead = await leadService.updateStatus(req.params.id, status, adminNotes);
  res.json(new ApiResponsive(200, lead, "Lead updated successfully"));
});
