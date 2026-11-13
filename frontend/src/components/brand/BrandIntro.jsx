import React, { useEffect, useRef } from "react";
import AnimatedGazuLogo from "./AnimatedGazuLogo.jsx";
import { BRAND_INTRO_TIMING } from "./brandIntroTimings.js";
import { MOTION } from "../../animations/motionConfig.js";
export { BRAND_INTRO_TIMING } from "./brandIntroTimings.js";
import { markBrandIntroSeen } from "./brandIntroSession.js";
import "./BrandIntro.css";

// Deliberate choreography (~4.5s): white anticipation, 12 vector pieces,
// seamless complete-wordmark settlement, tagline reveal, brand hold, fade out.

const fragmentOffsets = [
  [-25, -16], [18, -2], [-18, 24], // G
  [0, -28], [-22, 16], [20, 17], // A
  [27, -3], [-24, 1], [23, 3], // Z
  [-19, -16], [19, -16], [0, 26], // U
];

export default function BrandIntro({ onComplete, onHeroReveal }) {
  const overlayRef = useRef(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onHeroRevealRef = useRef(onHeroReveal);
  const heroTriggeredRef = useRef(false);
  onCompleteRef.current = onComplete;
  onHeroRevealRef.current = onHeroReveal;

  useEffect(() => {
    let disposed = false;
    let context;
    let motionQuery;
    let onMotionChange;
    let watchdog;

    const beginHero = () => {
      if (disposed || heroTriggeredRef.current) return;
      heroTriggeredRef.current = true;
      onHeroRevealRef.current?.();
    };

    const finish = () => {
      if (disposed || completedRef.current) return;
      beginHero();
      completedRef.current = true;
      window.clearTimeout(watchdog);
      onCompleteRef.current?.();
    };

    try { markBrandIntroSeen(window.sessionStorage); } catch { /* blocked storage is optional */ }
    // Guard against a stalled dynamic import or an unexpected animation failure.
    watchdog = window.setTimeout(finish, 7500);

    async function start() {
      try {
        // No CDN and no GSAP work unless the intro actually needs to play.
        const { gsap } = await import("gsap");
        if (disposed || !overlayRef.current) return;
        motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
        if (motionQuery?.matches) { finish(); return; }

        context = gsap.context(() => {
          const node = overlayRef.current;
          const fragments = [...node.querySelectorAll(".gazu-brand-fragment")];
          const completeLogo = node.querySelector(".gazu-brand-complete");
          const tagline = node.querySelector(".gazu-brand-tagline");
          const logo = node.querySelector(".gazu-brand-artwork");
          if (fragments.length !== 12 || !completeLogo || !tagline || !logo) {
            finish();
            return;
          }

          gsap.set(fragments, { opacity: 0 });
          gsap.set(completeLogo, { opacity: 0 });
          gsap.set(tagline, { opacity: 0, y: 14 });

          const timeline = gsap.timeline({ onComplete: finish });
          fragments.forEach((fragment, index) => {
            const [x, y] = fragmentOffsets[index];
            timeline.fromTo(fragment,
              { x, y, opacity: 0 },
              { x: 0, y: 0, opacity: 1, duration: BRAND_INTRO_TIMING.fragmentDuration,
                ease: MOTION.ease },
              BRAND_INTRO_TIMING.fragmentsStart + index * BRAND_INTRO_TIMING.fragmentStagger,
            );
          });
          timeline
            .to(completeLogo, { opacity: 1, duration: MOTION.duration, ease: "none" }, BRAND_INTRO_TIMING.settleStart)
            .to(fragments, { opacity: 0, duration: MOTION.duration, ease: "none" }, BRAND_INTRO_TIMING.settleStart)
            .fromTo(logo, { scale: 1.02, transformOrigin: "50% 50%" },
              { scale: 1, duration: MOTION.duration, ease: MOTION.ease }, BRAND_INTRO_TIMING.settleStart)
            .to(tagline,
              { y: 0, opacity: 1, duration: MOTION.duration, ease: MOTION.ease },
              BRAND_INTRO_TIMING.taglineStart)
            .call(beginHero, [], BRAND_INTRO_TIMING.exitStart)
            .to(node,
              { autoAlpha: 0, duration: BRAND_INTRO_TIMING.exitDuration,
                ease: "power2.inOut" }, BRAND_INTRO_TIMING.exitStart);

          onMotionChange = (event) => { if (event.matches) finish(); };
          motionQuery?.addEventListener?.("change", onMotionChange);
        }, overlayRef);
      } catch {
        // A blocked or missing animation chunk must not block the storefront.
        finish();
      }
    }

    start();
    return () => {
      disposed = true;
      window.clearTimeout(watchdog);
      motionQuery?.removeEventListener?.("change", onMotionChange);
      context?.revert(); // Kill the timeline and reset every GSAP-applied style.
    };
  }, []);

  return (
    <div ref={overlayRef} className="gazu-brand-intro" data-testid="gazu-brand-intro">
      <AnimatedGazuLogo />
    </div>
  );
}
