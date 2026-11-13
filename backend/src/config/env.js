import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

// Always resolve from the repository root, never the caller's working directory.
// Docker injects explicit service variables; dotenv does not override them.
export const ROOT_ENV_PATH = fileURLToPath(new URL("../../../.env", import.meta.url));
dotenv.config({ path: ROOT_ENV_PATH, override: false, quiet: true });

// One public client ID in root .env drives both browser and server verification.
if (process.env.VITE_GOOGLE_CLIENT_ID?.trim()) {
  if (process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_ID.trim() !== process.env.VITE_GOOGLE_CLIENT_ID.trim())
    throw new Error("Google client ID configuration must match the root public client ID.");
  process.env.GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID.trim();
}
export function checkEnvironment() {
  for (const key of ["MONGODB_URI", "JWT_SECRET"]) {
    if (!process.env[key]) throw new Error(`Set ${key} in the project root .env file.`);
  }
  if (process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.startsWith("replace_")) {
    throw new Error("JWT_SECRET must be a random secret of at least 32 characters.");
  }
  // A Docker-local replica set must never use the Atlas URI from the root file.
  if (process.env.GAZU_DB_MODE === "docker-local" &&
      !/^mongodb:\/\/mongo:27017\//.test(process.env.MONGODB_URI)) {
    throw new Error("Docker-local mode requires the isolated mongo service URI.");
  }
  if (process.env.GAZU_DB_MODE === "atlas" &&
      /^mongodb:\/\/(mongo|localhost|127\.0\.0\.1)(:|\/)/.test(process.env.MONGODB_URI)) {
    throw new Error("Atlas mode cannot point to a local MongoDB server. Check root .env.");
  }
}
