import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { createSlug } from "../helpers/Slug.js";
import { deleteR2Image } from "../utils/r2.js";

export const categoryService = {
  list: async () => {
    return prisma.category.findMany({
      include: {
        subCategories: {
          include: {
            _count: {
              select: { productLinks: true }
            }
          }
        },
        _count: {
          select: { productLinks: true }
        }
      },
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    });
  },

  getById: async (id) => {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { subCategories: true },
    });
    if (!category) throw new ApiError(404, "Category not found");
    return category;
  },

  create: async (body) => {
    if (!body.name) throw new ApiError(400, "Category name is required");
    const slug = body.slug || createSlug(body.name);

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) throw new ApiError(400, "Category with this name/slug already exists");

    return prisma.category.create({
      data: {
        name: body.name,
        slug,
        description: body.description || null,
        imageUrl: body.imageUrl || null,
        order: body.order ? Number(body.order) : 0,
        isActive: body.isActive !== false,
      },
    });
  },

  update: async (id, body) => {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Category not found");

    const slug = body.slug || createSlug(body.name || existing.name);
    if (slug !== existing.slug) {
      const dupe = await prisma.category.findUnique({ where: { slug } });
      if (dupe) throw new ApiError(400, "Slug is already in use");
    }

    return prisma.category.update({
      where: { id },
      data: {
        name: body.name || existing.name,
        slug,
        description: body.description !== undefined ? body.description : existing.description,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl : existing.imageUrl,
        order: body.order !== undefined ? Number(body.order) : existing.order,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
      },
    });
  },

  delete: async (id) => {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Category not found");

    if (existing.imageUrl) {
      await deleteR2Image(existing.imageUrl);
    }

    await prisma.category.delete({ where: { id } });
    return { success: true };
  },

  // Subcategory operations
  createSub: async (categoryId, body) => {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new ApiError(404, "Parent Category not found");

    if (!body.name) throw new ApiError(400, "Subcategory name is required");
    const slug = body.slug || createSlug(body.name);

    const existing = await prisma.subCategory.findUnique({ where: { slug } });
    if (existing) throw new ApiError(400, "Subcategory with this slug already exists");

    return prisma.subCategory.create({
      data: {
        categoryId,
        name: body.name,
        slug,
        description: body.description || null,
        imageUrl: body.imageUrl || null,
        order: body.order ? Number(body.order) : 0,
        isActive: body.isActive !== false,
      },
    });
  },

  updateSub: async (subId, body) => {
    const existing = await prisma.subCategory.findUnique({ where: { id: subId } });
    if (!existing) throw new ApiError(404, "Subcategory not found");

    const slug = body.slug || createSlug(body.name || existing.name);
    if (slug !== existing.slug) {
      const dupe = await prisma.subCategory.findUnique({ where: { slug } });
      if (dupe) throw new ApiError(400, "Slug is already in use");
    }

    return prisma.subCategory.update({
      where: { id: subId },
      data: {
        name: body.name || existing.name,
        slug,
        description: body.description !== undefined ? body.description : existing.description,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl : existing.imageUrl,
        order: body.order !== undefined ? Number(body.order) : existing.order,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
      },
    });
  },

  deleteSub: async (subId) => {
    const existing = await prisma.subCategory.findUnique({ where: { id: subId } });
    if (!existing) throw new ApiError(404, "Subcategory not found");

    if (existing.imageUrl) {
      await deleteR2Image(existing.imageUrl);
    }

    await prisma.subCategory.delete({ where: { id: subId } });
    return { success: true };
  },
};
