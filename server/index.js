import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

import { prisma } from "./config/db.js";
import rateLimiter from "./middlewares/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { ensureSecurityBootstrap } from "./utils/bootstrap.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import industryRoutes from "./routes/industry.routes.js";
import leadRoutes from "./routes/lead.routes.js";
import orderRoutes from "./routes/order.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import publicRoutes from "./routes/public.routes.js";
import contentRoutes from "./routes/content.routes.js";
import systemRoutes from "./routes/system.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import addressRoutes from "./routes/address.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import shipmentRoutes from "./routes/shipment.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import attributeRoutes from "./routes/attribute.routes.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(rateLimiter);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/industries", industryRoutes);
app.use("/api/v1/leads", leadRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/uploads", uploadRoutes);
app.use("/api/v1/content", contentRoutes);
app.use("/api/v1/system", systemRoutes);
app.use("/api/v1/public", publicRoutes);
// Customer-facing routes
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/addresses", addressRoutes);
app.use("/api/v1/checkout", checkoutRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/customer", customerRoutes);
// Product reviews
app.use("/api/v1/reviews", reviewRoutes);
// Commerce and fulfilment
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/shipments", shipmentRoutes);
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1/attributes", attributeRoutes);

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      ok: true,
      service: "radiant-rays-api",
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      service: "radiant-rays-api",
      database: "unavailable",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/v1", (_req, res) => {
  res.json({
    ok: true,
    message: "Radiant Rays API is running",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  await ensureSecurityBootstrap();
  app.listen(port, () => {
    console.log(`Radiant Rays API listening on port ${port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
