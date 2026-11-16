import { createServer as createHttpsServer } from "node:https";
import { readFileSync } from "node:fs";
import "./config/env.js";
import { checkEnvironment } from "./config/env.js";
import { getRuntimeConfig } from "./config/runtime.js";
import { connectDatabase } from "./config/db.js";
import app from "./app.js";
import User from "./models/User.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import EmailOtp from "./models/EmailOtp.js";
import Review from "./models/Review.js";
import GoogleChallenge from "./models/GoogleChallenge.js";
import PaymentAttempt from "./models/PaymentAttempt.js";
import RazorpayAttempt from "./models/RazorpayAttempt.js";
import { connectCache, closeCache } from "./services/cache.js";
import { logger } from "./config/logger.js";
import mongoose from "mongoose";
// Connect first: a backend without its database must not advertise readiness.
try {
  checkEnvironment();
  const { port } = getRuntimeConfig();
  await connectDatabase(process.env.MONGODB_URI);
  // Build unique email and checkout indexes before accepting writes.
  await Promise.all([
    User.init(),
    Product.init(),
    Order.init(),
    Review.init(),
    EmailOtp.init(),
    GoogleChallenge.init(),
    PaymentAttempt.init(),
    RazorpayAttempt.init(),
  ]);
  await connectCache();
  const useHttps = process.env.GAZU_HTTPS_ENABLED === "true";
  const server = useHttps
    ? createHttpsServer({
        key: readFileSync(process.env.GAZU_TLS_KEY_FILE),
        cert: readFileSync(process.env.GAZU_TLS_CERT_FILE),
      }, app)
    : app;
  server.listen(port, "0.0.0.0", () =>
    logger.info("GAZU API ready", { port, protocol: useHttps ? "https" : "http" }),
  );
  const shutdown = async () => {
    server.close();
    await closeCache();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
} catch (error) {
  logger.error("Startup failed", { errorType: error.name });
  process.exit(1);
}
