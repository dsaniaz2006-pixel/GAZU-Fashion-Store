import "./config/env.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { checkEnvironment } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import User from "./models/User.js";
import Product from "./models/Product.js";
import { DEMO_PRODUCTS } from "../scripts/threeProductCatalogue.js";
import { FOOTWEAR_PRODUCTS } from "../scripts/footwearCatalogue.js";
import { MENS_CLOTHING_PRODUCTS } from "../scripts/mensClothingCatalogue.js";
// Seed only an empty catalogue; rerunning does not reset stock or existing accounts.
try {
  checkEnvironment();
  if (
    !process.env.ADMIN_EMAIL ||
    !process.env.ADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD.length < 8 ||
    process.env.ADMIN_PASSWORD.length > 72 ||
    process.env.ADMIN_PASSWORD.startsWith("replace_")
  )
    throw new Error(
      "Choose ADMIN_EMAIL and your own ADMIN_PASSWORD (8–72 characters) in .env.",
    );
  await connectDatabase(process.env.MONGODB_URI);
  const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing && existing.role !== "admin")
    throw new Error(
      "That email belongs to a customer. Choose a different ADMIN_EMAIL.",
    );
  if (!existing)
    await User.create({
      name: process.env.ADMIN_NAME || "GAZU Admin",
      email,
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
      role: "admin",
    });
  // Add the original demo items, 14 footwear, 13 topwear and 1 bottomwear images.
  // Never overwrite an existing product's price, stock, image, or _id.
  for (const demo of [...DEMO_PRODUCTS, ...FOOTWEAR_PRODUCTS, ...MENS_CLOTHING_PRODUCTS]) {
    if (!(await Product.exists({ name: demo.name }))) {
      await Product.create(demo);
      console.log(`Added missing catalogue product: ${demo.name}`);
    }
  }
  console.log(
    "Seed complete. Sign in with the admin email and password you chose in .env.",
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
