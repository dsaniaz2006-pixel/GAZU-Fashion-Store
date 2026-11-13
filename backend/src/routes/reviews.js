import { Router } from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";
import { requireAuth } from "../middleware/auth.js";
import { validateId } from "../middleware/validate.js";
import { fail } from "../utils/errors.js";
import { invalidateProducts } from "../services/cache.js";
const router = Router();
router.delete("/:id", requireAuth, validateId, async (req, res) => {
  await mongoose.connection.transaction(async (session) => {
    const review = await Review.findById(req.params.id).session(session);
    if (!review) fail(404, "Review not found.");
    if (String(review.user) !== req.user.id && req.user.role !== "admin")
      fail(403, "You cannot delete this review.");
    await review.deleteOne({ session });
  });
  await invalidateProducts();
  res.status(204).end();
});
export default router;
