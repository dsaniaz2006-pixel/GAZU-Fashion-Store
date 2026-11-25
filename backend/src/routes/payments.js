import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import {
  validate,
  checkoutSchema,
  razorpayVerificationSchema,
} from "../middleware/validate.js";
import { mockCheckout } from "../services/mockPayment.js";
import { attachConfirmationEmailStatus } from "../services/orderNotifications.js";
import {
  createRazorpayOrder,
  razorpayCredentials,
  verifyRazorpayPayment,
} from "../services/razorpayPayment.js";
import { fail } from "../utils/errors.js";
const router = Router();
router.get("/config", (req, res) => {
  const credentials = razorpayCredentials();
  res.json({
    mockEnabled: process.env.ENABLE_MOCK_PAYMENTS === "true" && process.env.NODE_ENV !== "production",
    razorpayEnabled: Boolean(credentials),
    ...(credentials ? { razorpayKeyId: credentials.keyId } : {}),
  });
});
router.post("/mock/checkout", requireAuth, validate(checkoutSchema.extend({ outcome: z.enum(["success", "failure"]) })), async (req, res) => {
  if (process.env.ENABLE_MOCK_PAYMENTS !== "true" || process.env.NODE_ENV === "production") fail(403, "Mock payments are disabled. Use COD.");
  const result = await mockCheckout(req.user.id, req.body, req.requestId);
  res.status(result.status).json(await attachConfirmationEmailStatus(result.order));
});
router.post("/razorpay/order", requireAuth, validate(checkoutSchema), async (req, res) => {
  res.status(201).json(await createRazorpayOrder(req.user.id, req.body));
});
router.post(
  "/razorpay/verify",
  requireAuth,
  validate(razorpayVerificationSchema),
  async (req, res) => {
    const result = await verifyRazorpayPayment(req.user.id, req.body);
    res.status(result.status).json(await attachConfirmationEmailStatus(result.order));
  },
);
export default router;
