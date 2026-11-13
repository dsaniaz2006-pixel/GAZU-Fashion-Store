import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { image } from "../../format.js";
import { MOTION } from "../../animations/motionConfig.js";
import { FASHION_CATEGORIES } from "./fashionCategories.js";
import "./FashionCategorySection.css";

gsap.registerPlugin(ScrollTrigger);

function FashionCategoryCard({ category }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <Link
      className="gazu-category-card"
      to={`/shop?category=${encodeURIComponent(category.category)}`}
      aria-label={`Explore ${category.category} collection`}
      onClick={() => { document.documentElement.scrollTop = 0; }}
    >
      {imageFailed ? (
        <span className="gazu-category-image gazu-category-fallback" role="img" aria-label={`${category.category} image unavailable`}>GAZU</span>
      ) : (
        <img
          className="gazu-category-image"
          src={image(category.photoId, 1100)}
          alt={`${category.category} fashion collection`}
          loading="lazy"
          decoding="async"
          width="600" height="800"
          style={{ objectPosition: category.objectPosition }}
          onError={() => setImageFailed(true)}
        />
      )}
      <span className="gazu-category-label">{category.name}</span>
    </Link>
  );
}

export default function FashionCategorySection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return undefined;

    // Only the entry motion uses GSAP. Grayscale and label transitions are
    // independent CSS hover/focus states, with no re-render on pointer move.
    const context = gsap.context(() => {
      const cards = gsap.utils.toArray(".gazu-category-card", section);
      gsap.fromTo(cards,
        { y: 20, opacity: 0 },
        {
          y: 0, opacity: 1,
          duration: MOTION.duration, stagger: MOTION.stagger, ease: MOTION.ease,
          scrollTrigger: { trigger: section, start: "top 80%", once: true },
        },
      );
    }, sectionRef);
    return () => context.revert();
  }, []);

  return (
    <section className="gazu-category-section" ref={sectionRef} aria-labelledby="gazu-category-heading" data-testid="gazu-fashion-categories">
      <h2 className="gazu-category-visually-hidden" id="gazu-category-heading">Shop by category</h2>
      <div className="gazu-category-grid">
        {FASHION_CATEGORIES.map((category) => (
          <FashionCategoryCard key={category.name} category={category} />
        ))}
      </div>
    </section>
  );
}
