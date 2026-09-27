import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createDatabase } from "./db.js";

export async function migrate(databaseUrl: string) {
  const db = createDatabase(databaseUrl);
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const sql = await readFile(join(here, "..", "migrations", "001_initial.sql"), "utf8");
    await db.query(sql);
  } finally {
    await db.end();
  }
}
