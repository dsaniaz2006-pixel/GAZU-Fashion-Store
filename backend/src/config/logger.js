import winston from "winston";
import { currentRequestId } from "../middleware/requestContext.js";

const sensitive = /(credential|nonce|recovery|googleSub|password|secret|token|authorization|cookie|otp|email|address|phone|mongodb_uri|redis_url)/i;
function scrub(data, depth = 0) {
  if (depth > 5) return "[REDACTED]";
  if (Array.isArray(data)) return data.map((x) => scrub(x, depth + 1));
  if (data && typeof data === "object") {
    if (data instanceof Error) return { name: data.name, message: "[REDACTED]" };
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, sensitive.test(k) ? "[REDACTED]" : scrub(v, depth + 1)]));
  }
  if (typeof data === "string") return data.replace(/(mongodb(?:\+srv)?:\/\/|redis(?:s)?:\/\/)[^\s"']+/gi, "[REDACTED_URL]");
  return data;
}
export const sanitizeLog = scrub;
const withContext = winston.format((info) => {
  const requestId = currentRequestId();
  const safe = scrub({ ...info, ...(requestId && !info.requestId ? { requestId } : {}) });
  Object.keys(info).forEach((key) => delete info[key]);
  Object.assign(info, safe);
  return info;
});
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(withContext(), winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
  silent: process.env.NODE_ENV === "test",
});
