import { z } from "zod";
import rateLimit from "express-rate-limit";
import Product from "../../models/Product.js";
import { fail } from "../../utils/errors.js";
import { allowRoles } from "../../middleware/auth.js";

// Shared policy instances preserve the original global per-route throttling.
export const publicRate = rateLimit({ windowMs: 60000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false });
export const authRate = rateLimit({ windowMs: 60000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false });
export const objectId = z.string().regex(/^[a-f0-9]{24}$/i);
export const inventoryStaff = allowRoles("admin", "inventory_manager");
export const actualProduct = { active: true, $or: [{ publicationStatus: "published" }, { publicationStatus: { $exists: false } }] };

export async function publishedProduct(id) {
  const product = await Product.findOne({ _id: id, ...actualProduct }).lean();
  if (!product) fail(404, "Published product not found.");
  return product;
}
