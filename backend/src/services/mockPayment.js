import Order from "../models/Order.js";
import PaymentAttempt from "../models/PaymentAttempt.js";
import { checkout } from "./checkout.js";
import { fail } from "../utils/errors.js";
import { logger } from "../config/logger.js";
import { sendOrderConfirmation } from "./orderNotifications.js";
import { hashCheckoutData, quoteCheckout } from "./checkoutQuote.js";

const serviceUrl = () => process.env.PAYMENT_SERVICE_URL || "http://127.0.0.1:4001";
const paymentTimeout = () => Math.min(15000, Math.max(1000, Number(process.env.PAYMENT_TIMEOUT_MS) || 5000));
export async function mockCheckout(userId, input, traceId) {
  // Preserve the original order idempotency contract when a response was lost.
  const existingOrder = await Order.findOne({ user: userId, requestId: input.requestId });
  if (existingOrder) {
    const attempt = await PaymentAttempt.findOne({ user: userId, requestId: input.requestId });
    if (existingOrder.paymentMethod !== "mock" || !attempt || attempt.intentHash !== hashCheckoutData({ shipping: input.shipping, outcome: input.outcome, couponCode:input.couponCode||'', giftCardCode:input.giftCardCode||'' }))
      fail(409, "Checkout reference already belongs to a different request.");
    return { order: existingOrder, status: 200 };
  }
  const intentHash = hashCheckoutData({ shipping: input.shipping, outcome: input.outcome, couponCode:input.couponCode||'', giftCardCode:input.giftCardCode||'' });
  let attempt = await PaymentAttempt.findOne({ user: userId, requestId: input.requestId });
  if (!attempt) {
    const q = await quoteCheckout(userId,input);
    try {
      attempt = await PaymentAttempt.create({ user: userId, requestId: input.requestId, intentHash, cartHash: hashCheckoutData(q.lines), amountPaise: q.amountPaise, outcome: input.outcome });
    } catch (err) {
      if (err.code !== 11000) throw err;
      attempt = await PaymentAttempt.findOne({ user: userId, requestId: input.requestId });
    }
  }
  if (!attempt || attempt.intentHash !== intentHash) fail(409, "Checkout reference conflicts with an earlier request.");
  if (attempt.status === "declined") fail(402, "Mock payment declined. No order was created.");
  // Conditional lease prevents concurrent duplicate processing. Expired leases are retryable.
  const claimed = await PaymentAttempt.findOneAndUpdate({ _id: attempt._id, $or: [
    { status: { $in: ["pending", "approved"] } },
    { status: "processing", leaseUntil: { $lt: new Date() } },
  ] }, { $set: { status: "processing", leaseUntil: new Date(Date.now() + 20000) } }, { new: true });
  if (!claimed) fail(409, "Checkout is being processed. Retry with the same checkout reference.");
  try {
    if (!attempt.transactionId) {
      // A network or timeout failure from the upstream payment simulator is a
      // temporary service outage (503), not an internal application error (500).
      // Preserve HTTP responses below so explicit 409/402 decisions still work.
      let response;
      try {
        response = await fetch(`${serviceUrl()}/internal/decision`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Service-Key": process.env.PAYMENT_SERVICE_SECRET || "", "X-Request-ID": traceId || "" },
          body: JSON.stringify({ idempotencyKey: input.requestId, amountPaise: attempt.amountPaise, outcome: input.outcome }),
          signal: AbortSignal.timeout(paymentTimeout()),
        });
      } catch (error) {
        if (error instanceof TypeError || error?.name === "TimeoutError" || error?.name === "AbortError") {
          fail(503, "Payment service is unavailable. Retry with the same checkout reference.");
        }
        throw error;
      }
      if (response.status === 409) fail(409, "Payment reference conflict.");
      if (!response.ok) fail(503, "Payment service is unavailable. Retry with the same checkout reference.");
      const body = await response.json();
      if (!body.simulated || typeof body.approved !== "boolean" || !/^[a-f0-9-]{36}$/i.test(body.transactionId || "")) fail(503, "Payment service returned an invalid result.");
      if (!body.approved) {
        await PaymentAttempt.updateOne({ _id: attempt._id }, { $set: { status: "declined", transactionId: body.transactionId }, $unset: { leaseUntil: "" } });
        fail(402, "Mock payment declined. No order was created.");
      }
      await PaymentAttempt.updateOne({ _id: attempt._id }, { $set: { status: "approved", transactionId: body.transactionId } });
      attempt.transactionId = body.transactionId;
    }
    // Rechecks authoritative price and stock inside a MongoDB transaction.
    // HTTP calls never execute inside that transaction.
    const order = await checkout(userId, input, "mock", attempt.amountPaise, attempt.cartHash);
    await PaymentAttempt.updateOne({ _id: attempt._id }, { $set: { status: "complete", order: order._id }, $unset: { leaseUntil: "" } });
    try { await sendOrderConfirmation(order); } catch (err) { logger.warn("Mock order notification failed", { errorType: err.name }); }
    return { order, status: 201 };
  } catch (err) {
    // Approved decisions are retained: retries reconcile instead of simulating a new payment.
    await PaymentAttempt.updateOne({ _id: attempt._id, status: "processing" }, { $set: { status: attempt.transactionId ? "approved" : "pending" }, $unset: { leaseUntil: "" } });
    throw err;
  }
}
