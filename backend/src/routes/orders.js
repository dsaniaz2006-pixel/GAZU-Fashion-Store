import { Router } from "express";
import Order from "../models/Order.js";
import { requireAuth } from "../middleware/auth.js";
import { validate, validateId, checkoutSchema } from "../middleware/validate.js";
import { checkout } from "../services/checkout.js";
import { fail } from "../utils/errors.js";
import { sendOrderConfirmation } from "../services/orderNotifications.js";
import { logger } from "../config/logger.js";

const router = Router();
router.use(requireAuth);


router.post(
  "/checkout",
  validate(checkoutSchema),
  async (req, res) => {
    // Create the order in MongoDB first.
    const order = await checkout(
      req.user.id,
      req.body,
      "cod"
    );



    // Attempt confirmation after successful checkout.
    try {
      await sendOrderConfirmation(order);

    } catch (error) {
      logger.warn("Post-checkout email notification failed", { errorType: error.name });
    }

    // Return the successful order even if email fails.
    return res.status(201).json(order);
  }
);


router.get("/", async (req, res) =>
  res.json(await Order.find({ user: req.user.id }).sort({ createdAt: -1 })),
);

router.get("/:id", validateId, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
  if (!order) fail(404, "Order not found.");
  res.json(order);
});

export default router;
