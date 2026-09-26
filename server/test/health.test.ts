import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";

test("health endpoint exposes the stable contract baseline", async () => {
  const app = buildApp({ NODE_ENV: "test", PORT: 3000, LOG_LEVEL: "silent" });
  const response = await app.inject({ method: "GET", url: "/api/v1/health" });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: "ok", database: "unknown" });
  await app.close();
});
