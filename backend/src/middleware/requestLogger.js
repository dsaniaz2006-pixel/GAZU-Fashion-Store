import { randomUUID } from "node:crypto";
import morgan from "morgan";
import { logger } from "../config/logger.js";
import { withRequestContext } from "./requestContext.js";

export function requestId(req, res, next) {
  // Generate rather than trust client-supplied correlation identifiers.
  req.requestId = randomUUID();
  res.set("X-Request-ID", req.requestId);
  withRequestContext(req.requestId, next);
}
export const requestLogger = morgan((tokens, req, res) => JSON.stringify({
  requestId: req.requestId,
  method: req.method,
  path: req.path, // excludes query strings, which could contain private data
  status: Number(tokens.status(req, res) || res.statusCode),
  durationMs: Number(tokens["response-time"](req, res) || 0),
}), {
  skip: (req) => req.path === "/api/health",
  stream: { write(line) {
    try { logger.info("http", JSON.parse(line)); }
    catch { /* Logging must never fail a customer request. */ }
  } },
});
