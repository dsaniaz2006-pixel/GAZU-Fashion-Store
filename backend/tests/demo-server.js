import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
process.env.JWT_SECRET = "browser-test-only-secret-with-at-least-32-characters";
process.env.NODE_ENV = "test";
process.env.ENABLE_MOCK_PAYMENTS = "true";
const { default: app } = await import("../src/app.js");
const { default: User } = await import("../src/models/User.js");
const { default: Product } = await import("../src/models/Product.js");
const { default: Review } = await import("../src/models/Review.js");
const db = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
await mongoose.connect(db.getUri());
await Promise.all([User.init(), Product.init(), Review.init()]);
await User.create({
  name: "Demo Admin",
  email: "admin@example.test",
  role: "admin",
  passwordHash: await bcrypt.hash("DemoPassword123!", 4),
});
await Product.create({
  name: "Relaxed Cotton Tee",
  description: "A relaxed everyday cotton tee.",
  category: "Men",
  pricePaise: 129900,
  quantity: 12,
});
const server = app.listen(8000, "127.0.0.1", () => console.log("Demo ready"));
process.on("SIGTERM", async () => {
  server.close();
  await mongoose.disconnect();
  await db.stop();
  process.exit();
});
