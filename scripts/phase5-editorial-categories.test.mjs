import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FASHION_CATEGORIES } from "../frontend/src/components/categories/fashionCategories.js";
import { MOTION } from "../frontend/src/animations/motionConfig.js";
import { CINEMATIC_HERO_TIMING } from "../frontend/src/components/brand/cinematicHeroConfig.js";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const homepage = read("frontend/src/components/Home.jsx");
const hero = read("frontend/src/components/brand/CinematicModelHero.jsx");
const heroCss = read("frontend/src/components/brand/CinematicModelHero.css");
const intro = read("frontend/src/components/brand/BrandIntro.jsx");
const categories = read("frontend/src/components/categories/FashionCategorySection.jsx");
const css = read("frontend/src/components/categories/FashionCategorySection.css");
const shop = read("frontend/src/pages/Shop.jsx");

const legacyIds = [
  "photo-1483985988355-763728e1935b",
  "photo-1506794778202-cad84cf45f1d",
  "photo-1519238263530-99bdd11df2ea",
];

test("category data contains exactly the 3 existing GAZU images in Women/Men/Kids order", () => {
  assert.deepEqual(FASHION_CATEGORIES.map(item => item.name), ["WOMEN", "MEN", "KIDS"]);
  assert.deepEqual(FASHION_CATEGORIES.map(item => item.photoId), legacyIds);
  assert.equal(new Set(FASHION_CATEGORIES.map(item => item.category)).size, 3);
});

test("the existing homepage uses one hero, one Summer, one Dress Like and one category section in order", () => {
  assert.equal((homepage.match(/<CinematicModelHero\b/g) || []).length, 1);
  assert.equal((homepage.match(/<ThisSummerSection\b/g) || []).length, 1);
  assert.equal((homepage.match(/<DressLikeSection\b/g) || []).length, 1);
  assert.equal((homepage.match(/<FashionCategorySection\b/g) || []).length, 1);
  const tags = ["<CinematicModelHero", "<ThisSummerSection", "<DressLikeSection", "<FashionCategorySection"];
  assert.ok(tags.every((tag, index) => index === 0 || homepage.indexOf(tags[index - 1]) < homepage.indexOf(tag)));
  assert.doesNotMatch(homepage, /ns-departments|ns-department-grid|\bdepartments\.map\(/);
});

test("category links use existing /shop?category= routes, not nested buttons or JS-only navigation", () => {
  assert.match(categories, /import \{ Link \} from "react-router-dom"/);
  assert.match(categories, /to=\{`\/shop\?category=\$\{encodeURIComponent\(category\.category\)\}`\}/);
  assert.match(shop, /category/);
  assert.doesNotMatch(categories, /<button/);
  assert.match(categories, /aria-label=\{`Explore \$\{category\.category\} collection`\}/);
  assert.match(categories, /onClick=\{\(\) =>/);
});

test("three portrait links use independent grayscale and white labels on hover/focus", () => {
  assert.match(categories, /className="gazu-category-card"/);
  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /aspect-ratio: 3 \/ 4/);
  assert.match(css, /border-radius: 5px/);
  assert.match(css, /\.gazu-category-card:hover \.gazu-category-image \{ filter: grayscale\(100%\)/);
  assert.match(css, /\.gazu-category-card:hover \.gazu-category-label/);
  assert.match(css, /\.gazu-category-card:focus-visible \.gazu-category-image/);
  assert.match(css, /background-color: #fff; color: #111/);
  assert.doesNotMatch(css, /\.gazu-category-grid:hover \.gazu-category-image/);
});

test("all discrete hover, label and entrance tweens are 0.7s; gallery remains unaltered", () => {
  assert.equal(MOTION.duration, 0.7);
  assert.equal(MOTION.stagger, 0.12);
  assert.match(categories, /duration: MOTION\.duration, stagger: MOTION\.stagger/);
  assert.match(css, /transition: filter \.7s ease/);
  assert.match(css, /transition: background-color \.7s ease, color \.7s ease, border-color \.7s ease/);
  assert.equal(CINEMATIC_HERO_TIMING.panelDuration, 0.7);
  assert.equal(CINEMATIC_HERO_TIMING.stagger, 0.12);
});

test("hero retains three models and adds bottom-up editorial strip mask without layout motion", () => {
  assert.match(hero, /const hiddenClip = "inset\(100% 0% 0% 0%\)"/);
  assert.match(hero, /tl\.fromTo\(strip/);
  assert.match(hero, /panels\.forEach\(/);
  assert.match(hero, /scale: 1\.05/);
  assert.match(hero, /tl\.fromTo\(title/);
  assert.match(hero, /tl\.fromTo\(cta/);
  assert.match(hero, /LOOKS YOU<br\s*\/>REMEMBER/);
  assert.match(heroCss, /grid-template-columns: 40fr 33fr 27fr/);
  assert.match(heroCss, /background: #fff/);
  assert.doesNotMatch(hero, /setTimeout\(/);
  assert.match(intro, /\.call\(beginHero, \[\], BRAND_INTRO_TIMING\.exitStart\)/);
});

test("mobile keeps full-size tappable cards; reduced motion disables effects", () => {
  assert.match(css, /@media \(max-width: 600px\)/);
  assert.match(css, /grid-template-columns: 1fr/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(categories, /prefers-reduced-motion: reduce/);
  assert.match(categories, /once: true/);
  assert.match(categories, /context\.revert\(\)/);
});
