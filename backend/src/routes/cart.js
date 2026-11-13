import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validate, validateId, id, quantity } from "../middleware/validate.js";
import { readCart, changeCart } from "../services/cart.js";
const router = Router();
router.use(requireAuth);
// Each cart is selected from the authenticated account, never a client user ID.
router.get("/", async (req, res) => res.json(await readCart(req.user.id)));
router.post(
  "/items",
  validate(z.object({ productId: id, quantity, size: z.string().trim().max(16).default('') }).strict()),
  async (req, res) =>
    res.json(
      await changeCart(
        req.user.id,
        req.body.productId,
        req.body.quantity,
        "add", req.body.size,
      ),
    ),
);
router.patch(
  "/items/:id",
  validateId,
  validate(z.object({ quantity, size: z.string().trim().max(16).default('') }).strict()),
  async (req, res) =>
    res.json(
      await changeCart(req.user.id, req.params.id, req.body.quantity, "set", req.body.size),
    ),
);
router.delete("/items/:id", validateId, async (req, res) =>
  res.json(await changeCart(req.user.id, req.params.id, 0, "remove", String(req.query.size||""))),
);
export default router;
