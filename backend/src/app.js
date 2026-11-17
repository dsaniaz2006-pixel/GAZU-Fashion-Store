import express from "express";
import cors from "cors";
import helmet from "helmet";
import auth from "./routes/auth.js";
import products from "./routes/products.js";
import cart from "./routes/cart.js";
import orders from "./routes/orders.js";
import admin from "./routes/admin.js";
import payments from "./routes/payments.js";
import { errorHandler } from "./middleware/errors.js";
import reviews from "./routes/reviews.js";
import profile from "./routes/profile.js";
import marketing from "./routes/marketing.js";
import events from "./routes/events.js";
import ai from "./routes/ai.js";
import wave2 from "./routes/wave2.js";
import wave3 from "./routes/wave3.js";
import uploads, { uploadDir } from "./routes/uploads.js";
import { requestId, requestLogger } from "./middleware/requestLogger.js";
import { isAllowedBrowserOrigin } from "./config/allowedOrigins.js";
import { healthHandler } from "./http/health.js";
import { identifyApi, apiNotFound } from "./http/responses.js";
const app = express();
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
app.use(requestId, requestLogger);
// Identify the correct API process when other local projects also use port 8000.
app.use(identifyApi);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // Non-browser and same-origin requests may omit Origin.
    callback(null, !origin || isAllowedBrowserOrigin(origin));
  },
}));
app.use(express.json({ limit: "32kb" }));
app.get("/api/health", healthHandler);
app.use(
  "/uploads",
  express.static(uploadDir, {
    dotfiles: "deny",
    setHeaders(res) {
      res.set("X-Content-Type-Options", "nosniff");
    },
  }),
);
app.use("/api/reviews", reviews);
app.use("/api/admin/uploads", uploads);
app.use("/api/auth", auth);
app.use("/api/products", products);
app.use("/api/cart", cart);
app.use("/api/profile", profile);
app.use("/api/marketing", marketing);
app.use("/api/events", events);
app.use("/api/ai", ai);
app.use("/api/wave2", wave2);
app.use("/api/wave3", wave3);
app.use("/api/orders", orders);
app.use("/api/admin", admin);
app.use("/api/payments", payments);
app.use(apiNotFound);
app.use(errorHandler);
export default app;
