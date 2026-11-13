import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useStorefront } from "../context/StorefrontContext.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { LoadingState, ErrorState } from "../components/AsyncState.jsx";
import Account from "../pages/Account.jsx";
import Checkout from "../pages/Checkout.jsx";
import Admin from "../pages/Admin.jsx";
export function AccountRoute() {
  const auth = useAuth(),
    { go } = useStorefront(),
    location = useLocation(),
    navigate = useNavigate();
  if (!auth.ready) return <LoadingState>Loading account...</LoadingState>;
  if (auth.error)
    return <ErrorState message={auth.error} retry={auth.restore} />;
  return (
    <Account
      user={auth.user}
      onLogin={(data) => {
        auth.login(data);
        const target = location.state?.from;
        navigate(
          typeof target === "string" &&
            target.startsWith("/") &&
            !target.startsWith("//")
            ? target
            : data.user.role === "admin"
              ? "/admin/products"
              : "/shop",
          { replace: true },
        );
      }}
      onLogout={auth.logout}
      go={go}
    />
  );
}
export function CheckoutRoute() {
  const { user } = useAuth(),
    bag = useCart(),
    { go, reloadProducts } = useStorefront(),
    config = useFetch("/payments/config");
  return (
    <Checkout
      cart={bag.cart}
      user={user}
      cartLoading={bag.loading}
      cartError={bag.error}
      retryCart={bag.refresh}
      mockEnabled={config.data?.mockEnabled}
      razorpayEnabled={config.data?.razorpayEnabled}
      configLoading={config.loading}
      configError={config.error}
      retryConfig={config.reload}
      submitOrder={bag.checkout}
      onComplete={reloadProducts}
      go={go}
    />
  );
}
export function AdminProductsRoute() {
  const { user } = useAuth(),
    { go, reloadProducts } = useStorefront();
  return <Admin user={user} reload={reloadProducts} go={go} />;
}
