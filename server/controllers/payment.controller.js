import { paymentService } from "../services/payment.service.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const handleWebhook = asyncHandler(async (req, res) => {
  const result = await paymentService.webhookHandler(req);
  res.json(result);
});

export const processRefund = asyncHandler(async (req, res) => {
  const { paymentId, amount } = req.body;
  const result = await paymentService.refund(paymentId, amount);
  res.json(new ApiResponsive(200, result, "Refund processed successfully"));
});
