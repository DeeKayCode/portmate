import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { newDb } from "pg-mem";

test("initial migration creates the durable domain tables", async () => {
  const sql = await readFile(new URL("../../migrations/001_initial.sql", import.meta.url), "utf8");
  const memory = newDb();
  memory.public.none(sql);
  const tables = (memory.public.many("SELECT table_name FROM information_schema.tables WHERE table_schema='public'") as { table_name: string }[]).map((item) => item.table_name);
  for (const table of ["users", "assignments", "connections", "blocks", "overlap_events", "notifications"]) assert.ok(tables.includes(table), `missing ${table}`);
});
