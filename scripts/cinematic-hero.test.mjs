import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { CINEMATIC_MODELS, CINEMATIC_HERO_TIMING } from "../frontend/src/components/brand/cinematicHeroConfig.js";
import { BRAND_INTRO_SESSION_KEY, shouldPlayBrandIntro, markBrandIntroSeen } from "../frontend/src/components/brand/brandIntroSession.js";
import { BRAND_INTRO_TIMING } from "../frontend/src/components/brand/brandIntroTimings.js";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const hero = read("frontend/src/components/brand/CinematicModelHero.jsx");
const css = read("frontend/src/components/brand/CinematicModelHero.css");
const intro = read("frontend/src/components/brand/BrandIntro.jsx");
const home = read("frontend/src/components/Home.jsx");
const layout = read("frontend/src/layouts/StorefrontLayout.jsx");

test("exactly three source models in the requested order", () => {
  assert.deepEqual(CINEMATIC_MODELS.map(({department}) => department), ["WOMEN", "MEN", "KIDS"]);
  assert.equal(new Set(CINEMATIC_MODELS.map(({photoId}) => photoId)).size, 3);
});

test("men and kids reuse the existing unsplash hero photographs unchanged", () => {
  assert.equal(CINEMATIC_MODELS[1].photoId, "photo-1487222477894-8943e31ef7b2");
  assert.equal(CINEMATIC_MODELS[2].photoId, "photo-1519238263530-99bdd11df2ea");
});

test("woman reference still is present, cropped, and used only during development", () => {
  const img = new URL("../frontend/public/editorial/woman-reference-preview-only.webp", import.meta.url);
  assert.ok(statSync(img).size > 10000);
  const header = readFileSync(img).subarray(0, 12);
  assert.equal(header.toString("ascii", 0, 4), "RIFF");
  assert.equal(header.toString("ascii", 8, 12), "WEBP");
  assert.match(hero, /import\.meta\.env\.DEV/);
  assert.match(hero, /referencePreview/);
});

test("hero combines the photos into a gapless 40/33/27 grid with object-fit cover", () => {
  assert.match(css, /grid-template-columns:\s*40fr 33fr 27fr/);
  assert.match(css, /object-fit:\s*cover/);
  assert.match(css, /@media \(max-width:\s*600px\)/);
  assert.doesNotMatch(css, /column-gap:/);
});

test("phase 1 timeline starts phase 2 at its white-overlay exit with no timer", () => {
  assert.match(intro, /\.call\(beginHero, \[\], BRAND_INTRO_TIMING\.exitStart\)/);
  assert.match(layout, /onHeroReveal=\{beginHeroReveal\}/);
  assert.match(home, /registerHeroReveal/);
  assert.doesNotMatch(hero, /setTimeout\(/);
  assert.equal(typeof BRAND_INTRO_TIMING.exitStart, "number");
});

test("bottom-up hero reveals in a 120ms stagger with exact 0.7-second masks", () => {
  assert.equal(CINEMATIC_HERO_TIMING.stagger, 0.12);
  assert.equal(CINEMATIC_HERO_TIMING.panelDuration, 0.7);
  assert.match(hero, /const hiddenClip = "inset\(100% 0% 0% 0%\)"/);
  assert.match(hero, /const revealedClip = "inset\(0% 0% 0% 0%\)"/);
  assert.match(hero, /tl\.fromTo\(strip/);
  assert.match(hero, /tl\.fromTo\(panel/);
  assert.match(hero, /ease: MOTION\.ease/);
  assert.match(hero, /gsap\.context\(/);
  assert.match(hero, /contextRef\.current\?\.revert\(\)/);
});

test("title follows model entrance and remains part of the mounted homepage", () => {
  assert.ok(CINEMATIC_HERO_TIMING.titleStart > CINEMATIC_HERO_TIMING.stagger * 2);
  assert.match(hero, /LOOKS YOU<br\s*\/>REMEMBER/);
  assert.match(hero, /\.fromTo\(title/);
  assert.equal((home.match(/<CinematicModelHero/g) || []).length, 1);
});

test("subsequent navigation in same session skips introduction", () => {
  const map = new Map();
  const storage = { getItem: (k) => map.get(k), setItem: (k,v) => map.set(k,v) };
  assert.equal(shouldPlayBrandIntro({pathname:"/", storage}), true);
  assert.equal(markBrandIntroSeen(storage), true);
  assert.equal(map.get(BRAND_INTRO_SESSION_KEY), "1");
  assert.equal(shouldPlayBrandIntro({pathname:"/", storage}), false);
  assert.equal(shouldPlayBrandIntro({pathname:"/shop", storage}), false);
});

test("reduced motion bypasses the intro, and hero has an explicit no-motion style", () => {
  assert.equal(shouldPlayBrandIntro({pathname:"/", storage: {}, reducedMotion:true}), false);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(hero, /setAwaiting\(false\)/);
});
