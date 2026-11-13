import { createHmac, timingSafeEqual } from "node:crypto";
import Order from "../models/Order.js";
import RazorpayAttempt from "../models/RazorpayAttempt.js";
import { logger } from "../config/logger.js";
import { fail } from "../utils/errors.js";
import { sendOrderConfirmation } from "./orderNotifications.js";
import { checkout } from "./checkout.js";
import { hashCheckoutData, quoteCheckout } from "./checkoutQuote.js";

const leaseDurationMs = 20_000;
const paymentTimeoutMs = () =>
  Math.min(15_000, Math.max(1_000, Number(process.env.PAYMENT_TIMEOUT_MS) || 5_000));

export function razorpayCredentials(env = process.env) {
  const keyId = env.RAZORPAY_KEY_ID?.trim();
  const keySecret = env.RAZORPAY_KEY_SECRET?.trim();
  return keyId && keySecret ? { keyId, keySecret } : null;
}

export function razorpaySignatureMatches(orderId, paymentId, signature, secret) {
  const expected = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest();
  if (!/^[a-f0-9]{64}$/i.test(signature || "")) return false;
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

async function razorpayRequest(path, { method = "GET", body } = {}) {
  const credentials = razorpayCredentials();
  if (!credentials) fail(503, "Razorpay is not configured. Use cash on delivery.");

  let response;
  try {
    response = await fetch(`https://api.razorpay.com/v1${path}`, {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString("base64")}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(paymentTimeoutMs()),
    });
  } catch (error) {
    if (
      error instanceof TypeError ||
      error?.name === "TimeoutError" ||
      error?.name === "AbortError"
    )
      fail(503, "Razorpay is temporarily unavailable. Retry checkout.");
    throw error;
  }

  let result;
  try {
    result = await response.json();
  } catch {
    fail(503, "Razorpay returned an invalid response. Retry checkout.");
  }
  if (!response.ok) {
    logger.warn("Razorpay API request failed", { status: response.status });
    fail(503, "Razorpay could not process this payment. Retry checkout.");
  }
  return result;
}

const intentHash = (input) =>
  hashCheckoutData({
    shipping: input.shipping,
    couponCode: input.couponCode || "",
    giftCardCode: input.giftCardCode || "",
  });

function assertIntent(attempt, input) {
  if (attempt.intentHash !== intentHash(input))
    fail(409, "Checkout reference conflicts with an earlier request.");
}

function publicOrderDetails(order) {
  return {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: razorpayCredentials().keyId,
  };
}

export async function createRazorpayOrder(userId, input) {
  const credentials = razorpayCredentials();
  if (!credentials) fail(503, "Razorpay is not configured. Use cash on delivery.");

  if (await Order.exists({ user: userId, requestId: input.requestId }))
    fail(409, "This checkout reference already belongs to an order.");

  const fingerprint = intentHash(input);
  let attempt = await RazorpayAttempt.findOne({
    user: userId,
    requestId: input.requestId,
  });
  if (attempt) {
    assertIntent(attempt, input);
    if (attempt.status === "complete")
      fail(409, "This checkout has already been completed.");
    if (attempt.status === "refunding" || attempt.status === "refunded")
      fail(409, "This payment is being refunded. Start a new checkout after reviewing your bag.");
    if (attempt.gatewayOrderId)
      return publicOrderDetails({
        id: attempt.gatewayOrderId,
        amount: attempt.amountPaise,
        currency: "INR",
      });
  } else {
    const quote = await quoteCheckout(userId, input);
    try {
      attempt = await RazorpayAttempt.create({
        user: userId,
        requestId: input.requestId,
        intentHash: fingerprint,
        cartHash: hashCheckoutData(quote.lines),
        amountPaise: quote.amountPaise,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      attempt = await RazorpayAttempt.findOne({
        user: userId,
        requestId: input.requestId,
      });
      if (!attempt) throw error;
      assertIntent(attempt, input);
      if (attempt.gatewayOrderId)
        return publicOrderDetails({
          id: attempt.gatewayOrderId,
          amount: attempt.amountPaise,
          currency: "INR",
        });
    }
  }

  const now = new Date();
  const claimed = await RazorpayAttempt.findOneAndUpdate(
    {
      _id: attempt._id,
      $or: [
        { status: "pending" },
        { status: "creating", leaseUntil: { $lt: now } },
      ],
    },
    {
      $set: {
        status: "creating",
        leaseUntil: new Date(now.getTime() + leaseDurationMs),
      },
    },
    { new: true },
  );
  if (!claimed) {
    const latest = await RazorpayAttempt.findById(attempt._id);
    if (latest?.gatewayOrderId)
      return publicOrderDetails({
        id: latest.gatewayOrderId,
        amount: latest.amountPaise,
        currency: "INR",
      });
    fail(409, "Checkout is being prepared. Retry with the same checkout reference.");
  }

  try {
    const gatewayOrder = await razorpayRequest("/orders", {
      method: "POST",
      body: {
        amount: claimed.amountPaise,
        currency: "INR",
        receipt: input.requestId,
        notes: { checkout_reference: input.requestId },
      },
    });
    if (
      !gatewayOrder ||
      typeof gatewayOrder !== "object" ||
      Array.isArray(gatewayOrder) ||
      !/^order_[A-Za-z0-9]+$/.test(gatewayOrder.id || "") ||
      gatewayOrder.amount !== claimed.amountPaise ||
      gatewayOrder.currency !== "INR"
    )
      fail(503, "Razorpay returned an invalid order. Retry checkout.");

    await RazorpayAttempt.updateOne(
      { _id: claimed._id, status: "creating" },
      {
        $set: { status: "created", gatewayOrderId: gatewayOrder.id },
        $unset: { leaseUntil: "" },
      },
    );
    return publicOrderDetails(gatewayOrder);
  } catch (error) {
    await RazorpayAttempt.updateOne(
      { _id: claimed._id, status: "creating" },
      { $set: { status: "pending" }, $unset: { leaseUntil: "" } },
    );
    throw error;
  }
}

export async function verifyRazorpayPayment(userId, input) {
  const credentials = razorpayCredentials();
  if (!credentials) fail(503, "Razorpay is not configured. Use cash on delivery.");

  const attempt = await RazorpayAttempt.findOne({
    user: userId,
    requestId: input.requestId,
  });
  if (!attempt || attempt.gatewayOrderId !== input.razorpayOrderId)
    fail(409, "Payment does not match this checkout.");
  assertIntent(attempt, input);
  if (
    !razorpaySignatureMatches(
      input.razorpayOrderId,
      input.razorpayPaymentId,
      input.razorpaySignature,
      credentials.keySecret,
    )
  )
    fail(400, "Razorpay payment signature could not be verified.");

  const existingOrder = await Order.findOne({
    user: userId,
    requestId: input.requestId,
  });
  if (existingOrder && existingOrder.paymentMethod !== "razorpay")
    fail(409, "This checkout reference already belongs to another payment method.");
  if (attempt.status === "complete") {
    if (attempt.paymentId !== input.razorpayPaymentId)
      fail(409, "This checkout was completed with a different payment.");
    const completed = await Order.findById(attempt.order);
    if (!completed) fail(500, "Completed payment is missing its order record.");
    return { order: completed, status: 200 };
  }
  if (attempt.status === "refunding" || attempt.status === "refunded")
    fail(409, "This payment is being refunded. Start a new checkout after reviewing your bag.");
  if (existingOrder) {
    await RazorpayAttempt.updateOne(
      { _id: attempt._id },
      {
        $set: { status: "complete", order: existingOrder._id },
        $unset: { leaseUntil: "" },
      },
    );
    return { order: existingOrder, status: 200 };
  }
  if (attempt.paymentId && attempt.paymentId !== input.razorpayPaymentId)
    fail(409, "This checkout is already associated with another payment.");

  const now = new Date();
  const claimed = await RazorpayAttempt.findOneAndUpdate(
    {
      _id: attempt._id,
      $or: [
        { status: "created" },
        { status: "processing", leaseUntil: { $lt: now } },
      ],
    },
    {
      $set: {
        status: "processing",
        paymentId: input.razorpayPaymentId,
        leaseUntil: new Date(now.getTime() + leaseDurationMs),
      },
    },
    { new: true },
  );
  if (!claimed) {
    const latest = await RazorpayAttempt.findById(attempt._id);
    if (latest?.status === "complete" && latest.paymentId === input.razorpayPaymentId) {
      const completed = await Order.findById(latest.order);
      if (completed) return { order: completed, status: 200 };
    }
    fail(409, "Payment confirmation is being processed. Retry shortly.");
  }

  let paymentCaptured = false;
  let paymentFailed = false;
  try {
    let payment = await razorpayRequest(`/payments/${encodeURIComponent(input.razorpayPaymentId)}`);
    if (
      !payment ||
      typeof payment !== "object" ||
      Array.isArray(payment) ||
      payment.order_id !== claimed.gatewayOrderId ||
      payment.amount !== claimed.amountPaise ||
      payment.currency !== "INR"
    )
      fail(400, "Razorpay payment details do not match this order.");
    if (payment.status === "authorized") {
      payment = await razorpayRequest(
        `/payments/${encodeURIComponent(input.razorpayPaymentId)}/capture`,
        {
          method: "POST",
          body: { amount: claimed.amountPaise, currency: "INR" },
        },
      );
    }
    if (
      !payment ||
      typeof payment !== "object" ||
      Array.isArray(payment) ||
      payment.status !== "captured" ||
      payment.order_id !== claimed.gatewayOrderId ||
      payment.amount !== claimed.amountPaise ||
      payment.currency !== "INR"
    )
      fail(402, "Razorpay has not confirmed the payment. No order was placed.");
    paymentCaptured = true;

    const order = await checkout(userId, input, "razorpay", claimed.amountPaise, claimed.cartHash);
    await RazorpayAttempt.updateOne(
      { _id: claimed._id },
      {
        $set: { status: "complete", order: order._id },
        $unset: { leaseUntil: "" },
      },
    );
    try {
      await sendOrderConfirmation(order);
    } catch (error) {
      logger.warn("Razorpay order notification failed", { errorType: error.name });
    }
    return { order, status: 201 };
  } catch (error) {
    if (!paymentCaptured && error.status === 402) paymentFailed = true;
    if (paymentCaptured && error.status >= 400 && error.status < 500) {
      let refund;
      try {
        refund = await razorpayRequest(
          `/payments/${encodeURIComponent(input.razorpayPaymentId)}/refund`,
          {
            method: "POST",
            body: { amount: claimed.amountPaise },
          },
        );
      } catch (refundError) {
        logger.error("Razorpay refund could not be confirmed", {
          errorType: refundError.name,
        });
        await RazorpayAttempt.updateOne(
          { _id: claimed._id, status: "processing" },
          { $set: { status: "refunding" }, $unset: { leaseUntil: "" } },
        );
        fail(503, "Payment was captured but the refund could not be confirmed. Contact support.");
      }
      if (
        !refund ||
        typeof refund !== "object" ||
        Array.isArray(refund) ||
        refund.payment_id !== input.razorpayPaymentId ||
        refund.amount !== claimed.amountPaise ||
        !["processed", "pending"].includes(refund.status)
      ) {
        logger.error("Razorpay refund could not be confirmed", {
          errorType: "InvalidResponse",
        });
        await RazorpayAttempt.updateOne(
          { _id: claimed._id, status: "processing" },
          { $set: { status: "refunding" }, $unset: { leaseUntil: "" } },
        );
        fail(503, "Payment was captured but the refund could not be confirmed. Contact support.");
      }
      const refundProcessed = refund.status === "processed";
      await RazorpayAttempt.updateOne(
        { _id: claimed._id, status: "processing" },
        {
          $set: {
            status: refundProcessed ? "refunded" : "refunding",
            ...(refund.id ? { refundId: refund.id } : {}),
          },
          $unset: { leaseUntil: "" },
        },
      );
      if (refundProcessed)
        fail(402, "Payment was refunded because your bag changed. Review it and start checkout again.");
      fail(503, "Your payment refund has been initiated. Please wait before trying checkout again.");
    }
    await RazorpayAttempt.updateOne(
      { _id: claimed._id, status: "processing" },
      {
        $set: { status: "created" },
        $unset: {
          leaseUntil: "",
          ...(paymentFailed ? { paymentId: "" } : {}),
        },
      },
    );
    throw error;
  }
}
