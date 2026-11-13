import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MEN_SECTIONS, MEN_SECTION_ITEMS, menSectionIndex, ACCOUNT_SECTION_ITEMS, accountSectionIndex, ADMIN_SECTION_ITEMS, adminSectionIndex } from "../frontend/src/components/ui/liquidSectionRoutes.mjs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const shop = read("frontend/src/pages/Shop.jsx");
const sections = read("frontend/src/components/ui/GazuLiquidSectionNav.jsx");
const liquid = read("frontend/src/components/ui/liquid-glass-navbar.tsx");
const account = read("frontend/src/layouts/AccountLayout.jsx");
const admin = read("frontend/src/layouts/AdminLayout.jsx");
const header = read("frontend/src/components/Header.jsx");
const footer = read("frontend/src/components/Footer.jsx");
const css = read("frontend/src/styles.css");

test("Men's filter order exactly matches the source screenshot", () => {
  assert.deepEqual(MEN_SECTION_ITEMS.map(x => x.label), ["ALL MEN", "TOPWEAR", "BOTTOMWEAR", "WINTERWEAR", "FOOTWEAR", "ACCESSORIES"]);
  assert.deepEqual(MEN_SECTIONS, ["", "Topwear", "Bottomwear", "Winterwear", "Footwear", "Accessories"]);
  assert.equal(menSectionIndex("Winterwear"), 3);
  assert.equal(menSectionIndex("Accessories"), 5);
  assert.equal(menSectionIndex("Unknown"), 0);
});

test("Men's liquid selection changes URL filter, preserving existing products query", () => {
  assert.match(shop, /label="Men's sections"/);
  assert.match(shop, /onSelect=\{\(_, section\) => change\("type", section\.value\)\}/);
  assert.match(shop, /menSectionIndex\(type\)/);
  assert.match(shop, /useSearchParams\(\)/);
  assert.match(shop, /new URLSearchParams\(\{/);
  assert.doesNotMatch(shop, /<nav className="mens-footwear-nav"/);
});

test("liquid segment component has controlled selection, labels and usable overflow", () => {
  assert.match(sections, /<LiquidNavbar/);
  assert.match(sections, /active=\{active\}/);
  assert.match(sections, /ariaLabel=\{label\}/);
  assert.match(sections, /items=\{navItems\}/);
  assert.match(sections, /onChange=\{\(index\) =>/);
  assert.match(css, /\.gazu-section-liquid-scroll \{[\s\S]*?overflow-x: auto/);
  assert.match(css, /\.mens-footwear-nav \.nimbus-item/);
});

test("Account and Admin tabs are routed via React Router without page reloads", () => {
  assert.deepEqual(ACCOUNT_SECTION_ITEMS.map(x => x.path), ["/account", "/account/profile", "/account/orders"]);
  assert.deepEqual(ADMIN_SECTION_ITEMS.map(x => x.path), ["/admin/products", "/admin/orders", "/admin/stats", "/admin/marketing", "/admin/staff", "/admin/operations", "/admin/ai-studio", "/admin/inventory-forecast"]);
  assert.equal(accountSectionIndex("/account"), 0);
  assert.equal(accountSectionIndex('/account/profile'),1);
  assert.equal(accountSectionIndex("/account/orders/order-1"), 2);
  assert.equal(adminSectionIndex("/admin"), 2);
  assert.equal(adminSectionIndex("/admin/products"), 0);
  assert.equal(adminSectionIndex("/admin/orders"), 1);
  assert.equal(adminSectionIndex("/admin/stats"), 2);
  assert.equal(adminSectionIndex('/admin/marketing'), 3);
  assert.equal(adminSectionIndex('/admin/staff'),4);
  assert.equal(adminSectionIndex('/admin/operations'), 5);
  for (const code of [account,admin]) {
    assert.match(code, /<GazuLiquidSectionNav/);
    assert.match(code, /navigate\(item\.path\)/);
    assert.doesNotMatch(code, /window\.location|<NavLink/);
  }
});

test("Pagination has disabled boundary controls and a live liquid page indicator", () => {
  assert.match(shop, /label="Pagination"/);
  assert.match(shop, /safePage <= 1/);
  assert.match(shop, /safePage >= data\.pages/);
  assert.match(shop, /active=\{1\}/);
  assert.match(liquid, /disabled\?: boolean/);
  assert.match(liquid, /if \(items\[i\]\?\.disabled\) return/);
  assert.match(liquid, /disabled: it\.disabled/);
  assert.match(liquid, /if \(items\[n\]\?\.disabled\) return/);
});

test("Mobile and footer nav maintain glass appearance without adding shader canvases", () => {
  assert.match(header, /aria-label="Mobile categories"/);
  assert.match(header, /aria-current=\{mobileActive === 1/);
  assert.match(css, /\.gazu-mobile-links button\[aria-current="page"\]/);
  assert.match(css, /\.gazu-footer-nav > button:hover/);
  assert.match(footer, /aria-label="Explore collections"/);
  assert.match(footer, /aria-label="Help and support"/);
  assert.doesNotMatch(footer, /<LiquidNavbar/);
});

test("Top header liquid navbars and footer remain independent of shopping data", () => {
  assert.match(header, /<GazuLiquidNav \/>/);
  assert.match(header, /<GazuLiquidUtilityNav \/>/);
  assert.match(footer, /go\("shop", "Men"\)/);
  assert.match(footer, /go\("track"\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
