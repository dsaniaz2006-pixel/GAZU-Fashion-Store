import React, { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import {
  StorefrontProvider,
  useStorefront,
} from "../context/StorefrontContext.jsx";
import { ErrorState } from "../components/AsyncState.jsx";
import BrandIntro from "../components/brand/BrandIntro.jsx";
import {
  introPlaybackOptions,
  shouldPlayBrandIntro,
} from "../components/brand/brandIntroSession.js";

function canShowIntro(location) {
  if (typeof window === "undefined") return false;
  return shouldPlayBrandIntro(introPlaybackOptions(location, window));
}
function Shell() {
  const location = useLocation();
  const [introActive, setIntroActive] = useState(() => canShowIntro(location));
  const focusBeforeIntroRef = useRef(null);
  const heroRevealRef = useRef(null);
  const registerHeroReveal = useCallback((callback) => {
    heroRevealRef.current = callback;
    return () => { if (heroRevealRef.current === callback) heroRevealRef.current = null; };
  }, []);
  const beginHeroReveal = useCallback(() => heroRevealRef.current?.(), []);
  const completeIntro = useCallback(() => {
    setIntroActive(false);
    const previous = focusBeforeIntroRef.current;
    if (previous && previous.isConnected) {
      window.requestAnimationFrame(() => previous.focus?.({ preventScroll: true }));
    }
  }, []);

  useEffect(() => {
    if (!introActive) return;
    const focused = document.activeElement;
    if (focused && focused !== document.body) focusBeforeIntroRef.current = focused;
  }, [introActive]);

  // The storefront shell stays mounted behind the intro. React owns the
  // overlay lifecycle and the inert state, so covered controls cannot be used.
  useEffect(() => {
    if (location.pathname !== "/") {
      setIntroActive(false);
    } else if (canShowIntro(location)) {
      setIntroActive(true);
    }
  }, [location.pathname, location.search]);

  const auth = useAuth(),
    bag = useCart(),
    { toast, dismissToast } = useStorefront();
  return (
    <>
      <div className="site-shell" inert={introActive} aria-hidden={introActive ? "true" : undefined}>
        <Header />
        {location.pathname.startsWith("/account") && auth.message && (
          <p role="alert" className="error-box">
            {auth.message}
          </p>
        )}
        {bag.error && <ErrorState message={bag.error} retry={bag.refresh} />}
        <Outlet context={{ introActive, registerHeroReveal }} />
        <Footer />
      </div>
      {introActive && <BrandIntro onHeroReveal={beginHeroReveal} onComplete={completeIntro} />}
      {toast && (
        <div className="toast" role="status" inert={introActive}>
          {toast}
          <button aria-label="Dismiss notification" onClick={dismissToast}>
            ×
          </button>
        </div>
      )}
    </>
  );
}
export default function StorefrontLayout() {
  return (
    <StorefrontProvider>
      <Shell />
    </StorefrontProvider>
  );
}
