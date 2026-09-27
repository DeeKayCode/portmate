import assert from "node:assert/strict";
import test from "node:test";
import type { QueryResult, QueryResultRow } from "pg";
import type { Database } from "../src/db.js";
import { loadConfig } from "../src/config.js";
import { processNotifications } from "../src/notification-service.js";

test("upcoming notification scheduling uses stable duplicate-resistant keys", async () => {
  const calls: unknown[][] = [];
  const db: Database = {
    async query<T extends QueryResultRow>(_text: string, values?: unknown[]) {
      calls.push(values ?? []);
      const rows = calls.length === 1 ? [{ overlap_id: "overlap-1", user_id: "user-1" }] : [];
      return { command: "SELECT", rowCount: rows.length, oid: 0, fields: [], rows: rows as unknown as T[] } satisfies QueryResult<T>;
    },
  };
  await processNotifications(db, loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }));
  assert.equal(calls.length, 2);
  assert.equal(calls[1][3], "upcoming:overlap-1:user-1");
});
