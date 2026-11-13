#!/usr/bin/env node
// One-time, opt-in data correction. Changes only Product.active, and inserts
// missing demo products. Never deletes MongoDB documents, carts, orders or stock.
import "../src/config/env.js";
import mongoose from "mongoose";
import { checkEnvironment } from "../src/config/env.js";
import { connectDatabase } from "../src/config/db.js";
import Product from "../src/models/Product.js";
import { connectCache, invalidateProducts, closeCache } from "../src/services/cache.js";
import { DEMO_PRODUCTS, DEMO_NAMES, planThreeProductCleanup } from "./threeProductCatalogue.js";

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const get = (name) => args.find((arg) => arg.startsWith(`${name}=`))?.split("=").slice(1).join("=");
const help = () => {
  console.log(`Usage:
  npm run catalogue:three -- --target=atlas                  # preview only
  npm run catalogue:three -- --target=atlas --apply --confirm=KEEP_ONLY_THREE
  docker compose exec api node scripts/keepOnlyThree.js --target=docker # preview
  docker compose exec api node scripts/keepOnlyThree.js --target=docker --apply --confirm=KEEP_ONLY_THREE

The script only archives the former Men's products and preserves historical data.
If unrelated active products are found, it stops rather than touching them.`);
};
const target = get("--target");
const apply = has("--apply");
if (has("--help")) { help(); process.exit(0); }
if (args.some((arg) => !["--apply", "--dry-run"].includes(arg) &&
       !arg.startsWith("--target=") && !arg.startsWith("--confirm="))) {
  help(); process.exit(1);
}
if (!["atlas", "docker"].includes(target)) {
  console.error("Specify --target=atlas or --target=docker. No database connection was made.");
  process.exit(1);
}
if (apply && get("--confirm") !== "KEEP_ONLY_THREE") {
  console.error("Apply requires --confirm=KEEP_ONLY_THREE. No database connection was made.");
  process.exit(1);
}
if (apply && has("--dry-run")) {
  console.error("Choose either dry-run or apply, not both."); process.exit(1);
}
const uri = process.env.MONGODB_URI || "";
const mode = process.env.GAZU_DB_MODE || "";
if (target === "docker" && (mode !== "docker-local" || !/^mongodb:\/\/mongo:27017\//.test(uri))) {
  console.error("Docker target requires docker-local mode and the internal mongo hostname."); process.exit(1);
}
if (target === "atlas" && (mode !== "atlas" || !/^mongodb(\+srv)?:\/\//.test(uri) ||
  /^mongodb:\/\/(?:mongo|localhost|127\.0\.0\.1)(?::|\/)/.test(uri))) {
  console.error("Atlas target requires atlas mode and a non-local Atlas URI."); process.exit(1);
}
let exitCode = 0;
const describe = (p) => `${p.name} [${p.sku || "no SKU"}]`;
try {
  checkEnvironment();
  console.log(`Target: ${target} (connection credentials never printed); ${apply ? "APPLY" : "PREVIEW ONLY"}`);
  await connectDatabase(uri);
  console.log(`Connected database: ${mongoose.connection.name}`);
  const readAll = (session) => Product.collection.find({}, {
    ...(session ? { session } : {}),
    projection: { _id: 1, name: 1, sku: 1, category: 1, department: 1, gender: 1, mainCategory: 1, active: 1 },
  }).toArray();
  const describePlan = (plan) => {
    console.log(`Original demo products present: ${plan.keep.length}/3`);
    console.log(`Former Men's products to hide: ${plan.retired.length}`);
    console.log(`Demo products to create: ${plan.toCreate.length}`);
    console.log(`Demo products to restore: ${plan.toRestore.length}`);
    console.log(`Other active products requiring manual review: ${plan.unknown.length}`);
    for (const p of plan.unknown.slice(0, 30)) console.log(`  UNTOUCHED: ${describe(p)}`);
  };
  const initial = planThreeProductCleanup(await readAll());
  describePlan(initial);
  if (initial.unknown.length) {
    throw new Error("Other active products exist. No changes made; review these products first. Only the former Men's collection is targeted.");
  }
  if (!apply) {
    console.log("Preview complete. No database writes performed. Run the explicit --apply command only after reviewing this plan.");
  } else {
    await mongoose.connection.transaction(async (session) => {
      const plan = planThreeProductCleanup(await readAll(session));
      if (plan.unknown.length) throw new Error("New unexpected products appeared: transaction cancelled.");
      if (plan.retired.length) {
        await Product.collection.updateMany(
          { _id: { $in: plan.retired.map((p) => p._id) }, active: { $ne: false } },
          { $set: { active: false } }, { session },
        );
      }
      for (const p of plan.toRestore) {
        const doc = plan.keep.find((row) => row.name === p.name);
        await Product.collection.updateOne({ _id: doc._id }, { $set: { active: true } }, { session });
      }
      if (plan.toCreate.length) await Product.create(plan.toCreate, { session });
    });
    const finalPlan = planThreeProductCleanup(await readAll());
    if (finalPlan.active.length !== 3 ||
      finalPlan.active.some((p) => !DEMO_NAMES.includes(p.name))) {
      throw new Error("Post-cleanup verification failed: expected exactly the three demo products to be active.");
    }
    console.log("Confirmed: exactly three original demo products are active.");
    // After the transaction commits, rotate Redis product-cache keys.
    await connectCache();
    await invalidateProducts();
    console.log("Product-cache invalidation requested. If Redis was unavailable, restart the API or allow the short cache TTL to expire.");
    console.log("Former product records remain archived (active:false) to preserve historical order references.");
  }
} catch (error) {
  console.error(`Cleanup not completed: ${error.name === "MongoServerSelectionError" ? "Unable to connect to the selected MongoDB deployment." : error.message}`);
  exitCode = 1;
} finally {
  try { await closeCache(); } catch { /* optional */ }
  try { await mongoose.disconnect(); } catch { /* optional */ }
  process.exitCode = exitCode;
}
