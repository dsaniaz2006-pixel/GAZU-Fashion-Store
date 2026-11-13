import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CINEMATIC_MODELS } from "../frontend/src/components/brand/cinematicHeroConfig.js";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const home = source("frontend/src/components/Home.jsx");
const hero = source("frontend/src/components/brand/CinematicModelHero.jsx");
const header = source("frontend/src/components/Header.jsx");
const layout = source("frontend/src/layouts/StorefrontLayout.jsx");

test("cinematic campaign contains exactly Women, Men and Kids in one hero", () => {
  assert.deepEqual(CINEMATIC_MODELS.map((x) => x.department), ["WOMEN", "MEN", "KIDS"]);
  assert.equal(new Set(CINEMATIC_MODELS.map((x) => x.photoId)).size, 3);
  assert.match(source("frontend/src/components/brand/CinematicModelHero.css"), /grid-template-columns:\s*40fr 33fr 27fr/);
});

test("hero is a single editorial composition with no slide cards", () => {
  assert.equal((home.match(/<CinematicModelHero/g) || []).length, 1);
  assert.doesNotMatch(home, /className="ns-hero"/);
  assert.match(hero, /cinematic-model-panel/);
  assert.match(hero, /LOOKS YOU<br\s*\/>REMEMBER/);
});

test("hero and overlay are connected by a single synchronous callback", () => {
  assert.match(home, /registerHeroReveal/);
  assert.match(layout, /onHeroReveal=\{beginHeroReveal\}/);
  assert.match(layout, /inert=\{introActive\}/);
});

test("existing GAZU header and collection navigation remain", () => {
  assert.match(header, /ns-editorial-wordmark/);
  for (const category of ["Men", "Women", "Kids"]) {
    assert.ok(header.includes(`go("shop", "${category}")`));
  }
});
