import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getWishlist = asyncHandler(async (req, res) => {
  const items = await prisma.wishlist.findMany({
    where: { customerId: req.user.id },
    include: {
      product: {
        include: {
          images: true,
          variants: { where: { isDefault: true }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(new ApiResponsive(200, items, "Wishlist retrieved successfully"));
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) throw new ApiError(400, "Product ID is required");

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: productId }, { slug: productId }],
    },
  });
  if (!product) throw new ApiError(404, "Product not found");

  const existing = await prisma.wishlist.findUnique({
    where: { customerId_productId: { customerId: req.user.id, productId: product.id } },
  });

  if (existing) {
    return res.json(new ApiResponsive(200, existing, "Product already in wishlist"));
  }

  const item = await prisma.wishlist.create({
    data: { customerId: req.user.id, productId: product.id },
    include: { product: true },
  });

  res.status(201).json(new ApiResponsive(201, item, "Product added to wishlist"));
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: productId }, { slug: productId }],
    },
  });
  if (!product) throw new ApiError(404, "Product not found in wishlist");

  const existing = await prisma.wishlist.findUnique({
    where: { customerId_productId: { customerId: req.user.id, productId: product.id } },
  });

  if (!existing) throw new ApiError(404, "Product not found in wishlist");

  await prisma.wishlist.delete({
    where: { customerId_productId: { customerId: req.user.id, productId: product.id } },
  });

  res.json(new ApiResponsive(200, null, "Product removed from wishlist"));
});

export const clearWishlist = asyncHandler(async (req, res) => {
  await prisma.wishlist.deleteMany({ where: { customerId: req.user.id } });
  res.json(new ApiResponsive(200, null, "Wishlist cleared successfully"));
});
