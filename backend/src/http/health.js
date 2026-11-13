import mongoose from "mongoose";
import { cacheStatus } from "../services/cache.js";

// Pure health summary is testable without starting Express or connecting Atlas.
export function healthSummary(mongoConnected, redisStatus) {
  return {
    status: mongoConnected ? "ok" : "unavailable",
    mongo: mongoConnected ? "up" : "down",
    redis: redisStatus,
  };
}

export function healthHandler(_req, res) {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json(healthSummary(connected, cacheStatus()));
}
