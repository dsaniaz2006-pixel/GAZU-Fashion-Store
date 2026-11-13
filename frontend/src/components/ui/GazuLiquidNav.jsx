import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Baby, BookOpen, BrainCircuit, ChevronDown, Shirt, ShoppingBag, Users } from "lucide-react";
import { useStorefront } from "../../context/StorefrontContext.jsx";
import { LiquidNavbar, NimbusIcons } from "./liquid-glass-navbar";
import { GAZU_LIQUID_LINKS, activeGazuLiquidItem } from "./liquidNavRoutes.mjs";
import { GAZU_AI_LINKS, GAZU_ADMIN_AI_LINKS, isGazuAiRoute } from "./aiNavRoutes.mjs";

/** The original Waterline navbar remains intact. AI is a single Waterline
 * button which expands a translucent menu; it is not another navbar row. */
export default function GazuLiquidNav() {
  const { go, user } = useStorefront();
  const { pathname, search } = useLocation();
  const [aiOpen, setAiOpen] = useState(false);
  const wrapRef = useRef(null);
  const menuId = useId();
  const aiActive = isGazuAiRoute(pathname);
  const active = (aiOpen || aiActive) ? 6 : activeGazuLiquidItem(pathname, search);
  const links = user?.role === "admin"
    ? [...GAZU_AI_LINKS, ...GAZU_ADMIN_AI_LINKS]
    : GAZU_AI_LINKS;

  const items = useMemo(() => [
    { label: "HOME", icon: NimbusIcons.home, fx: "glow" },
    { label: "MEN", icon: <Shirt size={17} aria-hidden="true" />, fx: "wave" },
    { label: "WOMEN", icon: <Users size={17} aria-hidden="true" />, fx: "pop" },
    { label: "KIDS", icon: <Baby size={17} aria-hidden="true" />, fx: "drop" },
    { label: "SHOP", icon: <ShoppingBag size={17} aria-hidden="true" />, fx: "spin" },
    { label: "STORY", icon: <BookOpen size={17} aria-hidden="true" />, fx: "glow" },
    {
      label: "AI",
      icon: <BrainCircuit size={17} aria-hidden="true" />,
      fx: "glow",
      ariaExpanded: aiOpen,
      ariaControls: menuId,
    },
  ], [aiOpen, menuId]);

  // Route changes, clicking away, and Escape must never leave a floating menu.
  useEffect(() => { setAiOpen(false); }, [pathname, search]);
  useEffect(() => {
    if (!aiOpen) return;
    const onOutside = (event) => {
      if (!wrapRef.current?.contains(event.target)) setAiOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        setAiOpen(false);
        wrapRef.current?.querySelector('button[aria-label="AI"]')?.focus();
      }
    };
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [aiOpen]);

  return (
    <div className="gazu-ai-dropdown-anchor" ref={wrapRef}>
      <LiquidNavbar
        items={items}
        active={active}
        defaultActive={0}
        ariaLabel="GAZU primary navigation"
        onChange={(_, item) => {
          if (item.label === "AI") { setAiOpen((isOpen) => !isOpen); return; }
          setAiOpen(false);
          const destination = GAZU_LIQUID_LINKS.find((link) => link.label === item.label);
          if (!destination) return;
          if (destination.category == null) go(destination.destination);
          else go(destination.destination, destination.category);
        }}
        tone="light"
        sound={false}
        compact={false}
        className="gazu-liquid-navbar"
      />
      {aiOpen && (
        <div className="gazu-ai-dropdown-menu" id={menuId} role="group" aria-label="AI features">
          <div className="gazu-ai-dropdown-heading">GAZU AI STUDIO <ChevronDown size={13} aria-hidden="true" /></div>
          {links.map((entry) => (
            <button
              type="button"
              key={entry.route}
              className="gazu-ai-dropdown-item"
              aria-current={pathname === entry.route ? "page" : undefined}
              onClick={() => { setAiOpen(false); go(entry.destination); }}
            >
              {entry.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
