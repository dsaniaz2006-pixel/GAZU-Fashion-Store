import { createHash } from "node:crypto";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { fail } from "../utils/errors.js";
import { calculateOffer } from "./promotions.js";

export const hashCheckoutData = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

export async function quoteCheckout(userId, input) {
  const user = await User.findById(userId).select("cart").lean();
  if (!user?.cart?.length) fail(400, "Your bag is empty.");
  let subtotal = 0;
  const lines = [];
  for (const item of user.cart) {
    const product = await Product.findOne({
      _id: item.product,
      active: true,
      inStock: true,
      tag: { $ne: "PRICE PENDING" },
    })
      .select("pricePaise quantity")
      .lean();
    if (!product || product.quantity < item.quantity)
      fail(409, "An item is unavailable or has insufficient stock.");
    const actual = item.size ? await Product.findById(item.product).lean() : product;
    const size = item.size || "";
    if (
      size &&
      !(actual.variants || []).some(
        (variant) => variant.size === size && variant.quantity >= item.quantity,
      )
    )
      fail(409, "Selected size is unavailable.");
    if (!size && actual.variants?.length)
      fail(409, "Choose a size before checkout.");
    subtotal += product.pricePaise * item.quantity;
    lines.push(
      size
        ? [String(product._id), item.quantity, product.pricePaise, size]
        : [String(product._id), item.quantity, product.pricePaise],
    );
  }
  const offer = await calculateOffer({
    userId,
    subtotal,
    couponCode: input.couponCode,
    giftCardCode: input.giftCardCode,
  });
  return { amountPaise: offer.totalPaise, lines };
}
