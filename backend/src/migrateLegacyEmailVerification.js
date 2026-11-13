import "./config/env.js";
import mongoose from "mongoose";
import { checkEnvironment } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import User from "./models/User.js";
// Optional operator decision, never run automatically. Defaults to count-only.
try {
  checkEnvironment();
  await connectDatabase(process.env.MONGODB_URI);
  const filter = { role: "customer", emailVerified: { $exists: false } };
  if (process.argv.includes("--apply")) {
    const result = await User.collection.updateMany(filter, {
      $set: { emailVerified: true },
    });
    console.log(
      `Grandfathered ${result.modifiedCount} legacy customers. No new unverified accounts were changed.`,
    );
  } else
    console.log(
      `Dry run: ${await User.collection.countDocuments(filter)} legacy customer accounts lack emailVerified. Default behavior is to require verification. Use --apply only if you intentionally trust those existing emails.`,
    );
} catch {
  console.error(
    "Migration failed. Check database configuration and permissions.",
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
