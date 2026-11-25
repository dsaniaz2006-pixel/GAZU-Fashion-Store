
import User from "../models/User.js";
import OrderNotification from "../models/OrderNotification.js";
import { sendEmail } from "./emailService.js";
import { orderConfirmationHtml, orderStatusHtml } from "./emailTemplates.js";

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
      content,
      orderConfirmationHtml({ order, customerName: user.name }),
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

// One status update email per order stage. This is a status notification,
// not a live courier location or a fabricated tracking number.
const orderStatusMessages = {
  preparing: {
    subject: "GAZU - We're Preparing Your Order",
    label: "Preparing",
    message: "Our team is preparing your order.",
    next: "We'll let you know when it is out for delivery.",
  },
  out_for_delivery: {
    subject: "GAZU - Your Order Is Out for Delivery",
    label: "Out for delivery",
    message: "Your order has been marked out for delivery.",
    next: "Please keep an eye out for the delivery. You can also check My Orders in GAZU.",
  },
  delivered: {
    subject: "GAZU - Your Order Has Been Delivered",
    label: "Delivered",
    message: "Your order has been marked as delivered.",
    next: "If you have not received your parcel, please contact GAZU support.",
  },
};

export async function sendOrderStatusUpdate(order) {
  const content = orderStatusMessages[order?.status];
  if (!content || !order?._id) return false;

  const user = await User.findById(order.user).select("name email");
  if (!user?.email) {
    console.warn("GAZU order status email skipped: customer email unavailable");
    return false;
  }

  const type = `status_${order.status}`;
  // Unique (order, type) index prevents duplicates across multiple API instances
  // and avoids a new message when a request is replayed.
  try {
    const claim = await OrderNotification.updateOne(
      { order: order._id, type },
      {
        $setOnInsert: {
          order: order._id,
          type,
          recipient: user.email,
          status: "sending",
        },
      },
      { upsert: true },
    );
    if (claim.upsertedCount !== 1) return false;
  } catch (error) {
    if (error.code === 11000) return false;
    throw error;
  }

  const orderNumber = order.orderNumber || String(order._id);
  const body = [
    `Hi ${user.name || "Customer"},`,
    "",
    content.message,
    "",
    `Order number: ${orderNumber}`,
    `Current status: ${content.label}`,
    "",
    content.next,
    "",
    "To review your order, sign in to GAZU Fashion Store and open My Orders.",
    "",
    "Thank you for shopping with GAZU!",
    "GAZU Fashion Store",
  ].join("\n");

  try {
    await sendEmail(user.email, content.subject, body, orderStatusHtml({
      order, customerName: user.name, status: order.status, description: content.message, next: content.next,
    }));
    await OrderNotification.updateOne(
      { order: order._id, type, status: "sending" },
      {
        $set: { status: "sent", sentAt: new Date() },
        $unset: { error: "" },
      },
    );
    console.info(`GAZU order status email submitted for ${orderNumber} (${order.status})`);
    return true;
  } catch (error) {
    // Do not auto-retry a possibly delivered message; email providers can time out
    // after accepting an email, so repeating it risks duplicate customer emails.
    await OrderNotification.updateOne(
      { order: order._id, type, status: "sending" },
      { $set: { status: "failed", error: "Email submission could not be confirmed" } },
    ).catch(() => {});
    console.warn(`GAZU order status email unavailable (${order.status}): ${error.name}`);
    return false;
  }
}


// Attach a safe, customer-visible confirmation-email status to order records.
// Return plain objects so the virtual response field is included in JSON without
// changing or persisting the Order schema.
export async function attachConfirmationEmailStatus(orders) {
  const isArray = Array.isArray(orders);
  const list = isArray ? orders : [orders];
  const ids = list.filter(Boolean).map((order) => order._id).filter(Boolean);
  if (!ids.length) return orders;

  const notifications = await OrderNotification.find({
    order: { $in: ids },
    type: "order_confirmation",
  }).select("order status sentAt updatedAt");

  const byOrder = new Map(
    notifications.map((notification) => [
      String(notification.order),
      {
        status:
          notification.status === "sent"
            ? "submitted"
            : notification.status === "sending"
              ? "sending"
              : notification.status === "failed"
                ? "failed"
                : "pending",
        submittedAt: notification.sentAt || null,
        updatedAt: notification.updatedAt || null,
      },
    ]),
  );

  const result = list.map((order) => {
    if (!order) return order;
    const plain = typeof order.toObject === "function" ? order.toObject({ virtuals: true }) : { ...order };
    plain.confirmationEmail =
      byOrder.get(String(order._id)) || {
        status: "pending",
        submittedAt: null,
        updatedAt: null,
      };
    return plain;
  });
  return isArray ? result : result[0];
}
