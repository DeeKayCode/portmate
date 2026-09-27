import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { newDb } from "pg-mem";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import type { Database } from "../src/db.js";

test("email accounts cannot log in until a one-time verification token is consumed", async () => {
  const sql = await readFile(new URL("../../migrations/001_initial.sql", import.meta.url), "utf8");
  const memory = newDb(); memory.public.none(sql);
  const { Pool } = memory.adapters.createPg(); const pool = new Pool();
  const app = buildApp(loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }), pool as unknown as Database);
  const credentials = { email: "sailor@example.com", username: "sailor_1", password: "correct horse battery staple" };
  const registration = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: credentials });
  assert.equal(registration.statusCode, 202);
  const token = registration.headers["x-portmate-test-verification-token"];
  assert.equal(typeof token, "string");
  const earlyLogin = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: credentials.email, password: credentials.password } });
  assert.equal(earlyLogin.statusCode, 403);
  const verification = await app.inject({ method: "POST", url: "/api/v1/auth/verify-email", payload: { token } });
  assert.equal(verification.statusCode, 204);
  const login = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: credentials.email, password: credentials.password } });
  assert.equal(login.statusCode, 200);
  assert.equal(typeof login.json().accessToken, "string");
  await app.close(); await pool.end();
});
