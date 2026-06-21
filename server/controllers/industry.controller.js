import { industryService } from "../services/industry.service.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../utils/logActivity.js";

export const listIndustries = asyncHandler(async (req, res) => {
  const result = await industryService.list();
  res.json(new ApiResponsive(200, result, "Industries retrieved successfully"));
});

export const createIndustry = asyncHandler(async (req, res) => {
  const industry = await industryService.create(req.body);
  logActivity({ type: "CREATE", title: `Industry created: ${industry.name}`, entityType: "industry", entityId: industry.id, actorId: req.user?.id });
  res.status(201).json(new ApiResponsive(201, industry, "Industry created successfully"));
});

export const updateIndustry = asyncHandler(async (req, res) => {
  const industry = await industryService.update(req.params.id, req.body);
  logActivity({ type: "UPDATE", title: `Industry updated: ${industry.name}`, entityType: "industry", entityId: industry.id, actorId: req.user?.id });
  res.json(new ApiResponsive(200, industry, "Industry updated successfully"));
});

export const deleteIndustry = asyncHandler(async (req, res) => {
  await industryService.delete(req.params.id);
  logActivity({ type: "DELETE", title: `Industry deleted: ${req.params.id}`, entityType: "industry", entityId: req.params.id, actorId: req.user?.id });
  res.json(new ApiResponsive(200, null, "Industry deleted successfully"));
});
