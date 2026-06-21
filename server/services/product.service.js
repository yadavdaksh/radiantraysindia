import { Prisma } from "@prisma/client";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { createSlug } from "../helpers/Slug.js";
import { getPaginationParams, formatPaginatedResponse } from "../helpers/pagination.js";
import { emailService } from "./email.service.js";
import { deleteR2Image, deleteObjectFromR2 } from "../utils/r2.js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SMTP_SENDER || "info@radiantraysindia.com";
const LOW_STOCK_THRESHOLD = 5;

const fireLowStockAlerts = async (variants, productName) => {
  const low = variants.filter((v) => v.stock !== undefined && v.stock <= LOW_STOCK_THRESHOLD);
  for (const v of low) {
    emailService
      .sendLowStockAlert(ADMIN_EMAIL, productName, v.name || "Standard", v.sku || "", v.stock)
      .catch((err) => console.error("Low-stock alert failed:", err.message));
  }
};

const generateSku = (name) =>
  `${createSlug(name).replace(/-/g, "").slice(0, 4).toUpperCase()}-${Date.now()
    .toString()
    .slice(-6)}`;

const decimalOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? new Prisma.Decimal(number) : null;
};

const selectProductDetails = {
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
      documents: true,
      attributes: {
        include: {
          attributeValue: {
            include: { attribute: true },
          },
        },
      },
    },
  },
  images: true,
  documents: true,
};

export const productService = {
  list: async (query) => {
    const { page, limit, skip } = getPaginationParams(query);
    const search = String(query.search || "").trim();
    const productType = query.productType;
    const isActive = query.isActive;
    const featured = query.featured;
    const categorySlug = query.category;
    const industrySlug = query.industry;

    const where = {
      ...(productType ? { productType } : {}),
      ...(isActive === undefined ? {} : { isActive: String(isActive) === "true" }),
      ...(featured === undefined ? {} : { featured: String(featured) === "true" }),
      ...(search
        ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }
        : {}),
      ...(categorySlug
        ? {
          categories: {
            some: {
              category: { slug: categorySlug },
            },
          },
        }
        : {}),
      ...(industrySlug
        ? {
          industries: {
            some: {
              industry: { slug: industrySlug },
            },
          },
        }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: selectProductDetails,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return formatPaginatedResponse(items, page, limit, total);
  },

  getBySlug: async (slug) => {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: selectProductDetails,
    });
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    return product;
  },

  getById: async (id) => {
    const product = await prisma.product.findUnique({
      where: { id },
      include: selectProductDetails,
    });
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    return product;
  },

  create: async (body) => {
    if (!body.name) throw new ApiError(400, "Product name is required");

    const slug = body.slug || createSlug(body.name);
    const sku = body.sku || generateSku(body.name);

    // Check unique constraints
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug) throw new ApiError(400, "Product with this slug/name already exists");

    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) throw new ApiError(400, "Product with this SKU already exists");

    const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds : [];
    const subCategoryIds = Array.isArray(body.subCategoryIds) ? body.subCategoryIds : [];
    const industryIds = Array.isArray(body.industryIds) ? body.industryIds : [];
    const variants = Array.isArray(body.variants) ? body.variants : [];
    const images = Array.isArray(body.images) ? body.images : [];
    const documents = Array.isArray(body.documents) ? body.documents : [];

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: body.name,
          slug,
          sku,
          shortDescription: body.shortDescription || null,
          description: body.description || null,
          productType: body.productType || "B2B",
          basePrice: decimalOrNull(body.basePrice),
          salePrice: decimalOrNull(body.salePrice),
          badge: body.badge || null,
          featured: Boolean(body.featured),
          newArrival: Boolean(body.newArrival),
          trending: Boolean(body.trending),
          isActive: body.isActive !== false,
          b2bInquiryLabel: body.b2bInquiryLabel || "Request Quote",
          categories: {
            create: categoryIds.map((categoryId) => ({ categoryId })),
          },
          subCategories: {
            create: subCategoryIds.map((subCategoryId) => ({ subCategoryId })),
          },
          industries: {
            create: industryIds.map((industryId) => ({ industryId })),
          },
        },
      });

      if (variants.length) {
        for (const [index, variant] of variants.entries()) {
          const varSlug = createSlug(variant.name || `${created.name}-${index + 1}`);
          const varSku = variant.sku || generateSku(`${created.name}-${index + 1}`);

          const createdVariant = await tx.productVariant.create({
            data: {
              productId: created.id,
              name: variant.name || "Standard",
              slug: varSlug,
              sku: varSku,
              imageUrl: variant.imageUrl || null,
              price: decimalOrNull(variant.price),
              salePrice: decimalOrNull(variant.salePrice),
              stock: variant.stock ?? 0,
              specification: variant.specification || null,
              weight: variant.weight != null ? Number(variant.weight) : null,
              length: variant.length != null ? Number(variant.length) : null,
              width: variant.width != null ? Number(variant.width) : null,
              height: variant.height != null ? Number(variant.height) : null,
              hsnCode: variant.hsn || variant.hsnCode || null,
              packageDetails: variant.packageDetails || null,
              isDefault: Boolean(variant.isDefault),
              isActive: variant.isActive !== false,
            },
          });

          // Handle variant images if specified
          const variantImages = Array.isArray(variant.images) ? variant.images : [];
          if (variantImages.length) {
            await tx.variantImage.createMany({
              data: variantImages.map((img, i) => ({
                variantId: createdVariant.id,
                url: img.url,
                altText: img.altText || createdVariant.name,
                sortOrder: img.sortOrder ?? i,
              })),
            });
          }

          // Handle variant attributes mapping if attribute ids/values are provided
          const attributes = Array.isArray(variant.attributes) ? variant.attributes : [];
          for (const attr of attributes) {
            // attr format: { attributeId: "...", valueId: "..." }
            if (attr.attributeValueId) {
              await tx.productVariantAttribute.create({
                data: {
                  variantId: createdVariant.id,
                  attributeValueId: attr.attributeValueId,
                },
              });
            }
          }

          // Handle variant documents if specified
          const variantDocuments = Array.isArray(variant.documents) ? variant.documents : [];
          if (variantDocuments.length) {
            await tx.productDocument.createMany({
              data: variantDocuments.map((doc) => ({
                productId: created.id,
                variantId: createdVariant.id,
                title: doc.title,
                url: doc.url,
                key: doc.key || null,
                mimeType: doc.mimeType || null,
              })),
            });
          }
        }
      }

      if (images.length) {
        await tx.productImage.createMany({
          data: images.map((image, index) => ({
            productId: created.id,
            url: image.url,
            altText: image.altText || created.name,
            sortOrder: image.sortOrder ?? index,
            isPrimary: Boolean(image.isPrimary),
          })),
        });
      }

      if (documents.length) {
        await tx.productDocument.createMany({
          data: documents.map((doc) => ({
            productId: created.id,
            title: doc.title,
            url: doc.url,
            key: doc.key || null,
            mimeType: doc.mimeType || null,
          })),
        });
      }

      return created;
    });

    // Fire low-stock alerts async (don't block response)
    if (variants.length) fireLowStockAlerts(variants, body.name);

    return productService.getById(product.id);
  },

  update: async (id, body) => {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Product not found");

    const slug = body.slug || createSlug(body.name || existing.name);
    const sku = body.sku || existing.sku;

    // Check unique constraints if changed
    if (slug !== existing.slug) {
      const dupeSlug = await prisma.product.findUnique({ where: { slug } });
      if (dupeSlug) throw new ApiError(400, "Slug is already in use by another product");
    }

    if (sku !== existing.sku) {
      const dupeSku = await prisma.product.findUnique({ where: { sku } });
      if (dupeSku) throw new ApiError(400, "SKU is already in use by another product");
    }

    const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds : [];
    const subCategoryIds = Array.isArray(body.subCategoryIds) ? body.subCategoryIds : [];
    const industryIds = Array.isArray(body.industryIds) ? body.industryIds : [];
    const variants = Array.isArray(body.variants) ? body.variants : [];
    const images = Array.isArray(body.images) ? body.images : [];
    const documents = Array.isArray(body.documents) ? body.documents : [];

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name: body.name || existing.name,
          slug,
          sku,
          shortDescription: body.shortDescription !== undefined ? body.shortDescription : existing.shortDescription,
          description: body.description !== undefined ? body.description : existing.description,
          productType: body.productType || existing.productType,
          basePrice: body.basePrice !== undefined ? decimalOrNull(body.basePrice) : existing.basePrice,
          salePrice: body.salePrice !== undefined ? decimalOrNull(body.salePrice) : existing.salePrice,
          badge: body.badge !== undefined ? (body.badge || null) : existing.badge,
          featured: body.featured !== undefined ? Boolean(body.featured) : existing.featured,
          newArrival: body.newArrival !== undefined ? Boolean(body.newArrival) : existing.newArrival,
          trending: body.trending !== undefined ? Boolean(body.trending) : existing.trending,
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
          b2bInquiryLabel: body.b2bInquiryLabel !== undefined ? body.b2bInquiryLabel : existing.b2bInquiryLabel,
        },
      });

      // Reset categories, subcategories, industries, and re-create links
      await tx.productCategory.deleteMany({ where: { productId: id } });
      if (categoryIds.length) {
        await tx.productCategory.createMany({
          data: categoryIds.map((categoryId) => ({ productId: id, categoryId })),
        });
      }

      await tx.productSubCategory.deleteMany({ where: { productId: id } });
      if (subCategoryIds.length) {
        await tx.productSubCategory.createMany({
          data: subCategoryIds.map((subCategoryId) => ({ productId: id, subCategoryId })),
        });
      }

      await tx.productIndustry.deleteMany({ where: { productId: id } });
      if (industryIds.length) {
        await tx.productIndustry.createMany({
          data: industryIds.map((industryId) => ({ productId: id, industryId })),
        });
      }

      // R2 cleanup for deleted/replaced product images & variant images
      try {
        const newImageUrls = new Set(images.map(img => img.url).filter(Boolean));
        const newVariantImageUrls = new Set([
          ...variants.map(v => v.imageUrl).filter(Boolean),
          ...variants.flatMap(v => v.images || []).map(img => img.url).filter(Boolean)
        ]);

        const currentProductImages = await tx.productImage.findMany({
          where: { productId: id }
        });
        for (const img of currentProductImages) {
          if (!newImageUrls.has(img.url)) {
            await deleteR2Image(img.url);
          }
        }

        const currentVariants = await tx.productVariant.findMany({
          where: { productId: id },
          include: { images: true }
        });
        for (const v of currentVariants) {
          if (v.imageUrl && !newVariantImageUrls.has(v.imageUrl)) {
            await deleteR2Image(v.imageUrl);
          }
          for (const img of v.images) {
            if (!newVariantImageUrls.has(img.url)) {
              await deleteR2Image(img.url);
            }
          }
        }
      } catch (err) {
        console.warn("Failed R2 cleanup during product update:", err.message);
      }

      // Reset variants, images, and documents
      await tx.productVariant.deleteMany({ where: { productId: id } });
      if (variants.length) {
        for (const [index, variant] of variants.entries()) {
          const varSlug = createSlug(variant.name || `${body.name || existing.name}-${index + 1}`);
          const varSku = variant.sku || generateSku(`${body.name || existing.name}-${index + 1}`);

          const createdVariant = await tx.productVariant.create({
            data: {
              productId: id,
              name: variant.name || "Standard",
              slug: varSlug,
              sku: varSku,
              imageUrl: variant.imageUrl || null,
              price: decimalOrNull(variant.price),
              salePrice: decimalOrNull(variant.salePrice),
              stock: variant.stock ?? 0,
              specification: variant.specification || null,
              weight: variant.weight != null ? Number(variant.weight) : null,
              length: variant.length != null ? Number(variant.length) : null,
              width: variant.width != null ? Number(variant.width) : null,
              height: variant.height != null ? Number(variant.height) : null,
              hsnCode: variant.hsn || variant.hsnCode || null,
              packageDetails: variant.packageDetails || null,
              isDefault: Boolean(variant.isDefault),
              isActive: variant.isActive !== false,
            },
          });

          const variantImages = Array.isArray(variant.images) ? variant.images : [];
          if (variantImages.length) {
            await tx.variantImage.createMany({
              data: variantImages.map((img, i) => ({
                variantId: createdVariant.id,
                url: img.url,
                altText: img.altText || createdVariant.name,
                sortOrder: img.sortOrder ?? i,
              })),
            });
          }

          const attributes = Array.isArray(variant.attributes) ? variant.attributes : [];
          for (const attr of attributes) {
            if (attr.attributeValueId) {
              await tx.productVariantAttribute.create({
                data: {
                  variantId: createdVariant.id,
                  attributeValueId: attr.attributeValueId,
                },
              });
            }
          }

          // Handle variant documents if specified
          const variantDocuments = Array.isArray(variant.documents) ? variant.documents : [];
          if (variantDocuments.length) {
            await tx.productDocument.createMany({
              data: variantDocuments.map((doc) => ({
                productId: id,
                variantId: createdVariant.id,
                title: doc.title,
                url: doc.url,
                key: doc.key || null,
                mimeType: doc.mimeType || null,
              })),
            });
          }
        }
      }

      await tx.productImage.deleteMany({ where: { productId: id } });
      if (images.length) {
        await tx.productImage.createMany({
          data: images.map((image, index) => ({
            productId: id,
            url: image.url,
            altText: image.altText || body.name || existing.name,
            sortOrder: image.sortOrder ?? index,
            isPrimary: Boolean(image.isPrimary),
          })),
        });
      }

      // Cleanup removed documents from R2 (both product and variant docs)
      try {
        const newDocUrls = new Set([
          ...documents.map(d => d.url).filter(Boolean),
          ...variants.flatMap(v => v.documents || []).map(d => d.url).filter(Boolean)
        ]);
        const currentDocs = await tx.productDocument.findMany({ where: { productId: id } });
        for (const doc of currentDocs) {
          if (!newDocUrls.has(doc.url) && doc.key) {
            await deleteObjectFromR2(doc.key);
          }
        }
      } catch (err) {
        console.warn("Failed R2 doc cleanup during product update:", err.message);
      }

      // Delete only parent product documents; variant documents were deleted as part of variant.deleteMany cascade
      await tx.productDocument.deleteMany({ where: { productId: id, variantId: null } });
      if (documents.length) {
        await tx.productDocument.createMany({
          data: documents.map((doc) => ({
            productId: id,
            title: doc.title,
            url: doc.url,
            key: doc.key || null,
            mimeType: doc.mimeType || null,
          })),
        });
      }
    });

    // Fire low-stock alerts async (don't block response)
    if (variants.length) fireLowStockAlerts(variants, body.name || existing.name);

    return productService.getById(id);
  },

  delete: async (id) => {
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { documents: true },
    });
    if (!existing) throw new ApiError(404, "Product not found");

    // Delete associated document files from R2
    for (const doc of existing.documents || []) {
      if (doc.key) deleteObjectFromR2(doc.key).catch(() => {});
    }

    // Soft delete/archive
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true };
  },

  duplicate: async (id) => {
    const original = await prisma.product.findUnique({
      where: { id },
      include: {
        categories: true,
        subCategories: true,
        industries: true,
        variants: {
          include: {
            images: true,
            attributes: true,
            documents: true,
          },
        },
        images: true,
        documents: true,
      },
    });

    if (!original) throw new ApiError(404, "Original product not found");

    const name = `${original.name} Copy`;
    const slug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;
    const sku = generateSku(original.name);

    const duplicated = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name,
          slug,
          sku,
          shortDescription: original.shortDescription,
          description: original.description,
          productType: original.productType,
          basePrice: original.basePrice,
          featured: false,
          isActive: false,
          b2bInquiryLabel: original.b2bInquiryLabel,
          categories: {
            create: original.categories.map((c) => ({ categoryId: c.categoryId })),
          },
          subCategories: {
            create: original.subCategories.map((sc) => ({ subCategoryId: sc.subCategoryId })),
          },
          industries: {
            create: original.industries.map((ind) => ({ industryId: ind.industryId })),
          },
        },
      });

      if (original.variants.length) {
        for (const variant of original.variants) {
          const createdVariant = await tx.productVariant.create({
            data: {
              productId: created.id,
              name: variant.name,
              slug: `${variant.slug}-copy`,
              sku: generateSku(variant.name),
              imageUrl: variant.imageUrl,
              price: variant.price,
              stock: variant.stock,
              specification: variant.specification || null,
              isDefault: variant.isDefault,
              isActive: false,
            },
          });

          if (variant.images.length) {
            await tx.variantImage.createMany({
              data: variant.images.map((img) => ({
                variantId: createdVariant.id,
                url: img.url,
                altText: img.altText,
                sortOrder: img.sortOrder,
              })),
            });
          }

          if (variant.attributes.length) {
            await tx.productVariantAttribute.createMany({
              data: variant.attributes.map((attr) => ({
                variantId: createdVariant.id,
                attributeValueId: attr.attributeValueId,
              })),
            });
          }

          if (variant.documents && variant.documents.length) {
            await tx.productDocument.createMany({
              data: variant.documents.map((doc) => ({
                productId: created.id,
                variantId: createdVariant.id,
                title: doc.title,
                url: doc.url,
                mimeType: doc.mimeType,
              })),
            });
          }
        }
      }

      if (original.images.length) {
        await tx.productImage.createMany({
          data: original.images.map((img) => ({
            productId: created.id,
            url: img.url,
            altText: img.altText,
            sortOrder: img.sortOrder,
            isPrimary: false,
          })),
        });
      }

      if (original.documents.length) {
        await tx.productDocument.createMany({
          data: original.documents.map((doc) => ({
            productId: created.id,
            title: doc.title,
            url: doc.url,
            mimeType: doc.mimeType,
          })),
        });
      }

      return created;
    });

    return productService.getById(duplicated.id);
  },

  bulk: async (ids, action) => {
    if (!Array.isArray(ids) || !ids.length) {
      throw new ApiError(400, "Active array of product IDs is required");
    }

    if (action === "activate") {
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { isActive: true } });
    } else if (action === "archive") {
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { isActive: false } });
    } else if (action === "feature") {
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { featured: true } });
    } else if (action === "unfeature") {
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { featured: false } });
    } else if (action === "delete") {
      // Soft-delete in bulk
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { isActive: false } });
    } else {
      throw new ApiError(400, "Invalid bulk action");
    }

    return { success: true };
  },

  import: async (productsList) => {
    if (!Array.isArray(productsList) || !productsList.length) {
      throw new ApiError(400, "Import list cannot be empty");
    }

    let importedCount = 0;

    for (const item of productsList) {
      try {
        await productService.create({
          name: item.name,
          sku: item.sku,
          productType: item.productType || "B2C",
          basePrice: item.basePrice || item.price,
          shortDescription: item.shortDescription,
          description: item.description,
          featured: item.featured === true || String(item.featured) === "true",
          isActive: item.isActive !== false && String(item.isActive) !== "false",
          categoryIds: item.categoryIds || [],
          subCategoryIds: item.subCategoryIds || [],
          industryIds: item.industryIds || [],
          variants: item.variants || [],
          images: item.images || [],
        });
        importedCount++;
      } catch (err) {
        console.error(`Failed to import product "${item.name}":`, err.message);
      }
    }

    return { importedCount, total: productsList.length };
  },

  export: async (query) => {
    // Return all matching products without limit for export
    const items = await prisma.product.findMany({
      include: {
        categories: { include: { category: true } },
        variants: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return items.map((product) => ({
      ID: product.id,
      Name: product.name,
      SKU: product.sku,
      Slug: product.slug,
      Type: product.productType,
      BasePrice: product.basePrice ? Number(product.basePrice) : "",
      Featured: product.featured,
      IsActive: product.isActive,
      Categories: product.categories.map((c) => c.category.name).join(", "),
      VariantsCount: product.variants.length,
      CreatedAt: product.createdAt,
    }));
  },
};
