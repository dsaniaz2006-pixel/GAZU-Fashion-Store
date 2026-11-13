import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { image } from "../../format.js";
import { MOTION } from "../../animations/motionConfig.js";
import "./DressLikeSection.css";

gsap.registerPlugin(ScrollTrigger);

// Reuse the EXISTING GAZU story-editorial photograph. The burgundy studio
// photograph visible in the NS Store video is not an approved GAZU asset.
export const DRESS_LIKE_IMAGE_ID = "photo-1539109136881-3be0616acf4b";

export default function DressLikeSection({ onExplore }) {
  const rootRef = useRef(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return undefined;

    const context = gsap.context(() => {
      const watermark = root.querySelector(".gazu-dress-watermark");
      const frame = root.querySelector(".gazu-dress-photo-clip");
      const photo = root.querySelector(".gazu-dress-photo");
      const heading = root.querySelector(".gazu-dress-heading-text");
      const supporting = root.querySelector(".gazu-dress-supporting");
      const button = root.querySelector(".gazu-dress-cta");
      if (![watermark, frame, photo, heading, supporting, button].every(Boolean)) return;

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: "top 80%", once: true },
      });
      tl.fromTo(watermark, { opacity: 0, x: -35 },
        { opacity: 1, x: 0, duration: MOTION.duration, ease: MOTION.ease }, 0);
      tl.fromTo(frame, { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: MOTION.duration, ease: MOTION.ease }, 0.1);
      tl.fromTo(photo, { scale: 1.06 },
        { scale: 1, duration: MOTION.duration, ease: MOTION.ease }, 0.1);
      tl.fromTo(heading, { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: MOTION.duration, ease: MOTION.ease }, 0.25);
      tl.fromTo(supporting, { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: MOTION.duration, ease: MOTION.ease }, 0.4);
      tl.fromTo(button, { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: MOTION.duration, ease: MOTION.ease }, 0.55);
    }, rootRef);
    return () => context.revert();
  }, []);

  return (
    <section ref={rootRef} className="gazu-dress-section" aria-labelledby="gazu-dress-title" data-testid="gazu-dress-like">
      <div className="gazu-dress-composition">
        <span className="gazu-dress-watermark" aria-hidden="true">S</span>
        <div className="gazu-dress-picture">
          <div className="gazu-dress-photo-clip">
            {imageFailed ? (
              <div className="gazu-dress-image-fallback" role="img" aria-label="GAZU editorial photograph unavailable">GAZU</div>
            ) : (
              <img className="gazu-dress-photo"
                src={image(DRESS_LIKE_IMAGE_ID, 1200)}
                alt="GAZU fashion editorial, contemporary street-style outfit"
                loading="lazy" decoding="async"
                width="850" height="1000"
                onError={() => setImageFailed(true)} />
            )}
          </div>
          <span className="gazu-dress-credit">GAZU EDITORIAL / NO. 02</span>
        </div>
        <div className="gazu-dress-content">
          <div className="gazu-dress-heading-mask">
            <h2 id="gazu-dress-title" className="gazu-dress-heading-text">DRESS LIKE</h2>
          </div>
          <div className="gazu-dress-supporting">
            <p className="gazu-dress-handle">@GAZU.STUDIO</p>
            <p className="gazu-dress-desc">Your own point of view. Considered pieces, worn your way.</p>
          </div>
          <button type="button" className="gazu-dress-cta" onClick={onExplore}>
            EXPLORE COLLECTION <ArrowUpRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
