import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");

test("AI is a single item in the existing Nimbus Waterline with dropdown", () => {
  const primary = read("../frontend/src/components/ui/GazuLiquidNav.jsx");
  assert.match(primary, /import \{ LiquidNavbar, NimbusIcons \} from "\.\/liquid-glass-navbar"/);
  assert.match(primary, /label: "AI"/);
  assert.match(primary, /ariaExpanded: aiOpen/);
  assert.match(primary, /gazu-ai-dropdown-menu/);
  assert.match(primary, /onOutside/);
  assert.match(primary, /event\.key === "Escape"/);
});

test("all five Wave 2 AI pages and Wave 3 user tools are in the menu", () => {
  const routes = read("../frontend/src/components/ui/aiNavRoutes.mjs");
  for (const path of ["/shop-the-look", "/style-finder", "/ai-assistant", "/visual-search", "/discover", "/fit-assistant", "/support"]) {
    assert.ok(routes.includes(`route: "${path}"`), `Missing ${path}`);
  }
  assert.match(routes, /\/admin\/ai-studio/);
  assert.match(routes, /\/admin\/inventory-forecast/);
});

test("the separate AI toolbar is removed and Shop page has no giant AI buttons", () => {
  const shell = read("../frontend/src/layouts/StorefrontLayout.jsx");
  const shop = read("../frontend/src/pages/Shop.jsx");
  assert.doesNotMatch(shell, /<GazuAINav/);
  assert.doesNotMatch(shop, /gazu-phase-link/);
  assert.doesNotMatch(shop, /to="\/(?:shop-the-look|style-finder|ai-assistant|visual-search|discover)"/);
});

test("mobile header exposes matching AI routes while respecting admin permissions", () => {
  const header = read("../frontend/src/components/Header.jsx");
  assert.match(header, /Mobile categories/);
  assert.match(header, /gazu-mobile-ai-menu/);
  assert.match(header, /setMobileAiOpen/);
  assert.match(header, /user\?\.role === "admin"/);
});
