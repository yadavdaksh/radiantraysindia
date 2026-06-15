import { Router } from "express";
import {
  createGalleryItem,
  createTestimonial,
  deleteGalleryItem,
  deleteTestimonial,
  listGalleryItems,
  listSettings,
  listTestimonials,
  updateGalleryItem,
  updateSetting,
  updateTestimonial,
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  testSmtp,
  testRazorpay,
  testShiprocket,
} from "../controllers/content.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/gallery", requireAuth, requirePermission("gallery", "read"), listGalleryItems);
router.post("/gallery", requireAuth, requirePermission("gallery", "create"), createGalleryItem);
router.put("/gallery/:id", requireAuth, requirePermission("gallery", "update"), updateGalleryItem);
router.delete("/gallery/:id", requireAuth, requirePermission("gallery", "delete"), deleteGalleryItem);

router.get("/testimonials", requireAuth, requirePermission("testimonial", "read"), listTestimonials);
router.post("/testimonials", requireAuth, requirePermission("testimonial", "create"), createTestimonial);
router.put("/testimonials/:id", requireAuth, requirePermission("testimonial", "update"), updateTestimonial);
router.delete("/testimonials/:id", requireAuth, requirePermission("testimonial", "delete"), deleteTestimonial);

router.get("/banners", requireAuth, requirePermission("gallery", "read"), listBanners);
router.post("/banners", requireAuth, requirePermission("gallery", "create"), createBanner);
router.put("/banners/:id", requireAuth, requirePermission("gallery", "update"), updateBanner);
router.delete("/banners/:id", requireAuth, requirePermission("gallery", "delete"), deleteBanner);

router.get("/settings",                requireAuth, requirePermission("setting", "read"),   listSettings);
router.post("/settings",               requireAuth, requirePermission("setting", "update"), updateSetting);
router.post("/settings/test-smtp",     requireAuth, requirePermission("setting", "read"),   testSmtp);
router.post("/settings/test-razorpay", requireAuth, requirePermission("setting", "read"),   testRazorpay);
router.post("/settings/test-shiprocket", requireAuth, requirePermission("setting", "read"), testShiprocket);

export default router;

