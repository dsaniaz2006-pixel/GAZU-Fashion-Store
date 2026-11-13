import React from "react";
const money = (n) =>
  (n / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });
export default function OrderSummary({ cart }) {
  const subtotal = cart.reduce((sum, p) => sum + p.pricePaise * p.qty, 0);
  return (
    <aside className="order-summary">
      <h2>YOUR ORDER</h2>

      {cart.map((p) => (
        <div key={p.id}>
          <span>
            {p.name} × {p.qty}
          </span>

          <b>{money(p.pricePaise * p.qty)}</b>
        </div>
      ))}

      <div>
        <span>Delivery</span>

        <b>{money(subtotal >= 99900 ? 0 : 9900)}</b>
      </div>

      <div className="summary-total">
        <span>ESTIMATED TOTAL</span>

        <b>{money(subtotal + (subtotal >= 99900 ? 0 : 9900))}</b>
      </div>

      <p>
        Final prices and availability are checked by the server when you place
        the order.
      </p>
    </aside>
  );
}
