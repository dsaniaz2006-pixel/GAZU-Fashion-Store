import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  BRAND_INTRO_SESSION_KEY,
  markBrandIntroSeen,
  shouldPlayBrandIntro,
} from "../frontend/src/components/brand/brandIntroSession.js";
import {
  GAZU_LOGO_GLYPHS,
  fragmentRegions,
} from "../frontend/src/components/brand/gazuLogoPaths.js";

const files = [
  "../frontend/src/components/brand/AnimatedGazuLogo.jsx",
  "../frontend/src/components/brand/BrandIntro.jsx",
  "../frontend/src/components/brand/BrandIntro.css",
  "../frontend/src/layouts/StorefrontLayout.jsx",
];
const content = files.map((file) => readFileSync(new URL(file, import.meta.url), "utf8"));

test("vector artwork contains four unique glyph outlines and twelve separate clip regions", () => {
  assert.deepEqual(GAZU_LOGO_GLYPHS.map((glyph) => glyph.letter), ["G", "A", "Z", "U"]);
  const allPaths = new Set(GAZU_LOGO_GLYPHS.map((glyph) => glyph.path));
  assert.equal(allPaths.size, 4);
  for (const glyph of GAZU_LOGO_GLYPHS) {
    assert.match(glyph.path, /^M/);
    assert.ok(glyph.path.length > 150);
    const regions = fragmentRegions(glyph);
    assert.equal(regions.length, 3);
    assert.ok(regions.every(({ height, width }) => height > 0 && width > 0));
  }
  assert.match(content[0], /clipPathUnits="userSpaceOnUse"/);
  assert.match(content[0], /className="gazu-brand-fragment"/);
  assert.match(content[0], /className="gazu-brand-complete"/);
});

test("first homepage visit plays once and later navigation does not restart intro", () => {
  const entries = new Map();
  const storage = {
    getItem: (key) => entries.get(key),
    setItem: (key, value) => entries.set(key, value),
  };
  assert.equal(shouldPlayBrandIntro({ pathname: "/", storage }), true);
  assert.equal(markBrandIntroSeen(storage), true);
  assert.equal(entries.get(BRAND_INTRO_SESSION_KEY), "1");
  assert.equal(shouldPlayBrandIntro({ pathname: "/", storage }), false);
  assert.equal(shouldPlayBrandIntro({ pathname: "/product/123", storage }), false);
  assert.equal(shouldPlayBrandIntro({ pathname: "/cart", storage }), false);
  assert.equal(shouldPlayBrandIntro({ pathname: "/", storage, forceReplay: true }), true);
});

test("reduced motion and unavailable storage never block storefront access", () => {
  const storage = { getItem() { throw Error("privacy"); }, setItem() { throw Error("privacy"); } };
  assert.equal(shouldPlayBrandIntro({ pathname: "/", storage, reducedMotion: true }), false);
  assert.equal(shouldPlayBrandIntro({ pathname: "/", storage }), false);
  assert.equal(markBrandIntroSeen(storage), false);
  assert.equal(shouldPlayBrandIntro({ pathname: "/", storage: null }), false);
});

test("React shell disables page interaction until logo animation finishes", () => {
  assert.match(content[1], /import\("gsap"\)/);
  assert.match(content[1], /gsap\.context\(/);
  assert.match(content[1], /context\?\.revert\(\)/);
  assert.match(content[0], /gazu-brand-tagline/);
  assert.match(content[3], /inert=\{introActive\}/);
  assert.match(content[3], /aria-hidden=\{introActive/);
  assert.match(content[2], /background:\s*#ffffff/);
});
