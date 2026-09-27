import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";

test("health endpoint exposes the stable contract baseline", async () => {
  const app = buildApp(loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }));
  const response = await app.inject({ method: "GET", url: "/api/v1/health" });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: "ok", database: "unknown" });
  await app.close();
});
