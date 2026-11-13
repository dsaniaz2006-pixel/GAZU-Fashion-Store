import { test } from "node:test";
import assert from "node:assert/strict";
import { FOOTWEAR_NAMES, FOOTWEAR_PRODUCTS, planFootwearImport } from "../scripts/footwearCatalogue.js";
import { productSchema } from "../src/middleware/validate.js";

test("all 14 unique men's footwear products have local images, prices and valid model input", () => {
  assert.equal(FOOTWEAR_PRODUCTS.length, 14);
  assert.equal(new Set(FOOTWEAR_NAMES).size, 14);
  for (const p of FOOTWEAR_PRODUCTS) {
    assert.equal(p.category, "Men");
    assert.equal(p.type, "Footwear");
    assert.match(p.img, /^\/products\/men-footwear\/[a-z0-9-]+\.webp$/);
    assert.equal(p.pricePaise > 0, true);
    assert.equal(productSchema.safeParse(p).success, true);
  }
});

test("import only adds missing shoes, preserving existing records and archived products", () => {
  const already = { name: FOOTWEAR_NAMES[0], active: true, quantity: 2, pricePaise: 50000 };
  const archived = { name: FOOTWEAR_NAMES[2], active: false };
  const plan = planFootwearImport([already, archived]);
  assert.equal(plan.toCreate.length, 12);
  assert.equal(plan.alreadyPresent[0], already);
  assert.equal(plan.alreadyPresent[1], archived);
  assert.equal(already.quantity, 2);
});

test("existing ambiguous product names must be resolved manually", () => {
  assert.throws(() => planFootwearImport([{ name: FOOTWEAR_NAMES[0] }, { name: FOOTWEAR_NAMES[0] }]), /Duplicate/);
});
