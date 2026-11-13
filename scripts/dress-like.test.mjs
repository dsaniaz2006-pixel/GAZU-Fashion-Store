import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MOTION } from "../frontend/src/animations/motionConfig.js";
import { BRAND_INTRO_TIMING } from "../frontend/src/components/brand/brandIntroTimings.js";
import { CINEMATIC_HERO_TIMING } from "../frontend/src/components/brand/cinematicHeroConfig.js";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const home = read("frontend/src/components/Home.jsx");
const dress = read("frontend/src/components/dress-like/DressLikeSection.jsx");
const css = read("frontend/src/components/dress-like/DressLikeSection.css");
const summer = read("frontend/src/components/summer/ThisSummerSection.jsx");
const summerCss = read("frontend/src/components/summer/SummerGallery.css");
const brand = read("frontend/src/components/brand/BrandIntro.jsx");
const hero = read("frontend/src/components/brand/CinematicModelHero.jsx");
const loop = read("frontend/src/components/summer/SummerGallery.jsx");

test("shared motion contract fixes all discrete animation durations at 0.7 seconds", () => {
  assert.equal(MOTION.duration, .7);
  assert.equal(MOTION.ease, "power3.out");
  assert.equal(MOTION.stagger, .12);
  assert.equal(BRAND_INTRO_TIMING.fragmentDuration, MOTION.duration);
  assert.equal(BRAND_INTRO_TIMING.exitDuration, MOTION.duration);
  assert.equal(CINEMATIC_HERO_TIMING.panelDuration, MOTION.duration);
  assert.equal(CINEMATIC_HERO_TIMING.titleDuration, MOTION.duration);
});

test("phase 1 uses 0.7 for 12 fragment movements, cross-fade, settle, tagline and overlay exit", () => {
  assert.match(brand, /fragmentOffsets/);
  assert.match(brand, /duration: BRAND_INTRO_TIMING.fragmentDuration/);
  assert.equal((brand.match(/duration: MOTION.duration/g) || []).length, 4);
  assert.match(brand, /duration: BRAND_INTRO_TIMING.exitDuration/);
  assert.doesNotMatch(brand, /duration: 0\.(?:14|4|5|65|68)/);
});

test("phase 2 retains the merged Women/Men/Kids hero and standardizes all tweens", () => {
  assert.match(hero, /const hiddenClip = "inset\(100% 0% 0% 0%\)"/);
  assert.match(hero, /CINEMATIC_HERO_TIMING.panelDuration/);
  assert.match(hero, /CINEMATIC_HERO_TIMING.titleDuration/);
  assert.match(hero, /duration: MOTION.duration/);
  assert.doesNotMatch(hero, /duration: (?:1\.25|0\.45)/);
});

test("phase 3 gets only 0.7-second discrete entrances and preserves the continuous track speed", () => {
  assert.match(summer, /ScrollTrigger/);
  assert.match(summer, /once: true/);
  assert.equal((summer.match(/duration: MOTION.duration/g) || []).length, 3);
  assert.match(summerCss, /background-color \.7s ease, color \.7s ease/);
  assert.match(loop, /duration: geometry.duration/);
  assert.match(loop, /repeat: -1/);
  assert.match(loop, /ease: "none"/);
});

test("phase 4 replaces only previous static story and leaves prior page sequence intact", () => {
  assert.equal((home.match(/<DressLikeSection/g) || []).length, 1);
  assert.match(home, /<ThisSummerSection[^>]*>/);
  assert.ok(home.indexOf("<ThisSummerSection") < home.indexOf("<DressLikeSection"));
  assert.doesNotMatch(home, /className="ns-story"/);
  assert.match(home, /<CinematicModelHero/);
  assert.match(home, /<DressLikeSection onExplore=\{\(\) => openCollection\("All"\)\} \/>/);
});

test("phase 4 implements six masked/settling entrances of exactly 0.7 seconds", () => {
  assert.equal((dress.match(/duration: MOTION.duration/g) || []).length, 6);
  assert.match(dress, /clipPath: "inset\(100% 0% 0% 0%\)"/);
  assert.match(dress, /scale: 1\.06/);
  assert.match(dress, /gazu-dress-heading-mask/);
  assert.match(dress, /gsap.context/);
  assert.match(dress, /context.revert\(\)/);
  assert.match(dress, /scrollTrigger: \{ trigger: root, start: "top 80%", once: true \}/);
  assert.match(dress, /prefers-reduced-motion/);
});

test("editorial styling follows white asymmetric photo-left, heading-right reference with responsive layout", () => {
  assert.match(css, /background: #fff/);
  assert.match(css, /grid-template-columns: minmax\(0, 52%\) minmax\(0, 48%\)/);
  assert.match(css, /aspect-ratio: 0\.85/);
  assert.match(css, /background: #72172e/);
  assert.match(css, /overflow: hidden/);
  assert.match(css, /object-fit: cover/);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /\.7s ease/);
});

test("feature reuses existing editorial photo, accessible title, and real collection navigation", () => {
  assert.match(dress, /photo-1539109136881-3be0616acf4b/);
  assert.match(dress, /DRESS LIKE/);
  assert.match(dress, /@GAZU.STUDIO/);
  assert.match(dress, /onClick=\{onExplore\}/);
  assert.match(dress, /onError=\{\(\) => setImageFailed\(true\)\}/);
  assert.match(dress, /alt="GAZU fashion editorial/);
  assert.match(dress, /aria-hidden="true"/);
});
