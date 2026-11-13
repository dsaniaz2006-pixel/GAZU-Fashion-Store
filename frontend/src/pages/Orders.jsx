import React, { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useFetch } from "../hooks/useFetch.js";
import OrderCard, { nextStatus } from "../components/OrderCard.jsx";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../components/AsyncState.jsx";
export default function Orders({ admin = false, detail = false }) {
  const { id } = useParams(),
    { token } = useAuth();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  const result = useFetch(
    admin ? "/admin/orders" : detail ? `/orders/${id}` : "/orders",
    0,
    token,
  );
  const orders = result.data ? (detail ? [result.data] : result.data) : [];
  async function change(order) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await api(`/admin/orders/${order._id}/status`, {
        method: "PATCH",
        body: { status: nextStatus[order.status] },
      });
      result.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section className={admin ? "" : "page-wrap"}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {admin ? "FULFILMENT" : "YOUR GAZU JOURNEY"}
          </p>
          <h1>
            {admin ? "ALL ORDERS" : detail ? "ORDER DETAILS" : "MY ORDERS"}
          </h1>
        </div>
        <button
          className="btn"
          disabled={result.loading || busy}
          onClick={() => {
            setError("");
            result.reload();
          }}
        >
          REFRESH
        </button>
      </div>
      {(error || result.error) && (
        <ErrorState message={error || result.error} retry={result.reload} />
      )}
      {result.loading ? (
        <LoadingState>Loading orders…</LoadingState>
      ) : !result.error && !orders.length ? (
        <EmptyState>No orders yet.</EmptyState>
      ) : (
        orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            admin={admin}
            busy={busy}
            onChange={change}
          />
        ))
      )}
    </section>
  );
}
