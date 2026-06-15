import { reviewService } from "../services/review.service.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const addReview = asyncHandler(async (req, res) => {
  const review = await reviewService.create(req.user.id, req.body);
  res.status(201).json(new ApiResponsive(201, review, "Review added successfully"));
});

export const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const review = await reviewService.update(req.user.id, id, req.body);
  res.json(new ApiResponsive(200, review, "Review updated successfully"));
});

export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user && req.user.role !== "CUSTOMER";
  await reviewService.delete(req.user?.id, id, isAdmin);
  res.json(new ApiResponsive(200, null, "Review deleted successfully"));
});

export const listProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const reviews = await reviewService.listByProduct(productId, req.query);
  res.json(new ApiResponsive(200, reviews, "Reviews retrieved successfully"));
});

export const getProductRating = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const ratingData = await reviewService.getAverageRating(productId);
  res.json(new ApiResponsive(200, ratingData, "Rating data retrieved successfully"));
});
