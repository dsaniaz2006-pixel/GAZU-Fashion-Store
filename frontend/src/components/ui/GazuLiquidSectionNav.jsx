import React, { useMemo } from "react";
import { LiquidNavbar } from "./liquid-glass-navbar";

/** Route-aware, accessible Nimbus Waterline for in-page navigation.
 * Each pill shares the same visual system as the two header navbars, while
 * remaining controlled by the URL (not transient click state).
 * Overflow belongs to the wrapper so small screens may scroll horizontally.
 */
export default function GazuLiquidSectionNav({
  label,
  items,
  active,
  onSelect,
  className = "",
  compact = false,
}) {
  const navItems = useMemo(() => items.map((item) => ({
    label: item.label,
    icon: item.icon,
    fx: item.fx || "wave",
    disabled: Boolean(item.disabled),
  })), [items]);
  return (
    <div className={`gazu-section-liquid-scroll ${className}`.trim()}>
      <LiquidNavbar
        ariaLabel={label}
        className="gazu-section-liquid"
        tone="light"
        sound={false}
        compact={compact}
        items={navItems}
        active={active}
        onChange={(index) => {
          if (!items[index]?.disabled) onSelect(index, items[index]);
        }}
      />
    </div>
  );
}
