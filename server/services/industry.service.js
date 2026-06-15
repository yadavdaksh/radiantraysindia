import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { createSlug } from "../helpers/Slug.js";

export const industryService = {
  list: async () => {
    return prisma.industry.findMany({
      orderBy: { name: "asc" },
    });
  },

  getById: async (id) => {
    const industry = await prisma.industry.findUnique({
      where: { id },
    });
    if (!industry) throw new ApiError(404, "Industry not found");
    return industry;
  },

  create: async (body) => {
    if (!body.name) throw new ApiError(400, "Industry name is required");
    const slug = body.slug || createSlug(body.name);

    const existing = await prisma.industry.findUnique({ where: { slug } });
    if (existing) throw new ApiError(400, "Industry with this name/slug already exists");

    return prisma.industry.create({
      data: {
        name: body.name,
        slug,
        description: body.description || null,
        imageUrl: body.imageUrl || null,
        isActive: body.isActive !== false,
      },
    });
  },

  update: async (id, body) => {
    const existing = await prisma.industry.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Industry not found");

    const slug = body.slug || createSlug(body.name || existing.name);
    if (slug !== existing.slug) {
      const dupe = await prisma.industry.findUnique({ where: { slug } });
      if (dupe) throw new ApiError(400, "Slug is already in use");
    }

    return prisma.industry.update({
      where: { id },
      data: {
        name: body.name || existing.name,
        slug,
        description: body.description !== undefined ? body.description : existing.description,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl : existing.imageUrl,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
      },
    });
  },

  delete: async (id) => {
    const existing = await prisma.industry.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Industry not found");

    await prisma.industry.delete({ where: { id } });
    return { success: true };
  },
};
