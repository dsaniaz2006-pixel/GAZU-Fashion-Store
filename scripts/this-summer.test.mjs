import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SUMMER_GALLERY_ITEMS, SUMMER_SETS, SUMMER_DIRECTION,
  summerLoopGeometry, summerPixelsPerSecond } from "../frontend/src/components/summer/summerGalleryData.js";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const component = read("frontend/src/components/summer/SummerGallery.jsx");
const section = read("frontend/src/components/summer/ThisSummerSection.jsx");
const css = read("frontend/src/components/summer/SummerGallery.css");
const home = read("frontend/src/components/Home.jsx");

test("reference heading and CTA exist, and only one gallery replaces the old lookbook", () => {
  assert.match(section, /THIS SUMMER/);
  assert.match(section, /EXPLORE COLLECTION/);
  assert.equal((home.match(/<ThisSummerSection /g) || []).length, 1);
  assert.doesNotMatch(home, /ns-lookbook|THIS SEASON/);
  assert.match(section, /onClick=\{onExplore\}/);
});

test("gallery uses existing GAZU editorial sources with mixed departments and unique positions", () => {
  assert.equal(SUMMER_GALLERY_ITEMS.length, 8);
  assert.deepEqual(SUMMER_GALLERY_ITEMS.map(item => item.department),
    ["Women", "Men", "Women", "Kids", "Men", "Women", "Kids", "Men"]);
  assert.equal(new Set(SUMMER_GALLERY_ITEMS.map(item => item.id)).size, 8);
  for (const item of SUMMER_GALLERY_ITEMS) {
    assert.match(item.photoId, /^photo-[a-z0-9-]+$/);
    assert.match(item.position, /%/);
  }
});

test("loop mathematically wraps exactly one sequence to the right", () => {
  const width = 2048;
  const motion = summerLoopGeometry(width, 920);
  assert.equal(SUMMER_DIRECTION, "right");
  assert.equal(SUMMER_SETS, 3);
  assert.equal(motion.fromX, -width);
  assert.equal(motion.toX, 0);
  assert.equal(motion.duration * motion.pixelsPerSecond, width);
  assert.equal(summerLoopGeometry(0, 920), null);
  assert.ok(summerPixelsPerSecond(1440) > summerPixelsPerSecond(375));
});

test("GSAP performs a constant-speed track motion, not a carousel", () => {
  assert.match(component, /gsap\.fromTo\(track/);
  assert.match(component, /repeat: -1/);
  assert.match(component, /ease: "none"/);
  assert.match(component, /ResizeObserver/);
  assert.match(component, /IntersectionObserver/);
  assert.match(component, /prefers-reduced-motion/);
  assert.match(component, /context\.revert\(\)/);
  assert.doesNotMatch(component, /ScrollTrigger|setTimeout\(|Draggable|onDrag|carousel/);
});

test("three identical noninteractive sequences with a single accessible list", () => {
  assert.match(component, /SUMMER_SETS/);
  assert.match(component, /copyIndex === 1 \? "list"/);
  assert.match(component, /aria-hidden=\{copyIndex !== 1/);
  assert.match(component, /copyIndex.*item\.id/);
  assert.match(component, /loading=\{decorative \? "lazy" : "eager"\}/);
  assert.doesNotMatch(section, /Previous|Next|pagination|ArrowLeft|ArrowRight/);
});

test("layout matches unbroken white reference gallery and mobile/reduced motion", () => {
  assert.match(css, /background: #fff/);
  assert.match(css, /overflow: hidden/);
  assert.match(css, /aspect-ratio: 0\.76/);
  assert.match(css, /object-fit: cover/);
  assert.match(css, /touch-action: pan-y/);
  assert.match(css, /@media \(max-width: 600px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(css, /scroll-snap|box-shadow|pagination/);
});

test("Phase 1 and Phase 2 logo-to-model integration stays unchanged", () => {
  assert.match(home, /registerHeroReveal/);
  assert.match(home, /<CinematicModelHero/);
  assert.match(read("frontend/src/components/brand/BrandIntro.jsx"), /beginHero/);
});
