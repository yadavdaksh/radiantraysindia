import { prisma } from "../config/db.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const selectProduct = {
  categories: {
    include: { category: true },
  },
  subCategories: {
    include: { subCategory: true },
  },
  industries: {
    include: { industry: true },
  },
  variants: {
    include: {
      images: true,
      attributes: {
        include: { attributeValue: { include: { attribute: true } } },
      },
    },
  },
  images: true,
  documents: true,
};

export const homeData = asyncHandler(async (_req, res) => {
  const [featuredProducts, categories, industries, testimonials, gallery, banners] =
    await prisma.$transaction([
      prisma.product.findMany({
        where: { featured: true, isActive: true },
        include: selectProduct,
        take: 8,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        take: 12,
        orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
      }),
      prisma.industry.findMany({
        where: { isActive: true },
        take: 12,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.testimonial.findMany({
        where: { isActive: true },
        take: 6,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.gallery.findMany({
        where: { isActive: true },
        take: 12,
        orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      }),
      prisma.banner.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

  res.json(
    new ApiResponsive(200, {
      featuredProducts,
      categories,
      industries,
      testimonials,
      gallery,
      banners,
    })
  );
});

export const listPublicProducts = asyncHandler(async (req, res) => {
  const categorySlug = req.query.category;
  const industrySlug = req.query.industry;
  const productType  = req.query.type;
  const search       = String(req.query.q || req.query.search || "").trim();
  const limit        = Math.min(Number(req.query.limit || 50), 100);

  const where = {
    isActive: true,
    ...(productType ? { productType } : {}),
    ...(search ? { OR: [
      { name: { contains: search, mode: "insensitive" } },
      { shortDescription: { contains: search, mode: "insensitive" } },
    ]} : {}),
    ...(categorySlug ? { categories: { some: { category: { slug: categorySlug } } } } : {}),
    ...(industrySlug ? { industries: { some: { industry: { slug: industrySlug } } } } : {}),
  };

  const products = await prisma.product.findMany({
    where,
    include: selectProduct,
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  res.json(new ApiResponsive(200, products));
});

export const getPublicProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: selectProduct,
  });
  res.json(new ApiResponsive(200, product));
});

export const listPublicCategories = asyncHandler(async (_req, res) => {
  const items = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      subCategories: true,
    },
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
  });
  res.json(new ApiResponsive(200, items));
});

export const listPublicIndustries = asyncHandler(async (_req, res) => {
  const items = await prisma.industry.findMany({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });
  res.json(new ApiResponsive(200, items));
});

export const listPublicGallery = asyncHandler(async (_req, res) => {
  const items = await prisma.gallery.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    take: 50,
  });
  res.json(new ApiResponsive(200, items));
});

export const getPublicPage = asyncHandler(async (req, res) => {
  const item = await prisma.seoMeta.findFirst({
    where: {
      modelType: "page",
      modelId: req.params.slug,
    },
  });
  res.json(new ApiResponsive(200, item));
});

