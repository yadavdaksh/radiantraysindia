import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { getPaginationParams, formatPaginatedResponse } from "../helpers/pagination.js";

export const reviewService = {
  create: async (customerId, body) => {
    const { productId, rating, title, comment, images = [] } = body;

    if (!productId || !rating || !comment) {
      throw new ApiError(400, "ProductId, rating, and comment are required");
    }

    const numericRating = Math.max(1, Math.min(5, Number(rating)));

    // Verify product exists
    const productExists = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!productExists) throw new ApiError(404, "Product not found");

    // Check if customer has already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: { customerId, productId },
    });
    if (existingReview) {
      throw new ApiError(400, "You have already reviewed this product");
    }

    // Verified purchase check
    const verifiedOrder = await prisma.order.findFirst({
      where: {
        customerId,
        status: "DELIVERED", // must be delivered to verify
        items: {
          some: { productId },
        },
      },
    });
    const isVerified = !!verifiedOrder;

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          productId,
          customerId,
          rating: numericRating,
          title: title || null,
          comment,
          isVerified,
          images: {
            create: images.map((url) => ({ url })),
          },
        },
        include: {
          images: true,
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return created;
    });

    return review;
  },

  update: async (customerId, reviewId, body) => {
    const { rating, title, comment, images = [] } = body;

    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing) throw new ApiError(404, "Review not found");
    if (existing.customerId !== customerId) {
      throw new ApiError(403, "You can only update your own reviews");
    }

    const numericRating = rating !== undefined ? Math.max(1, Math.min(5, Number(rating))) : existing.rating;

    const updated = await prisma.$transaction(async (tx) => {
      // Delete old review images
      await tx.reviewImage.deleteMany({ where: { reviewId } });

      const record = await tx.review.update({
        where: { id: reviewId },
        data: {
          rating: numericRating,
          title: title !== undefined ? title : existing.title,
          comment: comment || existing.comment,
          images: {
            create: images.map((url) => ({ url })),
          },
        },
        include: {
          images: true,
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return record;
    });

    return updated;
  },

  delete: async (customerId, reviewId, isAdmin = false) => {
    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing) throw new ApiError(404, "Review not found");

    if (!isAdmin && existing.customerId !== customerId) {
      throw new ApiError(403, "You can only delete your own reviews");
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    return { success: true };
  },

  listByProduct: async (productId, query) => {
    const { page, limit, skip } = getPaginationParams(query);

    const where = { productId };

    const [items, total] = await prisma.$transaction([
      prisma.review.findMany({
        where,
        include: {
          images: true,
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return formatPaginatedResponse(items, page, limit, total);
  },

  getAverageRating: async (productId) => {
    const aggregates = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      averageRating: aggregates._avg.rating ? Number(aggregates._avg.rating.toFixed(1)) : 0,
      totalCount: aggregates._count.rating || 0,
    };
  },
};
