import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
  mergeGuestCart,
} from "../controllers/cart.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/items/:id", updateCartItem);
router.delete("/items/:id", deleteCartItem);
router.post("/clear", clearCart);
router.post("/merge", mergeGuestCart);

export default router;
