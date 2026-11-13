// Validated runtime configuration uses only environment variables. No secrets
// or database credentials are committed to source code.
export function parsePort(value, fallback = 8000) {
  if (value === undefined || value === null || value === "") return fallback;
  if (!/^\d+$/.test(String(value))) throw new Error("PORT must be an integer from 1 to 65535.");
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT must be an integer from 1 to 65535.");
  return port;
}

export function getRuntimeConfig(env = process.env) {
  return Object.freeze({ port: parsePort(env.PORT) });
}
