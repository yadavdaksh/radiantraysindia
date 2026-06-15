import { Router } from "express";
import { placeOrder, validateCheckout } from "../controllers/checkout.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/validate", validateCheckout);
router.post("/place-order", placeOrder);

export default router;
