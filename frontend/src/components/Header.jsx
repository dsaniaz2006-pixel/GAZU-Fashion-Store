import React, { useEffect, useId, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Search,
  UserRound,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ArrowRight,
  ChevronDown,
  BrainCircuit,
} from "lucide-react";
import { useStorefront } from "../context/StorefrontContext.jsx";
import GazuLiquidNav from "./ui/GazuLiquidNav.jsx";
import GazuLiquidUtilityNav from "./ui/GazuLiquidUtilityNav.jsx";
import { activeGazuLiquidItem } from "./ui/liquidNavRoutes.mjs";
import { GAZU_AI_LINKS, GAZU_ADMIN_AI_LINKS, isGazuAiRoute } from "./ui/aiNavRoutes.mjs";
export default function Header() {
  const location = useLocation();
  const isEditorialHome = location.pathname === "/";
  const mobileActive = activeGazuLiquidItem(location.pathname, location.search);
  const [mobileAiOpen, setMobileAiOpen] = useState(false);
  const mobileAiMenuId = useId();
  useEffect(() => { setMobileAiOpen(false); }, [location.pathname, location.search]);
  const {
    user,
    wishlist,
    totalQty,
    go,
    notify,
    searchOpen,
    setSearchOpen,
    query,
    setQuery,
    menuOpen,
    setMenuOpen,
  } = useStorefront();
  return (
    <>
      {!isEditorialHome && <div className="topbar">
        <span>COMPLIMENTARY DELIVERY ON ORDERS ABOVE ₹999</span>
        <div>
          <button onClick={() => notify("App experience coming soon")}>
            DOWNLOAD APP
          </button>
          <i /> <button onClick={() => go("track")}>TRACK ORDER</button>
          <i /> <button onClick={() => go("help")}>HELP</button>
        </div>
      </div>}
      <header className={`header${isEditorialHome ? " ns-editorial-header" : ""}`}>
        <button
          className="mobile-menu icon-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <div className={`left-nav ${menuOpen ? "show" : ""}`}>
          <div className="gazu-liquid-desktop">
            <GazuLiquidNav />
          </div>
          <nav className="gazu-mobile-links" aria-label="Mobile categories">
            <button aria-current={mobileActive === 0 ? "page" : undefined} onClick={() => go("home")}>HOME</button>
            <button aria-current={mobileActive === 1 ? "page" : undefined} onClick={() => go("shop", "Men")}>MEN</button>
            <button aria-current={mobileActive === 2 ? "page" : undefined} onClick={() => go("shop", "Women")}>WOMEN</button>
            <button aria-current={mobileActive === 3 ? "page" : undefined} onClick={() => go("shop", "Kids")}>KIDS</button>
            <button aria-current={mobileActive === 4 ? "page" : undefined} onClick={() => go("shop", "All")}>SHOP ALL</button>
            <button aria-current={mobileActive === 5 ? "page" : undefined} onClick={() => go("about")}>OUR STORY</button>
            <button
              type="button"
              aria-expanded={mobileAiOpen}
              aria-controls={mobileAiMenuId}
              aria-current={isGazuAiRoute(location.pathname) ? "page" : undefined}
              onClick={() => setMobileAiOpen((open) => !open)}
            >
              <BrainCircuit size={15} aria-hidden="true" /> AI <ChevronDown size={14} aria-hidden="true" />
            </button>
            {mobileAiOpen && (
              <div className="gazu-mobile-ai-menu" id={mobileAiMenuId} role="group" aria-label="AI features mobile">
                {(user?.role === "admin" ? [...GAZU_AI_LINKS, ...GAZU_ADMIN_AI_LINKS] : GAZU_AI_LINKS).map((link) => (
                  <button type="button" key={link.route} onClick={() => { setMobileAiOpen(false); setMenuOpen(false); go(link.destination); }}>
                    {link.label}
                  </button>
                ))}
              </div>
            )}
          </nav>
        </div>
        <button className={`wordmark${isEditorialHome ? " ns-editorial-wordmark" : ""}`} onClick={() => go("home")} aria-label="GAZU home">
          GAZU
          {isEditorialHome && <small>STUDIO</small>}
        </button>
        <div className="right-nav">
          {/* The second Waterline instance is independent of the primary category pill.
              Mobile keeps the original compact actions instead of loading two tight pills. */}
          <div className="gazu-liquid-utility-desktop">
            <GazuLiquidUtilityNav />
          </div>
          <div className="gazu-mobile-utilities">
            {user?.role === "admin" && (
              <button onClick={() => go("admin")} aria-label="Admin dashboard">
                <UserRound /> <span>ADMIN</span>
              </button>
            )}
            <button onClick={() => setSearchOpen(!searchOpen)} aria-label="Search" aria-expanded={searchOpen}>
              <Search /> <span>SEARCH</span>
            </button>
            <button onClick={() => go("account")} aria-label={user ? "Account" : "Sign in"}>
              <UserRound /> <span>{user ? "ACCOUNT" : "SIGN IN"}</span>
            </button>
            <button onClick={() => go("wishlist")} aria-label={`Wishlist, ${wishlist.length} saved items`}>
              <Heart /> <span>WISHLIST</span><b>{wishlist.length || ""}</b>
            </button>
            <button onClick={() => go("cart")} aria-label={`Bag, ${totalQty} items`}>
              <ShoppingBag /> <span>BAG</span><b>({totalQty})</b>
            </button>
          </div>
        </div>
      </header>
      {searchOpen && (
        <div className="search-panel" id="gazu-search-panel">
          <Search size={19} />
          <input
            autoFocus
            placeholder="Search essentials, styles, collections..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go("shop", "All")}
          />
          <button onClick={() => go("shop", "All")}>
            SEARCH <ArrowRight size={15} />
          </button>
          <button
            className="icon-btn"
            onClick={() => {
              setSearchOpen(false);
              setQuery("");
            }}
          >
            <X />
          </button>
        </div>
      )}
    </>
  );
}
