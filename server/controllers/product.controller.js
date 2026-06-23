import { productService } from "../services/product.service.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../utils/logActivity.js";

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
  logActivity({ type: "CREATE", title: `Product created: ${product.name}`, entityType: "product", entityId: product.id, actorId: req.user?.id });
  res.status(201).json(new ApiResponsive(201, product, "Product created successfully"));
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.update(req.params.id, req.body);
  logActivity({ type: "UPDATE", title: `Product updated: ${product.name}`, entityType: "product", entityId: product.id, actorId: req.user?.id });
  res.json(new ApiResponsive(200, product, "Product updated successfully"));
});

export const duplicateProduct = asyncHandler(async (req, res) => {
  const product = await productService.duplicate(req.params.id);
  logActivity({ type: "CREATE", title: `Product duplicated: ${product.name}`, entityType: "product", entityId: product.id, actorId: req.user?.id });
  res.status(201).json(new ApiResponsive(201, product, "Product duplicated successfully"));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.delete(req.params.id);
  logActivity({ type: "DELETE", title: `Product deleted: ${req.params.id}`, entityType: "product", entityId: req.params.id, actorId: req.user?.id });
  res.json(new ApiResponsive(200, null, "Product deleted successfully"));
});

export const bulkProductActions = asyncHandler(async (req, res) => {
  const { ids, action } = req.body;
  await productService.bulk(ids, action);
  logActivity({ type: "UPDATE", title: `Bulk product action: ${action} on ${ids?.length || 0} products`, entityType: "product", actorId: req.user?.id, metadata: { ids, action } });
  res.json(new ApiResponsive(200, null, "Bulk action completed successfully"));
});
