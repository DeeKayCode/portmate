import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from '../src/config.js';
test('Compose may omit optional SMTP configuration using an empty variable',()=>{
  assert.equal(loadConfig({SMTP_URL:''}).SMTP_URL,undefined);
});
