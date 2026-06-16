import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteR2Image } from "../utils/r2.js";

const paged = async (model, where = {}, orderBy = { updatedAt: "desc" }, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return prisma.$transaction([
    prisma[model].findMany({ where, orderBy, skip, take: limit }),
    prisma[model].count({ where }),
  ]);
};

const createFactory = (model, mapper) =>
  asyncHandler(async (req, res) => {
    const data = mapper(req.body);
    const record = await prisma[model].create({ data });
    res.status(201).json(new ApiResponsive(201, record, `${model} created`));
  });

const updateFactory = (model, mapper) =>
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await prisma[model].findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, `${model} not found`);
    const record = await prisma[model].update({
      where: { id },
      data: mapper(req.body, existing),
    });
    res.json(new ApiResponsive(200, record, `${model} updated`));
  });

const archiveFactory = (model) =>
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma[model].update({ where: { id }, data: { isActive: false } });
    res.json(new ApiResponsive(200, null, `${model} archived`));
  });

export const listGalleryItems = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
  const [items, total] = await paged("gallery", {}, { sortOrder: "asc" }, page, limit);
  res.json(new ApiResponsive(200, { items, page, limit, total, pages: Math.ceil(total / limit) }));
});

export const createGalleryItem = createFactory("gallery", (body) => ({
  title: body.title,
  description: body.description || null,
  imageUrl: body.imageUrl,
  category: body.category || null,
  sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
  isActive: body.isActive !== false,
}));

export const updateGalleryItem = updateFactory("gallery", (body, existing) => ({
  title: body.title ?? existing.title,
  description: body.description ?? existing.description,
  imageUrl: body.imageUrl ?? existing.imageUrl,
  category: body.category ?? existing.category,
  sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : existing.sortOrder,
  isActive: body.isActive ?? existing.isActive,
}));

export const deleteGalleryItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.gallery.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Gallery item not found");

  if (existing.imageUrl) {
    await deleteR2Image(existing.imageUrl);
  }

  await prisma.gallery.delete({ where: { id } });
  res.json(new ApiResponsive(200, null, "Gallery item deleted"));
});

export const listTestimonials = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
  const [items, total] = await paged("testimonial", {}, { updatedAt: "desc" }, page, limit);
  res.json(new ApiResponsive(200, { items, page, limit, total, pages: Math.ceil(total / limit) }));
});

export const createTestimonial = createFactory("testimonial", (body) => ({
  name: body.name,
  designation: body.designation || null,
  company: body.company || null,
  quote: body.quote,
  imageUrl: body.imageUrl || null,
  rating: body.rating ? Number(body.rating) : 5,
  isActive: body.isActive !== false,
}));

export const updateTestimonial = updateFactory("testimonial", (body, existing) => ({
  name: body.name ?? existing.name,
  designation: body.designation ?? existing.designation,
  company: body.company ?? existing.company,
  quote: body.quote ?? existing.quote,
  imageUrl: body.imageUrl ?? existing.imageUrl,
  rating: body.rating !== undefined ? Number(body.rating) : existing.rating,
  isActive: body.isActive ?? existing.isActive,
}));

export const deleteTestimonial = archiveFactory("testimonial");

// ── Settings test endpoints ────────────────────────────────────────────────

export const testSmtp = asyncHandler(async (_req, res) => {
  const smtpSetting = await prisma.settings.findUnique({ where: { key: "smtp_config" } });
  if (!smtpSetting) throw new ApiError(400, "SMTP not configured yet");
  const cfg = smtpSetting.value;

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host: cfg.host,
    port: Number(cfg.port || 587),
    secure: Number(cfg.port) === 465,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  await transporter.verify();
  res.json(new ApiResponsive(200, null, "SMTP connection verified successfully"));
});

export const testRazorpay = asyncHandler(async (_req, res) => {
  const rp = await prisma.settings.findUnique({ where: { key: "razorpay_config" } });
  if (!rp) throw new ApiError(400, "Razorpay not configured yet");
  const cfg = rp.value;
  if (!cfg.keyId || !cfg.keySecret) throw new ApiError(400, "Key ID and Key Secret are required");

  // Test by hitting Razorpay orders API (lightweight)
  const creds = Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders?count=1", {
    headers: { Authorization: `Basic ${creds}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new ApiError(400, err.error?.description || "Invalid Razorpay credentials");
  }
  res.json(new ApiResponsive(200, null, "Razorpay keys are valid and working"));
});

export const testShiprocket = asyncHandler(async (_req, res) => {
  const sr = await prisma.settings.findUnique({ where: { key: "shiprocket_config" } });
  if (!sr) throw new ApiError(400, "Shiprocket not configured yet");
  const cfg = sr.value;
  if (!cfg.email || !cfg.password) throw new ApiError(400, "Email and password are required");

  const response = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: cfg.email, password: cfg.password }),
  });
  if (!response.ok) throw new ApiError(400, "Invalid Shiprocket credentials");
  const data = await response.json();
  if (!data.token) throw new ApiError(400, "Shiprocket login failed — check credentials");
  res.json(new ApiResponsive(200, null, "Shiprocket login successful"));
});

export const listSettings = asyncHandler(async (_req, res) => {
  const items = await prisma.settings.findMany({
    orderBy: { updatedAt: "desc" },
  });
  res.json(new ApiResponsive(200, items));
});

export const updateSetting = asyncHandler(async (req, res) => {
  const { key, value } = req.body;
  if (!key) throw new ApiError(400, "Setting key is required");

  const record = await prisma.settings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  res.json(new ApiResponsive(200, record, "Setting saved"));
});

export const listBanners = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
  const [items, total] = await paged("banner", {}, { sortOrder: "asc" }, page, limit);
  res.json(new ApiResponsive(200, { items, page, limit, total, pages: Math.ceil(total / limit) }));
});

export const createBanner = asyncHandler(async (req, res) => {
  const body = req.body;
  const maxBanner = await prisma.banner.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true }
  });
  const nextSortOrder = maxBanner ? maxBanner.sortOrder + 1 : 0;

  const record = await prisma.banner.create({
    data: {
      title: body.title || "Banner",
      subtitle: body.subtitle || null,
      desktopImageUrl: body.desktopImageUrl,
      mobileImageUrl: body.mobileImageUrl,
      linkUrl: body.linkUrl || null,
      sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : nextSortOrder,
      isActive: body.isActive !== false,
    }
  });

  res.status(201).json(new ApiResponsive(201, record, "Banner created"));
});

export const updateBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Banner not found");

  const record = await prisma.banner.update({
    where: { id },
    data: {
      title: body.title !== undefined ? (body.title || "Banner") : existing.title,
      subtitle: body.subtitle !== undefined ? (body.subtitle || null) : existing.subtitle,
      desktopImageUrl: body.desktopImageUrl !== undefined ? body.desktopImageUrl : existing.desktopImageUrl,
      mobileImageUrl: body.mobileImageUrl !== undefined ? body.mobileImageUrl : existing.mobileImageUrl,
      linkUrl: body.linkUrl !== undefined ? (body.linkUrl || null) : existing.linkUrl,
      sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : existing.sortOrder,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
    }
  });

  res.json(new ApiResponsive(200, record, "Banner updated"));
});

export const deleteBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Banner not found");

  if (existing.desktopImageUrl) {
    await deleteR2Image(existing.desktopImageUrl);
  }
  if (existing.mobileImageUrl) {
    await deleteR2Image(existing.mobileImageUrl);
  }

  await prisma.banner.delete({ where: { id } });

  const remaining = await prisma.banner.findMany({
    orderBy: { sortOrder: "asc" }
  });

  for (let i = 0; i < remaining.length; i++) {
    await prisma.banner.update({
      where: { id: remaining[i].id },
      data: { sortOrder: i }
    });
  }

  res.json(new ApiResponsive(200, null, "Banner deleted and ordering adjusted"));
});

