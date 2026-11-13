import test from "node:test";
import assert from "node:assert/strict";
import { findUnexpectedPublicEnvKeys } from "../frontend/vite-env-policy.js";

test("allows only the two intended public variables", () => {
  assert.deepEqual(findUnexpectedPublicEnvKeys(
    { VITE_API_URL: "/api", VITE_GOOGLE_CLIENT_ID: "example" },
    {}
  ), []);
});

test("ignores Vite's synthetic VITE_USER_NODE_ENV", () => {
  assert.deepEqual(findUnexpectedPublicEnvKeys(
    { VITE_API_URL: "/api", VITE_USER_NODE_ENV: "development" },
    { VITE_USER_NODE_ENV: "development" }
  ), []);
});

test("rejects unauthorized VITE_ keys from env files or shell", () => {
  assert.deepEqual(findUnexpectedPublicEnvKeys(
    { VITE_PRIVATE_TOKEN: "sensitive" },
    { VITE_OTHER_SECRET: "sensitive" }
  ).sort(), ["VITE_OTHER_SECRET", "VITE_PRIVATE_TOKEN"]);
});
