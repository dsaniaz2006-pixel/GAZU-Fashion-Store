
import mongoose from "mongoose";
import { createHash } from "node:crypto";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import OrderCounter from "../models/OrderCounter.js";
import { fail } from "../utils/errors.js";
import { invalidateProducts } from "./cache.js";
import {calculateOffer,commitOffer} from './promotions.js';

// Stock, order creation, order numbering, and cart clearing
// either commit together or all roll back.
export async function checkout(userId, input, paymentMethod, expectedTotalPaise = null, expectedCartHash = null) {
  let createdNewOrder = false;
  const result = await mongoose.connection.transaction(async (session) => {

    // Step 1: Check whether this order already exists.
    const previous = await Order.findOne({
      user: userId,
      requestId: input.requestId,
    }).session(session);

    if (previous) {
      return previous;
    }

    // Step 2: Get the customer and validate their cart.
    const user = await User.findById(userId).session(session);

    if (!user) {
      fail(404, "Customer not found.");
    }

    if (!user.cart.length) {
      fail(400, "Your cart is empty.");
    }

    // Step 3: Check stock and collect order items.
    const items = [];
    const cartSnapshot = [];

    for (const line of user.cart) {
      const size = line.size || '';
      // Match the selected size inside the atomic stock decrement.
      // The legacy path retains its original aggregate-only behaviour.
      const sizePredicate = size
        ? { variants: { $elemMatch: { size, quantity: { $gte: line.quantity } } } }
        : { 'variants.0': { $exists: false } };
      const increments = size
        ? { quantity: -line.quantity, 'variants.$.quantity': -line.quantity }
        : { quantity: -line.quantity };
      const product = await Product.findOneAndUpdate(
        {
          _id: line.product, active: true, inStock: true,
          tag: { $ne: 'PRICE PENDING' }, quantity: { $gte: line.quantity },
          ...sizePredicate,
        },
        { $inc: increments },
        { session, new: true }
      );

      if (!product) {
        fail(
          409,
          "An item is unavailable or has insufficient stock. Update your bag."
        );
      }

      cartSnapshot.push(size ? [String(product._id), line.quantity, product.pricePaise, size] : [String(product._id), line.quantity, product.pricePaise]);
      items.push({
        product: product._id,
        name: product.name,
        size,
        quantity: line.quantity,
        unitPricePaise: product.pricePaise,
      });
    }

    // Step 4: Calculate totals.
    const subtotalPaise = items.reduce(
      (sum, item) =>
        sum + item.unitPricePaise * item.quantity,
      0
    );

    const offer=await calculateOffer({userId,subtotal:subtotalPaise,couponCode:input.couponCode,giftCardCode:input.giftCardCode,session});
    const deliveryPaise=offer.deliveryPaise;

    if (expectedCartHash !== null && createHash("sha256").update(JSON.stringify(cartSnapshot)).digest("hex") !== expectedCartHash) {
      fail(409, "Your bag changed during payment. Checkout requires reconciliation.");
    }
    if (expectedTotalPaise !== null && offer.totalPaise !== expectedTotalPaise) {
      fail(409, "Product price or cart changed during payment. Checkout requires reconciliation.");
    }

    // Step 5: Generate the official GAZU order number.
    const year = new Intl.DateTimeFormat("en", {
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(new Date());

    const counter = await OrderCounter.findOneAndUpdate(
      { _id: `orders-${year}` },
      { $inc: { sequence: 1 } },
      {
        upsert: true,
        new: true,
        session,
      }
    );

    const orderNumber =
      `GAZU-${year}-${String(counter.sequence).padStart(6, "0")}`;

    // Step 6: Create the order in MongoDB.
    const [order] = await Order.create(
      [
        {
          user: userId,
          requestId: input.requestId,
          orderNumber,
          items,
          shipping: input.shipping,
          subtotalPaise,
          deliveryPaise,
          totalPaise: offer.totalPaise,
          discountPaise:offer.discountPaise,
          giftUsedPaise:offer.giftUsedPaise,
          couponCode:input.couponCode||'',
          paymentMethod,
          paymentStatus:
            paymentMethod === "mock"
              ? "mock_paid"
              : paymentMethod === "razorpay"
                ? "paid"
                : "pending",
        },
      ],
      { session }
    );

    await commitOffer({offer,userId,orderId:order._id,session});
    createdNewOrder = true;
    // Step 7: Clear the customer's cart.
    user.cart = [];
    await user.save({ session });

    // Step 8: Return the completed order.
    return order;
  });

  // Step 9: Refresh cached product information.
  if (createdNewOrder) await invalidateProducts();

  return result;
}
