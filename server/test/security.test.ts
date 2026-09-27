import assert from "node:assert/strict";
import test from "node:test";
import { opaqueToken, orderedPair, tokenHash } from "../src/security.js";

test("connection tokens are opaque and stored only as hashes", () => {
  const token = opaqueToken();
  assert.ok(token.length >= 40);
  assert.notEqual(tokenHash(token), token);
  assert.equal(tokenHash(token), tokenHash(token));
});

test("connection pairs have a stable canonical order", () => {
  assert.deepEqual(orderedPair("b", "a"), ["a", "b"]);
  assert.deepEqual(orderedPair("a", "b"), ["a", "b"]);
});
