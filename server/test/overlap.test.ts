import assert from "node:assert/strict";
import test from "node:test";
import { findPortOverlaps, haversineKm, intersectIntervals, lifecycle, suppressDuringSameShip } from "../src/domain/overlap.js";

const call = (portId: string, start: string, end: string, latitude = 25, longitude = -80) => ({ portId, portName: portId, arrivalAt: new Date(start), departureAt: new Date(end), latitude, longitude });

test("any positive temporal intersection counts, while touching endpoints do not", () => {
  assert.ok(intersectIntervals(new Date("2030-01-01T10:00Z"), new Date("2030-01-01T12:00Z"), new Date("2030-01-01T11:59Z"), new Date("2030-01-01T13:00Z")));
  assert.equal(intersectIntervals(new Date("2030-01-01T10:00Z"), new Date("2030-01-01T12:00Z"), new Date("2030-01-01T12:00Z"), new Date("2030-01-01T13:00Z")), null);
});

test("same-port and nearby-port boundaries follow the configured threshold", () => {
  const a = call("port-a", "2030-01-01T10:00Z", "2030-01-01T14:00Z", 0, 0);
  const same = findPortOverlaps([a], [call("port-a", "2030-01-01T11:00Z", "2030-01-01T12:00Z")]);
  assert.equal(same[0].type, "same_port");
  const nearby = call("port-b", "2030-01-01T11:00Z", "2030-01-01T12:00Z", 0, 0.44);
  assert.ok(haversineKm(a, nearby) < 50);
  assert.equal(findPortOverlaps([a], [nearby], 50)[0].type, "nearby_port");
  assert.equal(findPortOverlaps([a], [nearby], 40).length, 0);
});

test("same-ship intervals suppress redundant ordinary overlaps", () => {
  const ordinary = [{ startsAt: new Date("2030-01-01T10:00Z"), endsAt: new Date("2030-01-01T12:00Z") }];
  assert.equal(suppressDuringSameShip(ordinary, [{ startsAt: new Date("2030-01-01T11:00Z"), endsAt: new Date("2030-01-01T13:00Z") }]).length, 0);
  assert.equal(lifecycle(new Date("2030-01-01"), new Date("2030-01-02"), new Date("2029-01-01")), "future");
});
