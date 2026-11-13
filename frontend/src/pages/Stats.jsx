import React from "react";
import { useFetch } from "../hooks/useFetch.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ErrorState } from "../components/AsyncState.jsx";
import { money } from "../format.js";

const statusNames = { placed: "Placed", preparing: "Preparing", out_for_delivery: "Out for delivery", delivered: "Delivered" };
const rupees = (paise) => money((Number(paise) || 0) / 100);

export default function Stats() {
  const { token, user } = useAuth();
  const { data, loading, error, reload } = useFetch(user?.role === "admin" ? "/admin/stats" : null, 0, token);
  if (user?.role !== "admin") return <p role="alert">Administrator access required.</p>;
  if (loading || !data && !error) return <p role="status">Loading statistics...</p>;
  if (error) return <ErrorState message={error} retry={reload} />;
  const cards = [
    ["Paid and collected revenue by day", data.revenuePerDay || [], x => `${x._id}: ${rupees(x.revenuePaise)} (${x.orders} orders)`],
    ["Simulated mock payments — not real collections", data.mockPaymentsPerDay || [], x => `${x._id}: ${rupees(x.simulatedPaise)} (${x.orders} simulated orders)`],
    ["Orders by status", data.ordersByStatus || [], x => `${statusNames[x._id] || x._id}: ${x.count}`],
    ["Top-selling products", data.topProducts || [], x => `${x.name}: ${x.quantity} units · ${rupees(x.salesPaise)} order value`],
    ["Low-stock products (5 or fewer)", data.lowStock || [], x => `${x.name}: ${x.quantity} remaining`]
  ];
  return (
    <section className="stats-page">
      <h1>STORE STATISTICS</h1>
      <p>All amounts are in INR. Collected revenue excludes simulated mock-payment orders. Cash on Delivery is counted only after collection.</p>
      <div className="grid gap-6 md:grid-cols-2">
        {cards.map(([heading, rows, describe]) => (
          <article className="order-card stats-card" key={heading}>
            <h2>{heading}</h2>
            {rows.length ? <ul>{rows.map((row, i) => <li key={row._id ?? i}>{describe(row)}</li>)}</ul> : <p>No data available.</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
