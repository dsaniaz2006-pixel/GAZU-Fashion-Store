import { test } from "node:test";
import assert from "node:assert/strict";
import { allowedBrowserOrigins, isAllowedBrowserOrigin } from "../src/config/allowedOrigins.js";

test("local Vite origin works even when root env keeps Docker origin", () => {
  const env = { NODE_ENV: "development", CLIENT_ORIGIN: "http://localhost:8080", FRONTEND_PORT: "5173" };
  assert.equal(isAllowedBrowserOrigin("http://localhost:5173", env), true);
  assert.equal(isAllowedBrowserOrigin("http://localhost:8080", env), true);
  assert.equal(isAllowedBrowserOrigin("https://attacker.test", env), false);
  assert.equal(isAllowedBrowserOrigin(undefined, env), false);
  assert.equal(isAllowedBrowserOrigin("http://localhost:5173.evil.test", env), false);
});

test("production does not silently allow development origins", () => {
  const env = { NODE_ENV: "production", CLIENT_ORIGIN: "https://shop.example.test", FRONTEND_PORT: "5173" };
  assert.deepEqual([...allowedBrowserOrigins(env)], ["https://shop.example.test"]);
  assert.equal(isAllowedBrowserOrigin("http://localhost:5173", env), false);
  assert.equal(isAllowedBrowserOrigin("https://shop.example.test", env), true);
});

test("Docker-local origin remains valid with explicitly configured client origin", () => {
  const env = { NODE_ENV: "development", CLIENT_ORIGIN: "http://localhost:8080" };
  assert.equal(isAllowedBrowserOrigin("http://localhost:8080", env), true);
});
