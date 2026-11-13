import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MENS_TOPWEAR_PRODUCTS, MENS_BOTTOMWEAR_PRODUCTS,
  MENS_CLOTHING_PRODUCTS, MENS_CLOTHING_NAMES, planMensClothingImport,
} from "../scripts/mensClothingCatalogue.js";
import { productSchema } from "../src/middleware/validate.js";

const root = fileURLToPath(new URL("../../frontend/public", import.meta.url));

test("all screenshot products are individually indexed and the original footwear list stays intact", () => {
  assert.equal(MENS_TOPWEAR_PRODUCTS.length, 13);
  assert.equal(MENS_BOTTOMWEAR_PRODUCTS.length, 1);
  assert.equal(MENS_CLOTHING_PRODUCTS.length, 14);
  assert.equal(new Set(MENS_CLOTHING_NAMES).size, 14);
  assert.equal(MENS_TOPWEAR_PRODUCTS.every((p) => p.type === "Topwear"), true);
  assert.equal(MENS_BOTTOMWEAR_PRODUCTS.every((p) => p.type === "Bottomwear"), true);
});

test("all 14 local images exist and all product records match the admin validation schema", () => {
  const assets = new Set();
  for (const item of MENS_CLOTHING_PRODUCTS) {
    assert.equal(item.category, "Men");
    assert.equal(productSchema.safeParse(item).success, true, `${item.name} did not validate`);
    assert.match(item.img, /^\/products\/men-(?:topwear|bottomwear)\/[a-z0-9-]+\.webp$/);
    const file = path.join(root, item.img.replace(/^\//, ""));
    assert.equal(fs.statSync(file).size > 10000, true, `Missing/empty image for ${item.name}`);
    assert.equal(assets.has(item.img), false, `Repeated image: ${item.img}`);
    assets.add(item.img);
    assert.equal(item.quantity, 10);
    assert.equal(item.pricePaise > 0, true);
    if (item.originalPricePaise != null) assert.ok(item.originalPricePaise > item.pricePaise);
  }
});

test("import preserves both active and archived products, adds only missing names", () => {
  const active = { name: MENS_CLOTHING_NAMES[0], active: true, pricePaise: 999, quantity: 1 };
  const archived = { name: MENS_CLOTHING_NAMES[13], active: false };
  const plan = planMensClothingImport([active, archived]);
  assert.equal(plan.toCreate.length, 12);
  assert.deepEqual(plan.alreadyPresent, [active, archived]);
  assert.equal(active.pricePaise, 999);
  assert.equal(planMensClothingImport(MENS_CLOTHING_PRODUCTS).toCreate.length, 0);
});

test("duplicate pre-existing product names are rejected without writing anything", () => {
  assert.throws(() => planMensClothingImport([{name: MENS_CLOTHING_NAMES[0]}, {name: MENS_CLOTHING_NAMES[0]}]), /Duplicate/);
});
