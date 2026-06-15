import { productService } from "../services/product.service.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listProducts = asyncHandler(async (req, res) => {
  const result = await productService.list(req.query);
  res.json(new ApiResponsive(200, result, "Products retrieved successfully"));
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getBySlug(req.params.slug);
  res.json(new ApiResponsive(200, product, "Product retrieved successfully"));
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id);
  res.json(new ApiResponsive(200, product, "Product retrieved successfully"));
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.create(req.body);
  res.status(201).json(new ApiResponsive(201, product, "Product created successfully"));
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.update(req.params.id, req.body);
  res.json(new ApiResponsive(200, product, "Product updated successfully"));
});

export const duplicateProduct = asyncHandler(async (req, res) => {
  const product = await productService.duplicate(req.params.id);
  res.status(201).json(new ApiResponsive(201, product, "Product duplicated successfully"));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.delete(req.params.id);
  res.json(new ApiResponsive(200, null, "Product archived successfully"));
});

export const bulkProductActions = asyncHandler(async (req, res) => {
  const { ids, action } = req.body;
  await productService.bulk(ids, action);
  res.json(new ApiResponsive(200, null, "Bulk action completed successfully"));
});
