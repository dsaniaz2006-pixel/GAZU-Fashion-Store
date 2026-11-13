import React from "react";
import { Link } from "react-router-dom";
export const statuses = {
  placed: "Placed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};
export const nextStatus = {
  placed: "preparing",
  preparing: "out_for_delivery",
  out_for_delivery: "delivered",
};
const money = (n) =>
  (n / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });
export default function OrderCard({
  order,
  admin = false,
  busy = false,
  onChange,
}) {
  const displayOrderNumber = order.orderNumber || order._id;
  const next = nextStatus;
  return (
    <article key={order._id} className="order-card">
      <div className="order-head">
        <div>
          <p className="order-id">
            {admin ? (
              <span>{displayOrderNumber}</span>
            ) : (
              <Link to={`/account/orders/${order._id}`}>
                {displayOrderNumber}
              </Link>
            )}
          </p>

          <small>
            {new Date(order.createdAt).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })}{" "}
            IST
          </small>
        </div>

        <span className="stock-badge">{statuses[order.status]}</span>
      </div>

      {admin && (
        <p>
          <b>{order.user?.name || "Customer"}</b> · {order.user?.email}
        </p>
      )}

      <ul>
        {order.items.map((item) => (
          <li key={item._id}>
            {item.name} × {item.quantity} —{" "}
            {money(item.unitPricePaise * item.quantity)}
          </li>
        ))}
      </ul>

      <p>
        <b>Total {money(order.totalPaise)}</b> · Delivery{" "}
        {money(order.deliveryPaise)}
      </p>

      <p>
        {order.paymentMethod === "cod"
          ? `Cash on delivery · ${order.paymentStatus}`
          : order.paymentMethod === "razorpay"
            ? "Paid securely with Razorpay"
            : "Mock paid — no real money charged"}
      </p>

      <p>
        Deliver to: {order.shipping.name}, {order.shipping.address},{" "}
        {order.shipping.city} — {order.shipping.pin}. Phone:{" "}
        {order.shipping.phone}
      </p>

      {admin && next[order.status] && (
        <button
          className="btn dark"
          disabled={busy}
          onClick={() => onChange(order)}
        >
          MARK {statuses[next[order.status]].toUpperCase()}
        </button>
      )}
    </article>
  );
}
