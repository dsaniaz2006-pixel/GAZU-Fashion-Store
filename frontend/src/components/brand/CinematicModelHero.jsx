import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ArrowUpRight } from "lucide-react";
import { image } from "../../format.js";
import { CINEMATIC_HERO_TIMING, CINEMATIC_MODELS } from "./cinematicHeroConfig.js";
import { MOTION } from "../../animations/motionConfig.js";
import "./CinematicModelHero.css";

function ModelPhoto({ model }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <div className="cinematic-model-photo cinematic-model-image-fallback"
      role="img" aria-label={`${model.department} image unavailable`} />;
  }
  return <img
    className="cinematic-model-photo"
    src={model.src}
    alt={model.alt}
    loading="eager"
    decoding="async"
    fetchPriority="high"
    style={{ objectPosition: model.position }}
    onError={() => setFailed(true)}
  />;
}

// This section stays mounted as normal homepage content. Phase 1 calls reveal()
// from its existing GSAP timeline as the white overlay starts to disappear.
const CinematicModelHero = forwardRef(function CinematicModelHero(
  { awaitingIntro = false, onShop },
  ref,
) {
  const rootRef = useRef(null);
  const contextRef = useRef(null);
  const mountedRef = useRef(true);
  const startedRef = useRef(false);
  const [awaiting, setAwaiting] = useState(() => {
    if (!awaitingIntro) return false;
    try { return !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches; }
    catch { return true; }
  });
  const shouldAnimateRef = useRef(awaiting);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      contextRef.current?.revert();
      contextRef.current = null;
    };
  }, []);

  const reveal = useCallback(async () => {
    if (startedRef.current || !shouldAnimateRef.current) return;
    startedRef.current = true;
    try {
      // GSAP is shared with the Phase 1 intro via module loading; there is no
      // second animation library, interval, or manually timed transition.
      const { gsap } = await import("gsap");
      if (!mountedRef.current || !rootRef.current) return;
      contextRef.current = gsap.context(() => {
        const root = rootRef.current;
        const strip = root.querySelector(".cinematic-model-strip");
        const panels = gsap.utils.toArray(".cinematic-model-panel", root);
        const photos = gsap.utils.toArray(".cinematic-model-photo", root);
        const title = root.querySelector(".cinematic-model-title");
        const copy = root.querySelector(".cinematic-model-caption");
        const cta = root.querySelector(".cinematic-model-cta");
        const label = root.querySelector(".cinematic-model-topline");
        if (!strip || panels.length !== 3 || photos.length !== 3 || !title) {
          setAwaiting(false);
          return;
        }

        // One continuous bottom-up editorial image reveal sits behind the
        // existing individually staggered Women/Men/Kids panel choreography.
        // All masks share an edge and do not change the grid dimensions.
        const hiddenClip = "inset(100% 0% 0% 0%)";
        const revealedClip = "inset(0% 0% 0% 0%)";
        gsap.set(strip, { clipPath: hiddenClip, willChange: "clip-path" });
        gsap.set(panels, { clipPath: hiddenClip, willChange: "clip-path" });
        gsap.set(photos, { scale: 1.05, transformOrigin: "50% 50%" });
        gsap.set([title, copy, cta, label], { opacity: 0, y: 22 });

        const tl = gsap.timeline({
          onComplete: () => {
            if (!mountedRef.current) return;
            // Keep the fully open masks until React removes is-awaiting.
            // Clearing clipPath one frame earlier would briefly restore the
            // CSS hidden state and cause a white flash.
            gsap.set([strip, ...panels], { willChange: "auto" });
            shouldAnimateRef.current = false;
            setAwaiting(false);
          },
        });
        tl.fromTo(strip,
          { clipPath: hiddenClip },
          { clipPath: revealedClip, duration: MOTION.duration, ease: MOTION.ease },
          CINEMATIC_HERO_TIMING.firstRevealAt);
        panels.forEach((panel, index) => {
          const at = CINEMATIC_HERO_TIMING.firstRevealAt + index * CINEMATIC_HERO_TIMING.stagger;
          tl.fromTo(panel,
            { clipPath: hiddenClip },
            { clipPath: revealedClip, duration: CINEMATIC_HERO_TIMING.panelDuration,
              ease: MOTION.ease }, at);
          tl.to(photos[index], { scale: 1, duration: MOTION.duration, ease: MOTION.ease }, at);
        });
        tl.fromTo(title,
          { yPercent: 105, y: 0, opacity: 0 },
          { yPercent: 0, y: 0, opacity: 1, ease: MOTION.ease,
            duration: CINEMATIC_HERO_TIMING.titleDuration },
          CINEMATIC_HERO_TIMING.titleStart);
        tl.to(label, { opacity: 1, y: 0, duration: MOTION.duration, ease: MOTION.ease },
          CINEMATIC_HERO_TIMING.titleStart);
        tl.fromTo(copy, { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: MOTION.duration, ease: MOTION.ease },
          CINEMATIC_HERO_TIMING.captionStart);
        tl.fromTo(cta, { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: MOTION.duration, ease: MOTION.ease },
          CINEMATIC_HERO_TIMING.ctaStart);
      }, rootRef);
    } catch {
      // A failed GSAP chunk must not leave the hero hidden or block shopping.
      if (mountedRef.current) setAwaiting(false);
    }
  }, []);

  useImperativeHandle(ref, () => ({ reveal }), [reveal]);

  const media = CINEMATIC_MODELS.map((model) => ({
    ...model,
    src: model.department === "WOMEN" && import.meta.env.DEV
      ? model.referencePreview
      : image(model.photoId, 1700),
  }));

  return (
    <section
      ref={rootRef}
      className={`cinematic-model-hero${awaiting ? " is-awaiting" : ""}`}
      aria-label="GAZU Women, Men and Kids fashion campaign"
      data-testid="cinematic-three-model-hero"
    >
      <div className="cinematic-model-strip" aria-label="Women, Men, Kids fashion editorial photographs">
        {media.map((model) => (
          <div key={model.department} className={`cinematic-model-panel cinematic-${model.department.toLowerCase()}`}>
            <ModelPhoto model={model} />
          </div>
        ))}
      </div>
      <div className="cinematic-model-shading" aria-hidden="true" />
      <div className="cinematic-model-topline" aria-hidden="true">
        <span>GAZU / THE EDIT</span><span>EST. 2026</span>
      </div>
      <div className="cinematic-model-copy">
        <div className="cinematic-model-title-window">
          <h1 className="cinematic-model-title" aria-label="LOOKS YOU REMEMBER">LOOKS YOU<br />REMEMBER</h1>
        </div>
        <p className="cinematic-model-caption">Three perspectives. One point of view.</p>
        <button type="button" className="cinematic-model-cta" onClick={onShop}>
          Explore GAZU <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="cinematic-model-bottom" aria-hidden="true">
        <span>PERSONAL STYLE, UNCOMPROMISED.</span><span>WOMEN / MEN / KIDS</span>
      </div>
    </section>
  );
});

export default CinematicModelHero;
