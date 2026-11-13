import React, { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MOTION } from "../../animations/motionConfig.js";
import SummerGallery from "./SummerGallery.jsx";

gsap.registerPlugin(ScrollTrigger);

export default function ThisSummerSection({ onExplore }) {
  const sectionRef = useRef(null);
  useEffect(() => {
    if (!sectionRef.current || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return undefined;
    const context = gsap.context(() => {
      const heading = sectionRef.current.querySelector("h2");
      const gallery = sectionRef.current.querySelector(".gazu-summer-viewport");
      const cta = sectionRef.current.querySelector(".gazu-summer-cta");
      if (!heading || !gallery || !cta) return;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sectionRef.current, start: "top 82%", once: true },
      });
      tl.fromTo(heading, { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: MOTION.duration, ease: MOTION.ease }, 0);
      // Reveal the viewport, not the moving track: never disturb loop geometry.
      tl.fromTo(gallery, { opacity: 0, clipPath: "inset(0% 0% 100% 0%)" },
        { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: MOTION.duration, ease: MOTION.ease }, 0.1);
      tl.fromTo(cta, { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: MOTION.duration, ease: MOTION.ease }, 0.35);
    }, sectionRef);
    return () => context.revert();
  }, []);

  return (
    <section className="gazu-summer-section" ref={sectionRef} aria-labelledby="gazu-summer-title">
      <h2 id="gazu-summer-title">THIS SUMMER</h2>
      <SummerGallery />
      <button type="button" className="gazu-summer-cta" onClick={onExplore}>
        EXPLORE COLLECTION <ArrowUpRight size={13} aria-hidden="true" />
      </button>
    </section>
  );
}
