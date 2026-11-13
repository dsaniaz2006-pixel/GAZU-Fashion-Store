import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { LoadingState, ErrorState } from "../components/AsyncState.jsx";
export function ProtectedRoute() {
  const { user, ready, error, restore } = useAuth();
  const location = useLocation();
  if (!ready) return <LoadingState>Loading account...</LoadingState>;
  if (error) return <ErrorState message={error} retry={restore} />;
  return user ? (
    <Outlet />
  ) : (
    <Navigate
      to="/account"
      state={{ from: location.pathname + location.search + location.hash }}
      replace
    />
  );
}
export function AdminRoute() {
  const { user, ready } = useAuth();
  if (!ready) return <LoadingState>Loading account...</LoadingState>;
  return ["admin", "inventory_manager", "order_manager", "marketing_manager"].includes(user?.role) ? (
    <Outlet />
  ) : (
    <div className="page-wrap" role="alert">
      Administrator access required.
    </div>
  );
}
