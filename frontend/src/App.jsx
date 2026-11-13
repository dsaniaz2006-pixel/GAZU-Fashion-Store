import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { ProtectedRoute, AdminRoute } from "./routes/Guards.jsx";
import {
  AccountRoute,
  CheckoutRoute,
  AdminProductsRoute,
} from "./routes/ConnectedPages.jsx";
import StorefrontLayout from "./layouts/StorefrontLayout.jsx";
import AccountLayout from "./layouts/AccountLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import Home from "./components/Home.jsx";
import Cart from "./components/Cart.jsx";
import Wishlist from "./components/Wishlist.jsx";
import Help from "./components/Help.jsx";
import About from "./components/About.jsx";
import Shop from "./pages/Shop.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Orders from "./pages/Orders.jsx";
import Stats from "./pages/Stats.jsx";
import Lookbook from "./pages/Lookbook.jsx";
import StyleFinder from "./pages/StyleFinder.jsx";
import ShoppingAssistant from "./pages/wave2/ShoppingAssistant.jsx";
import VisualSearch from "./pages/wave2/VisualSearch.jsx";
import Discovery from "./pages/wave2/Discovery.jsx";
import Profile from "./pages/Profile.jsx";
import Launches from "./pages/Launches.jsx";
import Operations from "./pages/Operations.jsx";
import MarketingPanel from "./pages/MarketingPanel.jsx";
import Staff from "./pages/Staff.jsx";
import FitAssistant from "./pages/wave3/FitAssistant.jsx";
import SupportAssistant from "./pages/wave3/SupportAssistant.jsx";
import AdminAIStudio from "./pages/wave3/AdminAIStudio.jsx";
import InventoryForecast from "./pages/wave3/InventoryForecast.jsx";
import SupportDesk from "./pages/wave3/SupportDesk.jsx";
export default function App() {
  const location = useLocation();
  return (
    <Routes>
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop-the-look" element={<Lookbook />} />
        <Route path="/style-finder" element={<StyleFinder />} />
        <Route path="/ai-assistant" element={<ShoppingAssistant />} />
        <Route path="/visual-search" element={<VisualSearch />} />
        <Route path="/discover" element={<Discovery />} />
        <Route path="/fit-assistant" element={<FitAssistant />} />
        <Route path="/support" element={<SupportAssistant />} />
        <Route path="/launches" element={<Launches />} />
        <Route
          path="/product/:id"
          element={<ProductDetail key={location.pathname} />}
        />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<AccountRoute />} />
          <Route element={<ProtectedRoute />}>
            <Route path="profile" element={<Profile />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<Orders detail />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/checkout" element={<CheckoutRoute />} />
          <Route path="/support-desk" element={<SupportDesk />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Stats />} />
              <Route path="products" element={<AdminProductsRoute />} />
              <Route path="orders" element={<Orders admin />} />
              <Route path="stats" element={<Stats />} />
              <Route path="operations" element={<Operations />} />
              <Route path="marketing" element={<MarketingPanel />} />
              <Route path="staff" element={<Staff />} />
              <Route path="ai-studio" element={<AdminAIStudio />} />
              <Route path="inventory-forecast" element={<InventoryForecast />} />
            </Route>
          </Route>
        </Route>
        <Route path="/help" element={<Help />} />
        <Route path="/about" element={<About />} />
        <Route
          path="*"
          element={
            <div className="page-wrap">
              <h1>Page not found</h1>
              <Link to="/shop">Shop products</Link>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
