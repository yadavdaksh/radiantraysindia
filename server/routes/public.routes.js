import { Router } from "express";
import {
  getPublicPage,
  getPublicProduct,
  homeData,
  listPublicCategories,
  listPublicIndustries,
  listPublicProducts,
  listPublicGallery,
  subscribeNewsletterPublic,
  submitContactFormPublic,
} from "../controllers/public.controller.js";

const router = Router();

router.get("/home", homeData);
router.get("/products", listPublicProducts);
router.get("/products/:slug", getPublicProduct);
router.get("/categories", listPublicCategories);
router.get("/industries", listPublicIndustries);
router.get("/gallery", listPublicGallery);
router.get("/pages/:slug", getPublicPage);
router.post("/newsletter/subscribe", subscribeNewsletterPublic);
router.post("/contact", submitContactFormPublic);

export default router;

