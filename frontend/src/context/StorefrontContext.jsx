import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { useCart } from "./CartContext.jsx";
import { useWishlist } from "../features/wishlist/useWishlist.js";
import { storefrontPath } from "../lib/navigation/storefrontPaths.js";
export const StorefrontContext = createContext();
export const useStorefront = () => useContext(StorefrontContext);
export function StorefrontProvider({ children }) {
  const auth = useAuth(),
    bag = useCart(),
    navigate = useNavigate(),
    location = useLocation();
  const [version, setVersion] = useState(0),
    [searchOpen, setSearchOpen] = useState(false),
    [query, setQuery] = useState(""),
    [menuOpen, setMenuOpen] = useState(false),
    [email, setEmail] = useState(""),
    [subscribed, setSubscribed] = useState(false),
    [toast, setToast] = useState("");
  const user = auth.user,
    ready = auth.ready,
    cart = bag.cart,
    cartBusy = bag.busy;
  const go = (p, c, subcategory) => {
    const path = storefrontPath(p, c, subcategory, { searchOpen, query });
    navigate(path);
    setMenuOpen(false);
    setSearchOpen(false);
    window.scrollTo(0, 0);
  };
  const notify = setToast,
    addToCart = async (p) => {
      if (!user) {
        navigate("/account", {
          state: { from: location.pathname + location.search },
        });
        return;
      }
      if (p.variants?.length) { navigate(`/product/${p.id}`); notify('Choose your size on the product page.'); return; }
      try {
        await bag.add(p);
        notify("Added to bag");
      } catch (e) {
        notify(e.message);
      }
    },
    updateCart = (id, q, size = '') => bag.update(id, q, size).catch((e) => notify(e.message));
  const { wishlist, toggleWish } = useWishlist(user, notify);
  const reloadProducts = () => setVersion((v) => v + 1);
  const state = {
    version,
    reloadProducts,
    cartLoading: bag.loading,
    cartError: bag.error,
    refreshCart: bag.refresh,
    user,
    ready,
    cartBusy,
    cart,
    wishlist,
    totalQty: cart.reduce((s, p) => s + p.qty, 0),
    subtotal: cart.reduce((s, p) => s + p.price * p.qty, 0),
    go,
    notify,
    addToCart,
    updateCart,
    toggleWish,
    setSelected: (p) => p && navigate(`/product/${p.id}`),
    searchOpen,
    setSearchOpen,
    query,
    setQuery,
    menuOpen,
    setMenuOpen,
    email,
    setEmail,
    subscribed,
    setSubscribed,
  };

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);
  return (
    <StorefrontContext.Provider
      value={{ ...state, toast, dismissToast: () => setToast("") }}
    >
      {children}
    </StorefrontContext.Provider>
  );
}
