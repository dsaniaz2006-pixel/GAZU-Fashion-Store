#!/usr/bin/env node
// Additive import for 13 Men Topwear + 1 Men Bottomwear product.
// No existing products, carts, customers, orders, or admin edits are overwritten.
import "../src/config/env.js";
import mongoose from "mongoose";
import { checkEnvironment } from "../src/config/env.js";
import { connectDatabase } from "../src/config/db.js";
import Product from "../src/models/Product.js";
import { connectCache, invalidateProducts, closeCache } from "../src/services/cache.js";
import { MENS_CLOTHING_PRODUCTS, MENS_CLOTHING_NAMES, planMensClothingImport } from "./mensClothingCatalogue.js";

const args = process.argv.slice(2);
const readArg = (name) => args.find((a) => a.startsWith(`${name}=`))?.slice(name.length + 1);
const target = readArg("--target");
const apply = args.includes("--apply");
if (args.includes("--help")) {
  console.log(`Usage:
  npm run catalogue:mens-clothing -- --target=atlas
  npm run catalogue:mens-clothing -- --target=atlas --apply --confirm=ADD_MENS_CLOTHING
  docker compose exec api node scripts/addMensClothing.js --target=docker
  docker compose exec api node scripts/addMensClothing.js --target=docker --apply --confirm=ADD_MENS_CLOTHING`);
  process.exit(0);
}
if (!["atlas", "docker"].includes(target) ||
    args.some((arg) => !["--apply"].includes(arg) && !arg.startsWith("--target=") && !arg.startsWith("--confirm=")) ||
    (apply && readArg("--confirm") !== "ADD_MENS_CLOTHING")) {
  console.error("Choose --target=atlas or --target=docker; applying requires --apply --confirm=ADD_MENS_CLOTHING. No changes made.");
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
  console.error("Atlas target requires GAZU_DB_MODE=atlas and a non-local MongoDB URI. No changes made.");
  process.exit(1);
}
let code = 0;
try {
  checkEnvironment();
  await connectDatabase(uri);
  console.log(`${apply ? "APPLY" : "PREVIEW"} — ${target}; database ${mongoose.connection.name}`);
  const existing = await Product.find({ name: { $in: MENS_CLOTHING_NAMES } }).select("name active").lean();
  const plan = planMensClothingImport(existing);
  console.log(`Screenshot products bundled: ${MENS_CLOTHING_PRODUCTS.length} (13 Topwear, 1 Bottomwear)`);
  console.log(`Already in database: ${plan.alreadyPresent.length}; to create: ${plan.toCreate.length}`);
  for (const p of plan.toCreate) console.log(`  + [${p.type}] ${p.name}`);
  for (const p of plan.alreadyPresent) {
    if (p.active === false) console.log(`  SKIP (archived; not reactivated): ${p.name}`);
  }
  if (apply) {
    for (const p of plan.toCreate) {
      if (!(await Product.exists({ name: p.name }))) {
        await Product.create(p);
        console.log(`Created: ${p.name}`);
      }
    }
    await connectCache();
    await invalidateProducts();
    console.log("Import complete. All previous products, customers, carts and orders remain unchanged.");
  } else {
    console.log("Preview only; no database changes. Review the target and list before --apply.");
  }
} catch (error) {
  console.error(`Import failed: ${error.message}`);
  code = 1;
} finally {
  try { await closeCache(); } catch { /* optional cache service */ }
  try { await mongoose.disconnect(); } catch { /* connection may not have opened */ }
  process.exitCode = code;
}
