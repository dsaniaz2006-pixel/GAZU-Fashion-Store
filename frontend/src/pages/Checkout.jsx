import React, { useRef, useState } from "react";
import { api } from "../api.js";
import OrderSummary from "../components/OrderSummary.jsx";
import { LoadingState, ErrorState } from "../components/AsyncState.jsx";

const money = (n) =>
  (n / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  });

let razorpayScript;

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (!razorpayScript) {
    razorpayScript = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        razorpayScript = null;
        reject(new Error("Could not load Razorpay Checkout. Check your connection and retry."));
      };
      document.body.appendChild(script);
    });
  }
  return razorpayScript;
}

async function openRazorpayCheckout(paymentOrder, user) {
  await loadRazorpay();
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback, result) => {
      if (settled) return;
      settled = true;
      callback(result);
    };
    const checkout = new window.Razorpay({
      key: paymentOrder.keyId,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      name: "GAZU",
      description: "GAZU store order",
      order_id: paymentOrder.id,
      prefill: { name: user.name, email: user.email },
      handler: (result) => finish(resolve, result),
      modal: {
        ondismiss: () =>
          finish(reject, new Error("Payment was cancelled. No order was placed.")),
      },
    });
    checkout.on("payment.failed", (result) => {
      finish(
        reject,
        new Error(result.error?.description || "Payment failed. Please retry checkout."),
      );
    });
    checkout.open();
  });
}

// Submit delivery details only.
// The server loads the cart and calculates all prices.
export default function Checkout({
  cart,
  user,
  mockEnabled,
  onComplete,
  go,
  cartLoading = false,
  cartError = "",
  retryCart,
  configLoading = false,
  configError = "",
  retryConfig,
  submitOrder,
  razorpayEnabled = false,
}) {
  const [shipping, setShipping] = useState({
    name: user?.name || "",
    address: "",
    city: "",
    pin: "",
    phone: "",
  });

  const change = (e) =>
    setShipping((old) => ({
      ...old,
      [e.target.name]: e.target.value,
    }));

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [method, setMethod] = useState("cod");
  const [couponCode,setCouponCode]=useState('');
  const [giftCardCode,setGiftCardCode]=useState('');
  const [order, setOrder] = useState(null);

  const requestId = useRef(crypto.randomUUID());
  const submitting = useRef(false);

  async function submit(event) {
    event.preventDefault();

    if (submitting.current || cartLoading) return;
    submitting.current = true;

    setBusy(true);
    setError("");

    const body = {
      requestId: requestId.current,
      shipping,
      ...(couponCode.trim()?{couponCode:couponCode.trim().toUpperCase()}:{}),
      ...(giftCardCode.trim()?{giftCardCode:giftCardCode.trim().toUpperCase()}:{}),
    };

    if (method === "mock" || method === "failure") {
      body.outcome = method === "mock" ? "success" : "failure";
    }

    try {
      let saved;
      if (method === "razorpay") {
        const paymentOrder = await api("/payments/razorpay/order", {
          method: "POST",
          body,
        });
        const payment = await openRazorpayCheckout(paymentOrder, user);
        const verifyBody = {
          ...body,
          razorpayOrderId: payment.razorpay_order_id,
          razorpayPaymentId: payment.razorpay_payment_id,
          razorpaySignature: payment.razorpay_signature,
        };
        saved = submitOrder
          ? await submitOrder("/payments/razorpay/verify", verifyBody)
          : await api("/payments/razorpay/verify", {
              method: "POST",
              body: verifyBody,
            });
      } else {
        saved = await (
          submitOrder ? (path, options) => submitOrder(path, options.body) : api
        )(method === "cod" ? "/orders/checkout" : "/payments/mock/checkout", {
          method: "POST",
          body,
        });
      }

      setOrder(saved);
      api('/events',{method:'POST',body:{type:'order_complete'}}).catch(()=>{});
      onComplete();
    } catch (e) {
      if (e.status === 402) requestId.current = crypto.randomUUID();
      setError(e.message);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  // Customer must sign in before checkout.
  if (!user) {
    return (
      <div className="empty">
        <h1>SIGN IN TO CHECK OUT</h1>

        <button className="btn dark" onClick={() => go("account")}>
          SIGN IN
        </button>
      </div>
    );
  }

  // Successful order confirmation page.
  if (order) {
    return (
      <div className="empty">
        <p className="eyebrow">THANK YOU, {user.name}</p>

        <h1>ORDER PLACED</h1>

        <p className="order-id">
          Order Number: {order.orderNumber || order._id}
        </p>

        <p>
          Total: {money(order.totalPaise)} ·{" "}
          {order.paymentMethod === "cod"
            ? "Pay on delivery"
            : order.paymentMethod === "razorpay"
              ? "Paid securely with Razorpay"
              : "Mock payment — no money charged"}
        </p>

        <section className="form-note" role="status" aria-live="polite">
          <h2>CHECK YOUR MAILBOX</h2>
          <p>Your order confirmation email for {user.email || "your registered email address"}:</p>
          {order.confirmationEmail?.status === "submitted" ? (
            <p><strong>Submitted to email service.</strong> Please check your Inbox, Spam and Promotions folders. Email submission does not guarantee Inbox delivery.</p>
          ) : order.confirmationEmail?.status === "failed" ? (
            <p>Email submission failed, but your order is placed successfully. Please check My Orders for the latest status.</p>
          ) : (
            <p>Your email status is {order.confirmationEmail?.status || "pending"}. Please check My Orders shortly.</p>
          )}
        </section>

        <button className="btn dark" onClick={() => go("track")}>
          VIEW MY ORDERS
        </button>
      </div>
    );
  }

  if (!busy && cartLoading)
    return (
      <div className="page-wrap">
        <LoadingState>Loading your bag...</LoadingState>
      </div>
    );
  if (!busy && cartError && !cart.length)
    return (
      <div className="page-wrap">
        <ErrorState message={cartError} retry={retryCart} />
      </div>
    );
  // Empty cart screen.
  if (!cart.length) {
    return (
      <div className="empty">
        <h1>YOUR BAG IS EMPTY</h1>

        <button className="btn dark" onClick={() => go("shop", "All")}>
          BROWSE PRODUCTS
        </button>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="page-title">
        <p className="eyebrow">ALMOST YOURS</p>

        <h1>CHECKOUT</h1>
      </div>

      <div className="cart-layout checkout-layout">
        <form className="checkout-form" onSubmit={submit}>
          <h2>DELIVERY DETAILS</h2>

          <label>
            Full name
            <input
              name="name"
              value={shipping.name}
              onChange={change}
              autoComplete="name"
              minLength={2}
              maxLength={100}
              required
            />
          </label>

          <label>
            Address
            <input
              name="address"
              value={shipping.address}
              onChange={change}
              autoComplete="street-address"
              minLength={5}
              maxLength={300}
              required
            />
          </label>

          <div className="form-row">
            <label>
              City
              <input
                name="city"
                value={shipping.city}
                onChange={change}
                autoComplete="address-level2"
                minLength={2}
                maxLength={80}
                required
              />
            </label>

            <label>
              PIN code
              <input
                name="pin"
                value={shipping.pin}
                onChange={change}
                autoComplete="postal-code"
                inputMode="numeric"
                pattern="[1-9][0-9]{5}"
                required
              />
            </label>
          </div>

          <label>
            Phone
            <input
              name="phone"
              value={shipping.phone}
              onChange={change}
              autoComplete="tel"
              inputMode="tel"
              pattern="[0-9]{10}"
              required
            />
          </label>

          <label>Promo code (optional)<input value={couponCode} maxLength={24} onChange={e=>setCouponCode(e.target.value)} placeholder="GAZU offer code" /></label>
          <label>Gift credit code (optional)<input value={giftCardCode} maxLength={34} onChange={e=>setGiftCardCode(e.target.value)} placeholder="GAZU-GIFT-..." /></label>
          <p className="form-note">Discounts and gift credit are verified by the server when you place an order. The amount shown in the bag may differ from the final discounted total.</p>
          {configLoading && (
            <LoadingState>Loading payment options...</LoadingState>
          )}
          {configError && (
            <ErrorState message={configError} retry={retryConfig} />
          )}
          <label>
            Payment method
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              disabled={busy}
            >
              <option value="cod">Cash on delivery</option>

              {mockEnabled && (
                <>
                  <option value="mock">Mock payment — simulate success</option>

                  <option value="failure">
                    Mock payment — simulate failure
                  </option>
                </>
              )}
              {razorpayEnabled && (
                <option value="razorpay">Pay online with Razorpay</option>
              )}
            </select>
          </label>

          {method === "razorpay" && (
            <p className="form-note">
              You’ll securely complete payment in Razorpay Checkout.
            </p>
          )}
          {method === "mock" && (
            <p className="form-note">
              Mock payments are free local simulations. No money is charged.
            </p>
          )}

          {error && (
            <p role="alert" className="error-box">
              {error}
            </p>
          )}

          <button disabled={busy} className="btn dark full">
            {busy ? "PLACING ORDER…" : "PLACE ORDER"}
          </button>
        </form>

        <OrderSummary cart={cart} />
      </div>
    </div>
  );
}
