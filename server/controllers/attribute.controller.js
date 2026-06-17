import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ── Attributes ────────────────────────────────────────────────────────────────

export const listAttributes = asyncHandler(async (_req, res) => {
  const attrs = await prisma.attribute.findMany({
    include: { values: { orderBy: { value: "asc" } } },
    orderBy: { name: "asc" },
  });
  res.json(new ApiResponsive(200, attrs));
});

export const createAttribute = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) throw new ApiError(400, "Attribute name is required");
  const existing = await prisma.attribute.findUnique({ where: { name: name.trim() } });
  if (existing) throw new ApiError(409, "Attribute already exists");
  const attr = await prisma.attribute.create({
    data: { name: name.trim() },
    include: { values: true },
  });
  res.status(201).json(new ApiResponsive(201, attr, "Attribute created"));
});

export const updateAttribute = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.attribute.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Attribute not found");
  const attr = await prisma.attribute.update({
    where: { id },
    data: { name: req.body.name?.trim() || existing.name },
    include: { values: true },
  });
  res.json(new ApiResponsive(200, attr, "Attribute updated"));
});

export const deleteAttribute = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.attribute.delete({ where: { id } });
  res.json(new ApiResponsive(200, null, "Attribute deleted"));
});

// ── Attribute Values ──────────────────────────────────────────────────────────

export const createAttributeValue = asyncHandler(async (req, res) => {
  const { attributeId } = req.params;
  const { value } = req.body;
  if (!value?.trim()) throw new ApiError(400, "Value is required");
  const attr = await prisma.attribute.findUnique({ where: { id: attributeId } });
  if (!attr) throw new ApiError(404, "Attribute not found");
  const av = await prisma.attributeValue.create({
    data: { attributeId, value: value.trim() },
  });
  res.status(201).json(new ApiResponsive(201, av, "Value added"));
});

export const deleteAttributeValue = asyncHandler(async (req, res) => {
  const { valueId } = req.params;
  await prisma.attributeValue.delete({ where: { id: valueId } });
  res.json(new ApiResponsive(200, null, "Value deleted"));
});

export const updateAttributeValue = asyncHandler(async (req, res) => {
  const { valueId } = req.params;
  const { value } = req.body;
  if (!value?.trim()) throw new ApiError(400, "Value is required");
  const av = await prisma.attributeValue.update({
    where: { id: valueId },
    data: { value: value.trim() },
  });
  res.json(new ApiResponsive(200, av, "Value updated"));
});
