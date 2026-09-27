/* global console, process */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { deriveContracts } from './contract-artifacts.mjs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
const root = resolve(import.meta.dirname, '../..');
const artifacts = await deriveContracts(await readFile(resolve(root, 'contracts/openapi.yaml'), 'utf8'));
const ajv = new Ajv2020({strict:false}); addFormats(ajv);
ajv.compile(JSON.parse(await readFile(resolve(root,'contracts/events.schema.json'),'utf8')));
for (const [path, expected] of Object.entries(artifacts)) {
  const destination = resolve(root, path);
  if (process.argv.includes('--write')) {
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, expected);
  } else {
    const actual = await readFile(destination, 'utf8').catch(() => '');
    if (actual.replaceAll('\r\n', '\n') !== expected) throw new Error(`Stale generated contract: ${path}. Run npm --prefix server run generate:contracts.`);
  }
}
console.log('Canonical OpenAPI and derived contracts are consistent.');
