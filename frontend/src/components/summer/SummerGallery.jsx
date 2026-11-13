import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { image } from "../../format.js";
import { SUMMER_GALLERY_ITEMS, SUMMER_SETS, summerLoopGeometry } from "./summerGalleryData.js";
import "./SummerGallery.css";

function SummerPhoto({ item, decorative }) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="gazu-summer-frame" role={decorative ? undefined : "listitem"}
      style={{ "--summer-tilt": item.tilt }}>
      {failed ? (
        <div className="gazu-summer-photo-fallback" role={decorative ? undefined : "img"}
          aria-label={decorative ? undefined : `${item.department} editorial photograph unavailable`}>
          <span>GAZU</span>
        </div>
      ) : (
        <img src={image(item.photoId, 900)}
          alt={decorative ? "" : `${item.department} fashion editorial photograph`}
          loading={decorative ? "lazy" : "eager"}
          decoding="async" draggable="false"
          style={{ objectPosition: item.position }}
          onError={() => setFailed(true)} />
      )}
    </figure>
  );
}

export default function SummerGallery() {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const firstSetRef = useRef(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const set = firstSetRef.current;
    if (!viewport || !track || !set) return undefined;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let visible = typeof IntersectionObserver === "undefined";
    let loop = null;
    let observer = null;
    let resizeObserver = null;

    const buildLoop = () => {
      const geometry = summerLoopGeometry(set.getBoundingClientRect().width, window.innerWidth);
      if (!geometry) return;
      loop?.kill();
      loop = null;
      if (reduced?.matches) {
        gsap.set(track, { x: geometry.fromX, clearProps: "willChange" });
        return;
      }
      loop = gsap.fromTo(track,
        { x: geometry.fromX },
        { x: geometry.toX, duration: geometry.duration, ease: "none", repeat: -1,
          paused: !visible || document.hidden, force3D: true },
      );
    };

    const context = gsap.context(() => { buildLoop(); }, viewport);
    // No scroll-jacking: the reference shows an automatically rolling row while
    // the normal page remains vertically scrollable. Pause it when not in view.
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible && !document.hidden && !reduced?.matches) loop?.play();
        else loop?.pause();
      }, { threshold: 0.02 });
      observer.observe(viewport);
    }
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(buildLoop);
      resizeObserver.observe(set);
    }
    const onResize = () => buildLoop();
    const onVisibility = () => {
      if (!document.hidden && visible && !reduced?.matches) loop?.play();
      else loop?.pause();
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    reduced?.addEventListener?.("change", buildLoop);

    return () => {
      observer?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      reduced?.removeEventListener?.("change", buildLoop);
      loop?.kill();
      context.revert();
    };
  }, []);

  return (
    <div className="gazu-summer-viewport" ref={viewportRef}
      aria-label="GAZU summer fashion editorial gallery"
      data-testid="gazu-summer-gallery">
      <div className="gazu-summer-track" ref={trackRef}>
        {Array.from({ length: SUMMER_SETS }, (_, copyIndex) => (
          <div className="gazu-summer-sequence" ref={copyIndex === 0 ? firstSetRef : undefined}
            role={copyIndex === 1 ? "list" : undefined}
            aria-hidden={copyIndex !== 1 ? "true" : undefined}
            key={`summer-sequence-${copyIndex}`}>
            {SUMMER_GALLERY_ITEMS.map((item) => (
              <SummerPhoto key={`${copyIndex}-${item.id}`} item={item} decorative={copyIndex !== 1} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
