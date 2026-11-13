
import User from "../models/User.js";
import OrderNotification from "../models/OrderNotification.js";
import { sendEmail } from "./emailService.js";

// Convert paise to Indian Rupees.
const money = (paise) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format((paise ?? 0) / 100);

// Send an order confirmation email after successful checkout.
export async function sendOrderConfirmation(order) {
  // Step 1: Find the customer.
  const user = await User.findById(order.user).select("name email");

  if (!user?.email) {
    console.error(
      `Order confirmation skipped: no recipient for ${order._id}`
    );
    return;
  }

  // Step 2: Claim the notification to prevent duplicate sends.
  try {
    const claimed = await OrderNotification.updateOne(
      {
        order: order._id,
        type: "order_confirmation",
      },
      {
        $setOnInsert: {
          order: order._id,
          type: "order_confirmation",
          recipient: user.email,
          status: "sending",
        },
      },
      { upsert: true }
    );

    if (claimed.upsertedCount !== 1) {
      console.log(
        `Order confirmation already processed: ${
          order.orderNumber || order._id
        }`
      );
      return;
    }
  } catch (error) {
    if (error.code === 11000) {
      return;
    }

    throw error;
  }

  // Step 3: Format order details.
  const displayOrderNumber =
    order.orderNumber || String(order._id);

  const items = order.items
    .map(
      (item) =>
        `${item.name} x ${item.quantity}: ${money(
          item.unitPricePaise * item.quantity
        )}`
    )
    .join("\n");

  const shipping = order.shipping ?? {};

  // Step 4: Prepare the confirmation email.
  const content = [
    `Hi ${user.name || "Customer"},`,
    "",
    "Thank you for shopping with GAZU Fashion Store!",
    "",
    `Your order ${displayOrderNumber} has been placed successfully.`,
    "",
    "ORDER DETAILS",
    "------------------------------",
    `Order Number: ${displayOrderNumber}`,
    "",
    "Products:",
    items,
    "",
    `Subtotal: ${money(order.subtotalPaise)}`,
    `Delivery: ${money(order.deliveryPaise)}`,
    `Total: ${money(order.totalPaise)}`,
    "",
    `Payment: ${
      order.paymentMethod === "cod"
        ? "Cash on Delivery"
        : "Online Payment"
    }`,
    "Status: Placed",
    "",
    "DELIVERY ADDRESS",
    "------------------------------",
    shipping.name || "",
    shipping.address || "",
    `${shipping.city || ""} - ${shipping.pin || ""}`,
    "",
    "We'll let you know when your order is being prepared.",
    "",
    "Thank you for choosing GAZU!",
    "GAZU Fashion Store",
  ].join("\n");

  // Step 5: Send email and update MongoDB.
  try {
    await sendEmail(
      user.email,
      "GAZU - Your Order Has Been Confirmed",
      content
    );

    await OrderNotification.updateOne(
      {
        order: order._id,
        type: "order_confirmation",
      },
      {
        $set: {
          status: "sent",
          sentAt: new Date(),
        },
        $unset: {
          error: "",
        },
      }
    );

    console.log(
      `Order confirmation submitted: ${displayOrderNumber}`
    );
  } catch (error) {
    console.error(
      `Order confirmation failed (${displayOrderNumber}): ${error.message}`
    );

    try {
      await OrderNotification.updateOne(
        {
          order: order._id,
          type: "order_confirmation",
        },
        {
          $set: {
            status: "failed",
            error: error.message.slice(0, 300),
          },
        }
      );
    } catch (updateError) {
      console.error(
        "Could not record email failure:",
        updateError.message
      );
    }
  }
}
