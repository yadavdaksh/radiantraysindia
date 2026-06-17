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
          variants: {
            include: {
              images: true,
              attributes: {
                include: {
                  attributeValue: {
                    include: { attribute: true },
                  },
                },
              },
            },
          },
        },
      },
      variant: {
        include: {
          images: true,
          attributes: {
            include: {
              attributeValue: {
                include: { attribute: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(new ApiResponsive(200, items, "Wishlist retrieved successfully"));
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId, variantId = null } = req.body;
  if (!productId) throw new ApiError(400, "Product ID is required");

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: productId }, { slug: productId }],
    },
  });
  if (!product) throw new ApiError(404, "Product not found");

  let variant = null;
  if (variantId) {
    variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId: product.id },
    });
    if (!variant) throw new ApiError(404, "Variant not found for this product");
  }

  const existing = await prisma.wishlist.findFirst({
    where: { customerId: req.user.id, productId: product.id, variantId: variant?.id || null },
  });

  if (existing) {
    return res.json(new ApiResponsive(200, existing, "Product already in wishlist"));
  }

  const item = await prisma.wishlist.create({
    data: { customerId: req.user.id, productId: product.id, variantId: variant?.id || null },
    include: {
      product: {
        include: {
          images: true,
          variants: true,
        },
      },
      variant: {
        include: {
          images: true,
          attributes: {
            include: {
              attributeValue: {
                include: { attribute: true },
              },
            },
          },
        },
      },
    },
  });

  res.status(201).json(new ApiResponsive(201, item, "Product added to wishlist"));
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const variantId = req.query.variantId || req.body?.variantId || null;

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: productId }, { slug: productId }],
    },
  });
  if (!product) throw new ApiError(404, "Product not found in wishlist");

  const existing = await prisma.wishlist.findFirst({
    where: {
      customerId: req.user.id,
      productId: product.id,
      variantId: variantId || null,
    },
  });

  if (!existing) throw new ApiError(404, "Product not found in wishlist");

  await prisma.wishlist.delete({
    where: { id: existing.id },
  });

  res.json(new ApiResponsive(200, null, "Product removed from wishlist"));
});

export const clearWishlist = asyncHandler(async (req, res) => {
  await prisma.wishlist.deleteMany({ where: { customerId: req.user.id } });
  res.json(new ApiResponsive(200, null, "Wishlist cleared successfully"));
});
