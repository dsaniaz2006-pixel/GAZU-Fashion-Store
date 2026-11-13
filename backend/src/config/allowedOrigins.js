// Shared, exact-match browser-origin policy for CORS and Google login-CSRF checks.
// Production accepts ONLY the explicitly configured browser origin.
// Local npm development additionally accepts the Vite URL even when the root
// .env still specifies Docker's localhost:8080 origin.
export function allowedBrowserOrigins(env = process.env) {
  const origins = new Set();
  const configured = (env.CLIENT_ORIGIN || "http://localhost:5173").trim();
  if (configured) origins.add(configured.replace(/\/$/, ""));
  if (env.NODE_ENV === "development") {
    const port = Number(env.FRONTEND_PORT || 5173);
    if (Number.isInteger(port) && port >= 1 && port <= 65535) {
      origins.add(`${env.GAZU_HTTPS_ENABLED === "true" ? "https" : "http"}://localhost:${port}`);
    }
  }
  return origins;
}

export function isAllowedBrowserOrigin(origin, env = process.env) {
  return typeof origin === "string" && allowedBrowserOrigins(env).has(origin);
}
