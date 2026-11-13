// Vite's own internal key is not an application-level VITE_ setting.
// The project also validates the root .env explicitly with npm run env:check.
const approved = new Set(["VITE_API_URL", "VITE_GOOGLE_CLIENT_ID"]);
const viteInternals = new Set(["VITE_USER_NODE_ENV"]);

export function findUnexpectedPublicEnvKeys(publicEnv, environment = process.env) {
  const names = new Set([
    ...Object.keys(publicEnv),
    ...Object.keys(environment).filter((key) => key.startsWith("VITE_")),
  ]);
  return [...names].filter((key) => !approved.has(key) && !viteInternals.has(key));
}
