import { categoryService } from "../services/category.service.js";
import { prisma } from "../config/db.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listCategories = asyncHandler(async (req, res) => {
  const result = await categoryService.list();
  res.json(new ApiResponsive(200, result, "Categories retrieved successfully"));
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.create(req.body);
  res.status(201).json(new ApiResponsive(201, category, "Category created successfully"));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.update(req.params.id, req.body);
  res.json(new ApiResponsive(200, category, "Category updated successfully"));
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.delete(req.params.id);
  res.json(new ApiResponsive(200, null, "Category deleted successfully"));
});

// Subcategory Controllers
export const listSubCategories = asyncHandler(async (req, res) => {
  const result = await prisma.subCategory.findMany({
    include: { category: true },
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
  });
  res.json(new ApiResponsive(200, result, "Subcategories retrieved successfully"));
});

export const createSubCategory = asyncHandler(async (req, res) => {
  const { categoryId, ...body } = req.body;
  const subCategory = await categoryService.createSub(categoryId, body);
  res.status(201).json(new ApiResponsive(201, subCategory, "Subcategory created successfully"));
});

export const updateSubCategory = asyncHandler(async (req, res) => {
  const subCategory = await categoryService.updateSub(req.params.id, req.body);
  res.json(new ApiResponsive(200, subCategory, "Subcategory updated successfully"));
});

export const deleteSubCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteSub(req.params.id);
  res.json(new ApiResponsive(200, null, "Subcategory deleted successfully"));
});
