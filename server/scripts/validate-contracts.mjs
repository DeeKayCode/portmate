import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseDocument } from "yaml";

/* global console */

const root = resolve(import.meta.dirname, "../..");
const contracts = resolve(root, "contracts");
const openapi = parseDocument(await readFile(resolve(contracts, "openapi.yaml"), "utf8"));
if (openapi.errors.length) throw new Error(openapi.errors.map(String).join("\\n"));
const api = openapi.toJS();
if (api?.openapi !== "3.1.0" || api?.info?.version !== "1.0.0") throw new Error("OpenAPI baseline version mismatch.");
for (const endpoint of ["/health", "/auth/register", "/assignments", "/overlaps", "/notifications"]) {
  if (!api.paths?.[endpoint]) throw new Error("Required API path missing: " + endpoint);
}
for (const filename of ["models.schema.json", "events.schema.json"]) {
  const schema = JSON.parse(await readFile(resolve(contracts, filename), "utf8"));
  if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") throw new Error(filename + " is not Draft 2020-12.");
}
console.log("Contracts validated.");
