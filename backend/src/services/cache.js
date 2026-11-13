import { createHash } from "node:crypto";
import { logger } from "../config/logger.js";
import { bounded, connectRedis, closeRedis, disableRedisCache, redisClient, redisStatus } from "../config/redis.js";
export const connectCache = connectRedis;
export const closeCache = closeRedis;
export const cacheStatus = redisStatus;
const versionKey = "gazu:catalogue:version";
const ttl = () => Math.min(300, Math.max(5, Number(process.env.CACHE_TTL_SECONDS) || 30));
const safeQuery = (query) => Object.fromEntries(Object.entries(query || {}).sort(([a], [b]) => a.localeCompare(b)));
export function productCacheKey(path, query, version) {
  const normalized = JSON.stringify([path, safeQuery(query)]);
  const digest = createHash("sha256").update(normalized).digest("hex");
  return `gazu:products:v${version}:${digest}`;
}
function cacheProblem(operation) { logger.warn("Redis cache bypass", { operation }); }
export async function invalidateProducts() {
  const client = redisClient();
  if (!client) { disableRedisCache(); return; }
  try { await bounded(client.incr(versionKey)); }
  catch { disableRedisCache(); cacheProblem("invalidate"); }
}
export async function cachedProducts(req, res, load) {
  // Only public unauthenticated catalogue requests; no customer-specific data.
  const client = !req.get("authorization") && !req.get("cookie") ? redisClient() : null;
  let key, version;
  if (client) {
    try {
      version = (await bounded(client.get(versionKey))) || "0";
      key = productCacheKey(req.path, req.query, version);
      const value = await bounded(client.get(key));
      if (value) {
        try { return res.set("X-Cache", "HIT").json(JSON.parse(value)); }
        catch { cacheProblem("parse"); }
      }
    } catch { key = null; cacheProblem("read"); }
  }
  const data = await load(); // MongoDB remains the source of truth.
  if (key && redisClient() === client) {
    try {
      // Version-aware writes prevent in-flight stale reads from becoming visible.
      if ((await bounded(client.get(versionKey))) === version) {
        await bounded(client.set(key, JSON.stringify(data), { EX: ttl() }));
      }
    } catch { cacheProblem("write"); }
  }
  return res.set("X-Cache", key ? "MISS" : "BYPASS").json(data);
}
