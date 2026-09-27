import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";

test("protected endpoints reject missing bearer authentication", async () => {
  const app = buildApp(loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }));
  const response = await app.inject({ method: "GET", url: "/api/v1/me" });
  assert.equal(response.statusCode, 401);
  await app.close();
});

test("registration validates email, username and password boundaries", async () => {
  const app = buildApp(loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }));
  const response = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { email: "bad", username: "!", password: "short" } });
  assert.equal(response.statusCode, 422);
  await app.close();
});
