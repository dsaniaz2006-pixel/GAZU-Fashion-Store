import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEMO_PRODUCTS, DEMO_NAMES, classifyCatalogueProduct, planThreeProductCleanup,
} from "../scripts/threeProductCatalogue.js";

const oldSku = (category, number) => `GAZU-M-${category}-${String(number).padStart(3, "0")}`;

test("the code bundles exactly three original products, prices, images and categories", () => {
  assert.deepEqual(DEMO_NAMES, ["Relaxed Cotton Tee", "Soft Knit Pullover", "Structured Tote"]);
  assert.deepEqual(DEMO_PRODUCTS.map(({ pricePaise }) => pricePaise), [129900, 249900, 99900]);
  assert.deepEqual(DEMO_PRODUCTS.map(({ category }) => category), ["Men", "Women", "Accessories"]);
  assert.deepEqual(DEMO_PRODUCTS.map(({ img }) => img), [
    "photo-1521572163474-6864f9cf17ab",
    "photo-1434389677669-e08b4cac3105",
    "photo-1548036328-c9fa89d128fa",
  ]);
});

test("all five legacy Men's SKU sections are recognized without bundling their catalogue", () => {
  for (const group of ["TOP", "BOT", "OUT", "FTW", "ACC"]) {
    for (let i = 1; i <= 15; i++) {
      assert.equal(classifyCatalogueProduct({ name: "Former product", sku: oldSku(group, i) }), "legacy-men");
    }
  }
  assert.equal(classifyCatalogueProduct({ name: "New Item", sku: oldSku("TOP", 16) }), "other");
});

test("legacy SKU-less Men items are detected, but the three demo names are protected", () => {
  assert.equal(classifyCatalogueProduct({ name: "GAZU Example Men's Item", department: "men", mainCategory: "topwear" }), "legacy-men");
  assert.equal(classifyCatalogueProduct({ name: "GAZU Example Men's Item", department: "men" }), "other");
  assert.equal(classifyCatalogueProduct({ name: "Relaxed Cotton Tee", sku: oldSku("TOP", 1) }), "keep");
  assert.equal(classifyCatalogueProduct({ name: "GAZU Other Accessories", category: "Accessories" }), "other");
  assert.equal(classifyCatalogueProduct({ name: "Completely New Jacket", category: "Women" }), "other");
});

test("planning keeps three demo items and archives 75 former items only", () => {
  const docs = [
    ...DEMO_PRODUCTS.map((p) => ({ ...p, _id: p.name, active: true })),
    ...["TOP", "BOT", "OUT", "FTW", "ACC"].flatMap((g) =>
      Array.from({ length: 15 }, (_, n) => ({
        _id: `${g}${n}`, name: `GAZU Old ${g} ${n}`,
        sku: oldSku(g, n + 1), active: true, category: "Men", quantity: 10,
      }))),
  ];
  const plan = planThreeProductCleanup(docs);
  assert.equal(plan.retired.length, 75);
  assert.equal(plan.unknown.length, 0);
  assert.equal(plan.toCreate.length, 0);
  assert.equal(plan.toRestore.length, 0);
  assert.equal(plan.keep.length, 3);
  docs.slice(3).forEach((p) => { p.active = false; });
  assert.equal(planThreeProductCleanup(docs).retired.length, 0);
});

test("a database with only former catalogue entries can restore three demos without changing those entries", () => {
  const old = { name: "GAZU Old Product", sku: oldSku("BOT", 1), active: true, pricePaise: 799900, quantity: 5 };
  const plan = planThreeProductCleanup([old]);
  assert.equal(plan.toCreate.length, 3);
  assert.equal(old.pricePaise, 799900);
  assert.equal(old.quantity, 5);
});

test("unknown active products are reported separately, not targeted for deletion", () => {
  const plan = planThreeProductCleanup([{ name: "Someone Else's Product", active: true }, { name: "Structured Tote", active: false }]);
  assert.equal(plan.unknown.length, 1);
  assert.deepEqual(plan.toRestore.map((p) => p.name), ["Structured Tote"]);
  assert.equal(plan.retired.length, 0);
});

test("duplicate original demo names are rejected rather than silently deleting either", () => {
  assert.throws(() => planThreeProductCleanup([
    { name: "Structured Tote", active: true }, { name: "Structured Tote", active: true },
  ]), /Multiple database products/);
});
