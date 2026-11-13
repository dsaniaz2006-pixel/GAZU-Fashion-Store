import React from "react";
import { ArrowUpRight } from "lucide-react";
import "./interactive-hover-button.css";

/** GAZU adaptation of the interactive-hover-button demo, with the existing
 *  warm-grey/ink palette, accessible focus and native click semantics. */
export default function InteractiveHoverButton({
  children = "Explore collection",
  onClick,
  className = "",
  disabled = false,
  type = "button",
  ariaLabel,
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`gazu-interactive-hover ${className}`.trim()}
    >
      <span className="gazu-interactive-hover__wash" aria-hidden="true" />
      <span className="gazu-interactive-hover__text">{children}</span>
      <span className="gazu-interactive-hover__arrow" aria-hidden="true">
        <ArrowUpRight size={18} strokeWidth={1.6} />
      </span>
    </button>
  );
}

export { InteractiveHoverButton };
