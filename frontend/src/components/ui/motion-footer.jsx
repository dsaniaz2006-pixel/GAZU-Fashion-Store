import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MOTION } from "../../animations/motionConfig.js";
import InteractiveHoverButton from "./interactive-hover-button.jsx";
import "./motion-footer.css";

gsap.registerPlugin(ScrollTrigger);

/** Motion Footer-inspired GAZU editorial curtain. No pinned scrolling, no
 *  duplicate footer, and no other site's artwork or unrelated navigation. */
export default function MotionFooter({ onExplore, children }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return undefined;

    const context = gsap.context(() => {
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: "top 88%", once: true },
      });
      tl.fromTo(q(".gazu-motion-footer__eyebrow"),
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: MOTION.duration, ease: MOTION.ease }, 0);
      tl.fromTo(q(".gazu-motion-footer__headline"),
        { yPercent: 105, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: MOTION.duration, ease: MOTION.ease }, .12);
      tl.fromTo(q(".gazu-motion-footer__subline"),
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: MOTION.duration, ease: MOTION.ease }, .25);
      tl.fromTo(q(".gazu-motion-footer__cta"),
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: MOTION.duration, ease: MOTION.ease }, .36);
      gsap.fromTo(q(".gazu-motion-footer__marquee-track"),
        { xPercent: -7 },
        { xPercent: 7, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true } });
      tl.fromTo(q(".gazu-motion-footer__large-word"),
        { yPercent: 100, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: MOTION.duration, ease: MOTION.ease }, .48);
    }, rootRef);
    return () => context.revert();
  }, []);

  return (
    <footer ref={rootRef} className="footer gazu-motion-footer" aria-label="GAZU footer">
      <div className="gazu-motion-footer__editorial" aria-labelledby="gazu-footer-title">
        <div className="gazu-motion-footer__grid" aria-hidden="true" />
        <p className="gazu-motion-footer__eyebrow">GAZU STUDIO <span aria-hidden="true">✳</span> THE EVERYDAY EDIT</p>
        <div className="gazu-motion-footer__headline-clip">
          <h2 className="gazu-motion-footer__headline" id="gazu-footer-title">GOOD STYLE.<br /><em>EVERY DAY.</em></h2>
        </div>
        <p className="gazu-motion-footer__subline">A considered wardrobe, made to move with you.</p>
        <div className="gazu-motion-footer__cta">
          <InteractiveHoverButton onClick={onExplore}>Explore collection</InteractiveHoverButton>
        </div>
        <div className="gazu-motion-footer__marquee" aria-hidden="true">
          <div className="gazu-motion-footer__marquee-track">
            IN / OUT / EVERYDAY&nbsp;&nbsp; ✳ &nbsp;&nbsp;CONSIDERED STYLE&nbsp;&nbsp; ✳ &nbsp;&nbsp;MADE TO LAST&nbsp;&nbsp; ✳ &nbsp;&nbsp;IN / OUT / EVERYDAY&nbsp;&nbsp; ✳ &nbsp;&nbsp;CONSIDERED STYLE
          </div>
        </div>
        <div className="gazu-motion-footer__large-clip" aria-hidden="true">
          <span className="gazu-motion-footer__large-word">GAZU</span>
        </div>
      </div>
      {children}
    </footer>
  );
}

export { MotionFooter };
