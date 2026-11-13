import React, { useId } from "react";
import {
  GAZU_LOGO_GLYPHS,
  GAZU_LOGO_VIEWBOX,
  fragmentRegions,
} from "./gazuLogoPaths.js";

// A true vector fragment assembly: each of the twelve paths is physically
// cropped to one region of an outlined glyph. The completed wordmark uses
// those exact same outlines, avoiding visible alignment jumps on settlement.
export default function AnimatedGazuLogo() {
  const unique = useId().replace(/:/g, "");

  return (
    <div className="gazu-brand-lockup" role="img" aria-label="GAZU. Looks you remember.">
      <svg
        className="gazu-brand-artwork"
        viewBox={GAZU_LOGO_VIEWBOX}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {GAZU_LOGO_GLYPHS.flatMap((glyph) =>
            fragmentRegions(glyph).map((rect, fragment) => (
              <clipPath
                key={`${glyph.letter}-${fragment}`}
                id={`${unique}-${glyph.letter}-${fragment}`}
                clipPathUnits="userSpaceOnUse"
              >
                <rect {...rect} />
              </clipPath>
            )),
          )}
        </defs>
        <g className="gazu-brand-fragments" fill="#111111">
          {GAZU_LOGO_GLYPHS.flatMap((glyph) =>
            fragmentRegions(glyph).map((_, fragment) => (
              <g
                key={`${glyph.letter}-${fragment}`}
                className="gazu-brand-fragment"
                data-letter={glyph.letter}
                data-piece={fragment}
                clipPath={`url(#${unique}-${glyph.letter}-${fragment})`}
              >
                <path d={glyph.path} />
              </g>
            )),
          )}
        </g>
        <g className="gazu-brand-complete" fill="#111111">
          {GAZU_LOGO_GLYPHS.map((glyph) => (
            <path key={glyph.letter} d={glyph.path} />
          ))}
        </g>
      </svg>
      <div className="gazu-brand-tagline-window" aria-hidden="true">
        <p className="gazu-brand-tagline">LOOKS YOU REMEMBER</p>
      </div>
    </div>
  );
}
