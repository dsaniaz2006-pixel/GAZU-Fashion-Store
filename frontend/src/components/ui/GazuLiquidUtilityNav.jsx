import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import { useStorefront } from "../../context/StorefrontContext.jsx";
import { LiquidNavbar } from "./liquid-glass-navbar";
import { activeGazuUtilityItem } from "./liquidNavRoutes.mjs";

/** Right-hand Waterline pill. Behaves like the existing utility buttons: Search
 * toggles the existing search panel, all other actions navigate with React
 * Router, and the bag/wishlist totals reflect live StorefrontContext state.
 */
export default function GazuLiquidUtilityNav() {
  const { pathname } = useLocation();
  const { user, totalQty, wishlist, searchOpen, setSearchOpen, go } = useStorefront();
  const active = activeGazuUtilityItem(pathname, searchOpen, user?.role === "admin");
  const items = useMemo(() => {
    const actions = [
      { label: "SEARCH", icon: <Search size={17} aria-hidden="true" />, fx: "wave", ariaExpanded: searchOpen, ariaControls: "gazu-search-panel" },
      { label: user ? "ACCOUNT" : "SIGN IN", icon: <UserRound size={17} aria-hidden="true" />, fx: "pop" },
      { label: wishlist.length ? `WISHLIST (${wishlist.length})` : "WISHLIST", icon: <Heart size={17} aria-hidden="true" />, fx: "glow" },
      { label: `BAG (${totalQty})`, icon: <ShoppingBag size={17} aria-hidden="true" />, fx: "drop" },
    ];
    if (user?.role === "admin") {
      actions.push({ label: "ADMIN", icon: <UserRound size={17} aria-hidden="true" />, fx: "wave" });
    }
    return actions;
  }, [user, wishlist.length, totalQty, searchOpen]);

  const select = (index) => {
    switch (index) {
      case 0: setSearchOpen((previous) => !previous); break;
      case 1: go("account"); break;
      case 2: go("wishlist"); break;
      case 3: go("cart"); break;
      case 4: if (user?.role === "admin") go("admin"); break;
      default: break;
    }
  };

  return (
    <LiquidNavbar
      items={items}
      active={active}
      onChange={select}
      tone="light"
      compact={false}
      sound={false}
      className="gazu-liquid-navbar gazu-liquid-utility"
      ariaLabel="GAZU utility navigation"
    />
  );
}
