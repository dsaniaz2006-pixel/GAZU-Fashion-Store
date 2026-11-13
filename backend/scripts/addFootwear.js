#!/usr/bin/env node
// Additive men's-footwear catalogue import. Never overwrites admin edits,
// removes products, modifies carts, or changes historical orders.
import "../src/config/env.js";
import mongoose from "mongoose";
import { checkEnvironment } from "../src/config/env.js";
import { connectDatabase } from "../src/config/db.js";
import Product from "../src/models/Product.js";
import { connectCache, invalidateProducts, closeCache } from "../src/services/cache.js";
import { FOOTWEAR_PRODUCTS, FOOTWEAR_NAMES, planFootwearImport } from "./footwearCatalogue.js";

const args = process.argv.slice(2);
const readArg = (name) => args.find((a) => a.startsWith(`${name}=`))?.slice(name.length + 1);
const target = readArg("--target");
const apply = args.includes("--apply");
if (args.includes("--help")) {
  console.log(`Usage:
  npm run catalogue:footwear -- --target=atlas                         # preview
  npm run catalogue:footwear -- --target=atlas --apply --confirm=ADD_FOOTWEAR
  docker compose exec api node scripts/addFootwear.js --target=docker  # preview
  docker compose exec api node scripts/addFootwear.js --target=docker --apply --confirm=ADD_FOOTWEAR`);
  process.exit(0);
}
if (!["atlas", "docker"].includes(target) ||
    args.some((arg) => !["--apply"].includes(arg) && !arg.startsWith("--target=") && !arg.startsWith("--confirm=")) ||
    (apply && readArg("--confirm") !== "ADD_FOOTWEAR")) {
  console.error("Choose --target=atlas or --target=docker; applying requires --apply --confirm=ADD_FOOTWEAR. No changes made.");
  process.exit(1);
}
const uri = process.env.MONGODB_URI || "";
const mode = process.env.GAZU_DB_MODE || "";
if (target === "docker" && (mode !== "docker-local" || !/^mongodb:\/\/mongo:27017\//.test(uri))) {
  console.error("Docker target requires docker-local mode and MongoDB host mongo. No changes made.");
  process.exit(1);
}
if (target === "atlas" && (mode !== "atlas" || !/^mongodb(\+srv)?:\/\//.test(uri) ||
    /^mongodb:\/\/(?:mongo|localhost|127\.0\.0\.1)(?::|\/)/.test(uri))) {
  console.error("Atlas target requires GAZU_DB_MODE=atlas and a non-local Atlas URI. No changes made.");
  process.exit(1);
}
let code=0;
try {
  checkEnvironment();
  await connectDatabase(uri);
  console.log(`${apply ? "APPLY" : "PREVIEW"} — ${target}; database ${mongoose.connection.name}`);
  const existing = await Product.find({ name: { $in: FOOTWEAR_NAMES } }).select("name active").lean();
  const plan = planFootwearImport(existing);
  console.log(`Images/products bundled: ${FOOTWEAR_PRODUCTS.length}`);
  console.log(`Already in database: ${plan.alreadyPresent.length}; to create: ${plan.toCreate.length}`);
  for (const p of plan.toCreate) console.log(`  + ${p.name}`);
  for (const p of plan.alreadyPresent) {
    if (p.active === false) console.log(`  SKIP (archived; not auto-reactivated): ${p.name}`);
  }
  if (apply) {
    for (const p of plan.toCreate) {
      // Recheck to make reruns safe. No overwrite or delete operations.
      if (!(await Product.exists({ name: p.name }))) {
        await Product.create(p);
        console.log(`Created: ${p.name}`);
      }
    }
    await connectCache();
    await invalidateProducts();
    console.log("Import complete. Existing records and admin changes are unchanged.");
  } else {
    console.log("Preview only; database not modified. Review the list before using --apply.");
  }
} catch (err) {
  console.error(`Import failed: ${err.message}`); code=1;
} finally {
  try { await closeCache(); } catch { /* optional */ }
  try { await mongoose.disconnect(); } catch { /* optional */ }
  process.exitCode=code;
}
