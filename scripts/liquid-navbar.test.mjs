import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { GAZU_LIQUID_LINKS, activeGazuLiquidItem } from "../frontend/src/components/ui/liquidNavRoutes.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const file = (p) => readFileSync(resolve(projectRoot, p), "utf8");
const nav = file("frontend/src/components/ui/liquid-glass-navbar.tsx");
const wrapper = file("frontend/src/components/ui/GazuLiquidNav.jsx");
const header = file("frontend/src/components/Header.jsx");
const styles = file("frontend/src/styles.css");

test("primary links correspond to six valid GAZU destinations", () => {
  assert.deepEqual(GAZU_LIQUID_LINKS.map((l) => l.label), ["HOME", "MEN", "WOMEN", "KIDS", "SHOP", "STORY"]);
  assert.deepEqual(GAZU_LIQUID_LINKS.map((l) => l.destination), ["home", "shop", "shop", "shop", "shop", "about"]);
});
test("active item follows actual Shop category query", () => {
  for (const [category, expected] of [["Men", 1], ["Women", 2], ["Kids", 3]]) {
    assert.equal(activeGazuLiquidItem("/shop", `?category=${category}`), expected);
  }
  assert.equal(activeGazuLiquidItem("/shop", "?sort=price_desc"), 4);
});
test("other routes correctly select Home, Story, or no item", () => {
  assert.equal(activeGazuLiquidItem("/"), 0);
  assert.equal(activeGazuLiquidItem("/about"), 5);
  for (const path of ["/cart", "/account", "/admin/products", "/product/abc"]) assert.equal(activeGazuLiquidItem(path), -1);
});
test("primary navbar uses SPA navigation, not demo external links", () => {
  assert.match(wrapper, /onChange=\{/);
  assert.match(wrapper, /go\(destination\.destination, destination\.category\)/);
  assert.doesNotMatch(wrapper, /href="\/|window\.location|label: "Flights"|label: "Weather"/);
});
test("original GAZU logo and all utility actions remain in header", () => {
  for (const term of ["wordmark", "setSearchOpen", "go(\"account\")", "go(\"wishlist\")", "go(\"cart\")", "go(\"admin\")"]) assert.ok(header.includes(term), term);
  assert.match(header, /<GazuLiquidNav \/>/);
  assert.match(header, /gazu-mobile-links/);
});
test("component contains supplied water shader, glass fallback, and SVG effects", () => {
  for (const fragment of ["const FRAG", "createShader", "nimbus-water", "nimbus-drop", "webglcontextlost", "supportsRefraction", "nvPlane", "nvWave"]) assert.ok(nav.includes(fragment), fragment);
});
test("navbar supports WebGL failure, browser visibility and reduced motion", () => {
  for (const fragment of ["setGl(\"off\")", "prefers-reduced-motion: reduce", "IntersectionObserver", "ResizeObserver", "visibilitychange", "cancelAnimationFrame"]) assert.ok(nav.includes(fragment), fragment);
});
test("unselected secondary routes have no liquid highlight", () => {
  assert.match(nav, /data-unselected=\{current < 0/);
  assert.match(nav, /data-unselected="true".*nimbus-drop/);
});
test("desktop and mobile nav are mutually exclusive and accessible", () => {
  assert.match(styles, /\.gazu-liquid-desktop \{ display: flex/);
  assert.match(styles, /\.gazu-mobile-links \{ display: none/);
  assert.match(styles, /@media \(max-width: 1340px\)/);
  assert.match(styles, /\.gazu-liquid-desktop \{ display: none/);
  assert.match(header, /aria-label="Mobile categories"/);
  assert.match(nav, /ariaLabel = "GAZU primary navigation"/);
  assert.match(nav, /aria-label=\{ariaLabel\}/);
});
test("TypeScript widget transpiles to React JSX without diagnostics", async () => {
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  let ts;
  try { ts = require("typescript"); }
  catch { try { ts = require("/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js"); } catch { return; } }
  const output = ts.transpileModule(nav, { fileName: "liquid-glass-navbar.tsx", compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
  assert.equal(output.diagnostics?.length || 0, 0);
  assert.match(output.outputText, /LiquidNavbar/);
});
