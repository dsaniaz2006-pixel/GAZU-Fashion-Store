import React from "react";
import { ShoppingBag, ArrowRight, Plus, Minus } from "lucide-react";
import { useStorefront } from "../context/StorefrontContext.jsx";
import { LoadingState, ErrorState } from "./AsyncState.jsx";
import { image, money } from "../format.js";
export default function Cart() {
  const {
    cartBusy,
    cartLoading,
    cartError,
    refreshCart,
    cart,
    totalQty,
    subtotal,
    go,
    updateCart,
    setSelected,
  } = useStorefront();
  return (
    <div className="page-wrap">
      <div className="page-title">
        <p className="eyebrow">YOUR EDIT, YOUR WAY</p>
        <h1>
          YOUR BAG <span>({totalQty})</span>
        </h1>
      </div>
      {cartLoading && !cart.length ? (
        <LoadingState>Loading your bag...</LoadingState>
      ) : cartError && !cart.length ? (
        <ErrorState message={cartError} retry={refreshCart} />
      ) : !cart.length ? (
        <div className="empty">
          <ShoppingBag size={36} />
          <h2>YOUR BAG IS TAKING A BREATHER.</h2>
          <p>It's a good time to find something you'll wear on repeat.</p>
          <button className="btn dark" onClick={() => go("shop", "All")}>
            EXPLORE THE COLLECTION <ArrowRight size={15} />
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((p) => (
              <div className="cart-item" key={`${p.id}:${p.size || ''}`}>
                <button onClick={() => setSelected(p)}>
                  <img src={image(p.img, 300)} alt={p.name} />
                </button>
                <div className="cart-item-copy">
                  <p className="eyebrow">
                    {p.category} / {p.color}
                  </p>
                  <h3>{p.name}</h3>
                  {p.size && <p>Size: {p.size}</p>}
                  <strong>{money(p.price)}</strong>
                  {(!p.available || p.qty > p.variantQuantity) && (
                    <p className="danger">
                      Unavailable quantity — reduce or remove this item.
                    </p>
                  )}
                  <div className="qty">
                    <button
                      aria-label={`Decrease quantity of ${p.name}`}
                      disabled={cartBusy || p.qty <= 1}
                      onClick={() => updateCart(p.id, p.qty - 1, p.size)}
                    >
                      <Minus size={13} />
                    </button>
                    <span>{p.qty}</span>
                    <button
                      aria-label={`Increase quantity of ${p.name}`}
                      disabled={
                        cartBusy ||
                        !p.available ||
                        p.qty >= Math.min(99, p.variantQuantity)
                      }
                      onClick={() => updateCart(p.id, p.qty + 1, p.size)}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
                <button
                  className="remove"
                  disabled={cartBusy}
                  onClick={() => updateCart(p.id, 0, p.size)}
                >
                  REMOVE
                </button>
              </div>
            ))}
          </div>
          <aside className="order-summary">
            <h2>ORDER SUMMARY</h2>
            <div>
              <span>Subtotal</span>
              <b>{money(subtotal)}</b>
            </div>
            <div>
              <span>Delivery</span>
              <b>{subtotal >= 999 ? "FREE" : "₹99"}</b>
            </div>
            <div className="summary-total">
              <span>TOTAL</span>
              <b>{money(subtotal + (subtotal >= 999 ? 0 : 99))}</b>
            </div>
            <p>Taxes included. Shipping calculated at checkout.</p>
            <button
              className="btn dark full"
              disabled={
                cartBusy || cart.some((p) => !p.available || p.qty > p.variantQuantity)
              }
              onClick={() => go("checkout")}
            >
              CONTINUE TO CHECKOUT <ArrowRight size={15} />
            </button>
            <button
              className="text-link center"
              onClick={() => go("shop", "All")}
            >
              CONTINUE SHOPPING
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
