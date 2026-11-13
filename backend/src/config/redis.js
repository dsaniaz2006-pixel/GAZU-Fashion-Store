import { createClient } from "redis";
import { logger } from "./logger.js";
let client;
let unavailable = false;
let failureLogged = false;
const enabled = () => Boolean(process.env.REDIS_URL) && process.env.CACHE_ENABLED !== "false" && process.env.NODE_ENV !== "test";
export const redisClient = () => client?.isReady && !unavailable ? client : null;
// Test injection is deliberately disabled outside isolated test processes.
export function setRedisClientForTests(fake) {
  if (process.env.NODE_ENV !== "test") throw new Error("Only available in test mode");
  client = fake;
  unavailable = false;
}
export const redisStatus = () => !enabled() ? "disabled" : redisClient() ? "up" : "down";
export function disableRedisCache() { unavailable = true; }
export async function connectRedis() {
  if (!enabled() || client) return;
  unavailable = true; // Remain bypassed until version fencing succeeds on ready.
  client = createClient({
    url: process.env.REDIS_URL,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 750,
      reconnectStrategy: (retries) => retries > 10 ? false : Math.min(150 * retries, 1500),
    },
  });
  client.on("error", () => {
    unavailable = true;
    if (!failureLogged) logger.warn("Redis unavailable; using MongoDB");
    failureLogged = true;
  });
  client.on("ready", async () => {
    // Version bump hides stale values after a disconnect or uncertain invalidation.
    try {
      await bounded(client.incr("gazu:catalogue:version"));
      unavailable = false;
      failureLogged = false;
      logger.info("Redis catalogue cache ready");
    } catch { unavailable = true; }
  });
  client.on("end", () => { unavailable = true; });
  // Connection is optional. Never hold up API startup waiting for Redis.
  void client.connect().catch(() => { unavailable = true; });
}
export async function bounded(promise) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("Redis operation timeout")), 400);
    })]);
  } finally { clearTimeout(timer); }
}
export async function closeRedis() {
  if (!client) return;
  const previous = client;
  client = undefined;
  unavailable = true;
  try { if (previous.isOpen) await bounded(previous.quit()); }
  catch { previous.destroy(); }
}
