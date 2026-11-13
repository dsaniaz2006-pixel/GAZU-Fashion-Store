import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
const rootEnvPath = fileURLToPath(new URL("../../.env", import.meta.url));
// In Docker/CI, injected environment variables must take precedence.
if (existsSync(rootEnvPath)) process.loadEnvFile(rootEnvPath);
import app from "./app.js";
if (!process.env.PAYMENT_SERVICE_SECRET || process.env.PAYMENT_SERVICE_SECRET.length < 32)
  throw new Error("Set PAYMENT_SERVICE_SECRET to a random value of at least 32 characters.");
const server = app.listen(Number(process.env.PAYMENT_SERVICE_PORT) || 4001, process.env.PAYMENT_SERVICE_HOST || "0.0.0.0", () => console.log(JSON.stringify({ level: "info", event: "payment_service_ready" })));
const shutdown = () => server.close(() => process.exit(0));
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
