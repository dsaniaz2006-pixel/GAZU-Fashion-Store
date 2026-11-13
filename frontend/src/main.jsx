import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./styles.css";
import "./styles/phase7.css";
import "./styles/premium-upgrade.css";
import "./styles/editorial-expansion.css";
import "./styles/wave2.css";
import "./styles/wave3.css";
// Delete legacy Recently Viewed browser history from earlier GAZU versions.
// This does not touch wishlist, cart, sort preferences, or account data.
try {
  window.localStorage.removeItem("gazu-recently-viewed-v1");
} catch {
  // Storage might be blocked or unavailable; the removed feature is unused.
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
