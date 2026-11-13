import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
const path = resolve(import.meta.dirname, "../.env");
if (!existsSync(path)) {
  console.error("Missing project root .env. Copy .env.example to .env and fill in credentials.");
  process.exitCode = 1;
} else {
  const keys = readFileSync(path, "utf8").split(/\r?\n/).filter(x => /^\s*[A-Z][A-Z0-9_]*\s*=/.test(x)).map(x => x.split("=")[0].trim());
  const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
  const disallowed = keys.filter(k => k.startsWith("VITE_") && !["VITE_API_URL","VITE_GOOGLE_CLIENT_ID"].includes(k));
  const missing = ["JWT_SECRET","MONGODB_URI","GAZU_DB_MODE"].filter(k => !keys.includes(k));
  if (duplicates.length || disallowed.length || missing.length) {
    if (duplicates.length) console.error("Duplicate keys:", [...new Set(duplicates)].join(", "));
    if (disallowed.length) console.error("Unapproved public keys:", disallowed.join(", "));
    if (missing.length) console.error("Missing required keys:", missing.join(", "));
    process.exitCode = 1;
  } else console.log("Root .env key structure OK (values and remote services NOT verified).");
}
