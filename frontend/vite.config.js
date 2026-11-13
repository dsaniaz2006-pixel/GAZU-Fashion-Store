import { readFileSync } from "node:fs";
import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { findUnexpectedPublicEnvKeys } from "./vite-env-policy.js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export default defineConfig(({ mode }) => {
  // Vite reads root .env. Only explicitly approved VITE_ names can enter bundles.
  const configEnv = loadEnv(mode, projectRoot, "");
  const publicEnv = loadEnv(mode, projectRoot, "VITE_");
  // Vite may synthesize VITE_USER_NODE_ENV when loading NODE_ENV.
  // Only the explicit envPrefix entries may enter the client bundle.
  const unexpected = findUnexpectedPublicEnvKeys(publicEnv, process.env);
  if (unexpected.length) {
    throw new Error(`Unapproved public Vite environment variables: ${unexpected.join(", ")}. Remove them from the root .env.`);
  }
  const useHttps = configEnv.GAZU_HTTPS_ENABLED === "true";
  const https = useHttps ? {
    key: readFileSync(configEnv.GAZU_TLS_KEY_FILE || resolve(projectRoot, "certs/localhost-key.pem")),
    cert: readFileSync(configEnv.GAZU_TLS_CERT_FILE || resolve(projectRoot, "certs/localhost.pem")),
  } : undefined;
  return {
    envDir: projectRoot,
    envPrefix: ["VITE_API_URL", "VITE_GOOGLE_CLIENT_ID"],
    plugins: [react(), tailwindcss()],
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/tests/setup.js",
      // Node's `node:test` .mjs files run in a separate, explicit test command.
      // Including them in Vitest reports bogus "No test suite found" failures.
      include: ["src/tests/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    },
    server: {
      host: "127.0.0.1",
      https,
      port: Number(configEnv.FRONTEND_PORT || 5173),
      strictPort: true,
      proxy: {
        "/api": configEnv.API_PROXY_TARGET || (useHttps ? "https://localhost:8000" : "http://127.0.0.1:8000"),
        "/uploads": configEnv.API_PROXY_TARGET || (useHttps ? "https://localhost:8000" : "http://127.0.0.1:8000"),
      },
    },
  };
});
