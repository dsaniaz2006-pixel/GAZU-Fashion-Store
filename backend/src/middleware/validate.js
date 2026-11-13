import { z } from "zod";
// Parse and allow-list request fields; unknown fields are rejected by strict schemas.
export const validate = (schema) => (req, res, next) => {
  req.body = schema.parse(req.body);
  next();
};
// Reject malformed MongoDB IDs before a database query.
export function validateId(req, res, next) {
  z.string()
    .regex(/^[a-f0-9]{24}$/i, "Invalid resource ID")
    .parse(req.params.id);
  next();
}
export const id = z.string().regex(/^[a-f0-9]{24}$/i);
export const quantity = z.number().int().min(1).max(99);
export const productSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).default(""),
    category: z.enum(["Men", "Women", "Kids", "Accessories"]),
    type: z.string().trim().min(1).max(50),
    color: z.string().trim().max(50).default(""),
    tag: z.string().trim().max(30).default(""),
    img: z
      .string()
      .regex(
        /^(photo-[a-zA-Z0-9-]+|\/uploads\/[a-f0-9-]+\.(png|jpg|webp)|\/products\/men-(footwear|topwear|bottomwear|winterwear|accessories)\/[a-z0-9-]+\.webp)$/,
        "Use a bundled product image, uploaded image URL or Unsplash photo ID",
      ),
    pricePaise: z.number().int().min(1).max(100000000),
    originalPricePaise: z.number().int().min(1).max(100000000).nullable().optional(),
    quantity: z.number().int().min(0).max(100000),
    inStock: z.boolean(),
    sku: z.string().trim().regex(/^[A-Z0-9-]{3,48}$/).optional(),
    variants: z.array(z.object({ size: z.string().trim().min(1).max(16), quantity: z.number().int().min(0).max(100000) }).strict()).max(40).optional(),
    sizeGuide: z.string().trim().max(1000).optional(),
    styleTags: z.array(z.string().trim().min(1).max(32)).max(12).optional(),
  })
  .strict();
export const checkoutSchema = z
  .object({
    requestId: z.uuid(),
    couponCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{4,24}$/).optional(),
    giftCardCode: z.string().trim().toUpperCase().regex(/^GAZU-GIFT-[A-F0-9]{24}$/).optional(),
    shipping: z
      .object({
        name: z.string().trim().min(2).max(100),
        address: z.string().trim().min(5).max(300),
        city: z.string().trim().min(2).max(80),
        pin: z.string().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN"),
        phone: z.string().regex(/^[0-9]{10}$/, "Enter a 10-digit phone number"),
      })
      .strict(),
  })
  .strict();
export const razorpayVerificationSchema = checkoutSchema
  .extend({
    razorpayOrderId: z.string().regex(/^order_[A-Za-z0-9]+$/),
    razorpayPaymentId: z.string().regex(/^pay_[A-Za-z0-9]+$/),
    razorpaySignature: z.string().regex(/^[a-f0-9]{64}$/i),
  })
  .strict();
