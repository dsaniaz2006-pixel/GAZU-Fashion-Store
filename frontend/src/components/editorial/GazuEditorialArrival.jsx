import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CINEMATIC_MODELS } from "../brand/cinematicHeroConfig.js";
import { image } from "../../format.js";
import { MOTION } from "../../animations/motionConfig.js";
import "./GazuEditorialArrival.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * The small-page counterpart of the existing CinematicModelHero.
 * The same three original GAZU editorial photos, reveal timing, serif typography,
 * and reduced-motion approach are reused on the new collection pages.
 * The first-visit intro/logo remains homepage-only.
 */
export default function GazuEditorialArrival({ kicker = "GAZU STUDIO / THE EDIT", title, description, actionLabel, onAction }) {
  const root = useRef(null);
  const [failed, setFailed] = useState([]);
  useEffect(() => {
    const element = root.current;
    if (!element || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return undefined;
    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray(".gazu-arrival-panel", element);
      const photos = gsap.utils.toArray(".gazu-arrival-photo", element);
      const copy = element.querySelector(".gazu-arrival-copy");
      // ScrollTrigger starts with the page visible, and never blocks a click or
      // leaves the page hidden if an image/network request fails.
      const timeline = gsap.timeline({ scrollTrigger: { trigger: element, start: "top 88%", once: true } });
      timeline.fromTo(panels, { clipPath: "inset(100% 0 0 0)" }, {
        clipPath: "inset(0% 0 0 0)", duration: MOTION.duration, stagger: MOTION.stagger,
        ease: MOTION.ease, clearProps: "clipPath",
      }, 0);
      timeline.fromTo(photos, { scale: 1.07 }, { scale: 1, duration: MOTION.duration, stagger: MOTION.stagger, ease: MOTION.ease, clearProps: "transform" }, 0);
      timeline.fromTo(copy, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: MOTION.duration, ease: MOTION.ease, clearProps: "all" }, .2);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="gazu-arrival" aria-label={`${title} editorial introduction`} data-testid="gazu-editorial-arrival">
      <div className="gazu-arrival-strip" aria-hidden="true">
        {CINEMATIC_MODELS.map((model, index) => (
          <div className={`gazu-arrival-panel gazu-arrival-${model.department.toLowerCase()}`} key={model.department}>
            {failed.includes(index) ? <span className="gazu-arrival-image-fallback">GAZU</span> : (
              <img className="gazu-arrival-photo" src={image(model.photoId, 900)} alt=""
                loading={index === 0 ? "eager" : "lazy"} decoding="async"
                style={{ objectPosition: model.position }}
                onError={() => setFailed(list => [...list, index])} />
            )}
          </div>
        ))}
      </div>
      <div className="gazu-arrival-shade" aria-hidden="true" />
      <div className="gazu-arrival-copy">
        <p className="gazu-arrival-kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="gazu-arrival-description">{description}</p>
        {actionLabel && onAction && <button className="gazu-arrival-cta" type="button" onClick={onAction}>{actionLabel} <ArrowUpRight size={16} aria-hidden="true" /></button>}
      </div>
      <div className="gazu-arrival-bottom" aria-hidden="true"><span>PERSONAL STYLE, UNCOMPROMISED.</span><span>WOMEN / MEN / KIDS</span></div>
    </section>
  );
}
