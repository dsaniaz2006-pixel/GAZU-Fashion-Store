import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import { validateId, validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { fail } from "../utils/errors.js";
import { cachedProducts, invalidateProducts } from "../services/cache.js";
export const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
const query = pagination.extend({
  q: z.string().trim().max(100).optional(),
  category: z.enum(["Men", "Women", "Kids", "Accessories"]).optional(),
  type: z.string().trim().min(1).max(50).optional(),
  sort: z
    .enum(["featured", "newest", "price_asc", "price_desc"])
    .default("featured"),
});
const router = Router();
router.get("/", async (req, res) => {
  const filters = query.parse(req.query);
  await cachedProducts(req, res, () => Product.search(filters));
});
router.get("/:id", validateId, async (req, res) =>
  cachedProducts(req, res, async () => {
    const p = await Product.findOne({ _id: req.params.id, active: true, $or:[{publicationStatus:"published"},{publicationStatus:{$exists:false}}] });
    if (!p) fail(404, "Product not found.");
    return p;
  }),
);
router.get("/:id/reviews", validateId, async (req, res) => {
  const { page, limit } = pagination.parse(req.query);
  if (!(await Product.exists({ _id: req.params.id, active: true })))
    fail(404, "Product not found.");
  const filter = { product: req.params.id };
  const [items, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "name")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments(filter),
  ]);
  res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
});
router.post(
  "/:id/reviews",
  requireAuth,
  validateId,
  validate(
    z
      .object({
        rating: z.number().int().min(1).max(5),
        comment: z.string().trim().min(3).max(1000),
      })
      .strict(),
  ),
  async (req, res) => {
    const review = await mongoose.connection.transaction(async (session) => {
      if (
        !(await Product.exists({ _id: req.params.id, active: true }).session(
          session,
        ))
      )
        fail(404, "Product not found.");
      const [doc] = await Review.create(
        [{ ...req.body, user: req.user.id, product: req.params.id }],
        { session },
      );
      return doc;
    });
    await invalidateProducts();
    res.status(201).json(review);
  },
);
export default router;
