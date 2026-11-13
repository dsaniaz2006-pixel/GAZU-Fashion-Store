import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { activeGazuUtilityItem } from "../frontend/src/components/ui/liquidNavRoutes.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const header = read("frontend/src/components/Header.jsx");
const utility = read("frontend/src/components/ui/GazuLiquidUtilityNav.jsx");
const waterline = read("frontend/src/components/ui/liquid-glass-navbar.tsx");
const css = read("frontend/src/styles.css");

test("header retains primary Waterline, centered GAZU logo, and independent utility Waterline", () => {
  assert.match(header, /<GazuLiquidNav \/>/);
  assert.match(header, /<GazuLiquidUtilityNav \/>/);
  assert.match(header, /className=\{`wordmark/);
  assert.ok(header.indexOf("<GazuLiquidNav />") < header.indexOf("wordmark${"));
  assert.ok(header.indexOf("wordmark${") < header.indexOf("<GazuLiquidUtilityNav />"));
});

test("utility nav has correct actions, no demo items, and real storefront handlers", () => {
  for (const fragment of ["SEARCH", "SIGN IN", "WISHLIST", "BAG (", "go(\"account\")", "go(\"wishlist\")", "go(\"cart\")", "setSearchOpen", "go(\"admin\")"]) {
    assert.ok(utility.includes(fragment), `missing ${fragment}`);
  }
  assert.doesNotMatch(utility, /Flights|Weather|window\.location/);
  assert.match(utility, /ariaLabel="GAZU utility navigation"/);
  assert.match(utility, /wishlist\.length/);
  assert.match(utility, /totalQty/);
});

test("route selection and search-open state are accurate", () => {
  assert.equal(activeGazuUtilityItem("/", false), -1);
  assert.equal(activeGazuUtilityItem("/", true), 0);
  assert.equal(activeGazuUtilityItem("/account", false), 1);
  assert.equal(activeGazuUtilityItem("/account/orders", false), 1);
  assert.equal(activeGazuUtilityItem("/wishlist", false), 2);
  assert.equal(activeGazuUtilityItem("/cart", false), 3);
  assert.equal(activeGazuUtilityItem("/checkout", false), 3);
  assert.equal(activeGazuUtilityItem("/admin/products", false, true), 4);
  assert.equal(activeGazuUtilityItem("/admin/products", false, false), -1);
  assert.equal(activeGazuUtilityItem("/product/123", false), -1);
});

test("search toggles open and closed even when selected", () => {
  assert.match(utility, /case 0: setSearchOpen\(\(previous\) => !previous\)/);
  assert.match(waterline, /onChange\?\.\(i, items\[i\]\)/);
  assert.doesNotMatch(waterline, /if \(i !== current\) \{[\s\S]{0,80}onChange\?\./);
});

test("each Waterline owns a unique SVG refraction ID and navigation label", () => {
  assert.match(waterline, /React\.useId\(\)/);
  assert.match(waterline, /id=\{filterId\}/);
  assert.match(waterline, /--nimbus-refraction/);
  assert.doesNotMatch(waterline, /id="nimbus-refract"/);
  assert.match(waterline, /aria-label=\{ariaLabel\}/);
});

test("warm grey matches footer; section backgrounds are consistent while intro stays white", () => {
  assert.match(css, /--paper: #e5e4de/);
  assert.match(css, /--gazu-warm-grey: #e5e4de/);
  assert.match(css, /\.ns-home \{[\s\S]*?background: var\(--gazu-warm-grey\)/);
  assert.match(css, /\.ns-editorial-header \{[\s\S]*?background: var\(--gazu-warm-grey\)/);
  assert.match(css, /\.ns-products \{[^}]*background: var\(--gazu-warm-grey\)/);
  for (const name of ["summer/SummerGallery.css", "dress-like/DressLikeSection.css", "categories/FashionCategorySection.css"]) {
    const section = read(`frontend/src/components/${name}`);
    assert.match(section, /background: var\(--gazu-warm-grey, #e5e4de\)/);
  }
  assert.match(read("frontend/src/components/brand/BrandIntro.css"), /background: #ffffff/);
});

test("dual pills and responsive utility fallback have independent desktop/mobile displays", () => {
  assert.match(css, /\.header \.gazu-liquid-utility-desktop \{ display: flex/);
  assert.match(css, /@media \(max-width: 1340px\) \{[\s\S]*?\.header \.gazu-liquid-utility-desktop \{ display: none/);
  assert.match(css, /\.header \.gazu-mobile-utilities \{ display: flex/);
  assert.match(css, /\.ns-editorial-header \.right-nav \.gazu-liquid-utility \.nimbus-glass \{ display: block/);
  assert.match(header, /gazu-mobile-utilities/);
});

test("existing search panel and mobile controls remain accessible", () => {
  assert.match(header, /className="search-panel"/);
  assert.match(header, /aria-expanded=\{searchOpen\}/);
  assert.match(header, /aria-label=\{`Bag, \$\{totalQty\} items`\}/);
  assert.match(header, /aria-label=\{`Wishlist, \$\{wishlist\.length\} saved items`\}/);
});
