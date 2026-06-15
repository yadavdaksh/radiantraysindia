import { Router } from "express";
import {
  addReview,
  updateReview,
  deleteReview,
  listProductReviews,
  getProductRating,
} from "../controllers/review.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.get("/product/:productId", listProductReviews);
router.get("/product/:productId/rating", getProductRating);

// Protected routes
router.post("/", requireAuth, addReview);
router.put("/:id", requireAuth, updateReview);
router.delete("/:id", requireAuth, deleteReview);

export default router;
