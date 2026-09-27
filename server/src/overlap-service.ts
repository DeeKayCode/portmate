import { createHash, randomUUID } from "node:crypto";
import { transaction, type Database } from "./db.js";
import { findPortOverlaps, intersectIntervals, type TimedLocation } from "./domain/overlap.js";
import { orderedPair } from "./security.js";

type AssignmentRow = { ship_id: string; start_date: string; end_date: string };
type CallRow = { port_id: string; port_name: string; arrival_at: Date; departure_at: Date; latitude: number; longitude: number };

const fingerprint = (...parts: string[]) => createHash("sha256").update(parts.join("|")).digest("hex");
const timed = (row: CallRow): TimedLocation => ({ portId: row.port_id, portName: row.port_name, arrivalAt: new Date(row.arrival_at), departureAt: new Date(row.departure_at), latitude: Number(row.latitude), longitude: Number(row.longitude) });

export async function rebuildOverlapsForUser(db: Database, userId: string) {
  const peers = await db.query<{ peer_id: string }>(
    `SELECT CASE WHEN user_low = $1 THEN user_high ELSE user_low END AS peer_id
       FROM connections
      WHERE user_low = $1 OR user_high = $1`, [userId],
  );
  for (const { peer_id: peerId } of peers.rows) await rebuildPair(db, userId, peerId);
}

async function rebuildPair(db: Database, firstUserId: string, secondUserId: string) {
  const [userLow, userHigh] = orderedPair(firstUserId, secondUserId);
  await transaction(db, async client => {
    await client.query('SELECT id FROM users WHERE id IN ($1,$2) ORDER BY id FOR UPDATE',[userLow,userHigh]);
    if (!(await client.query('SELECT 1 FROM connections WHERE user_low=$1 AND user_high=$2',[userLow,userHigh])).rowCount) return;
    await rebuildLockedPair(client,userLow,userHigh);
  });
}

async function rebuildLockedPair(db: Database, firstUserId: string, secondUserId: string) {
  const [userLow, userHigh] = orderedPair(firstUserId, secondUserId);
  await db.query('UPDATE overlap_events SET suppressed=true WHERE user_low=$1 AND user_high=$2', [userLow,userHigh]);
  const [firstAssignments, secondAssignments, firstCalls, secondCalls, setting] = await Promise.all([
    db.query<AssignmentRow>("SELECT ship_id, start_date::text, end_date::text FROM assignments WHERE user_id = $1", [firstUserId]),
    db.query<AssignmentRow>("SELECT ship_id, start_date::text, end_date::text FROM assignments WHERE user_id = $1", [secondUserId]),
    callsForUser(db, firstUserId), callsForUser(db, secondUserId),
    db.query<{ nearby_port_threshold_km: number }>("SELECT MAX(nearby_port_threshold_km) nearby_port_threshold_km FROM user_settings WHERE user_id IN ($1,$2)", [firstUserId,secondUserId]),
  ]);
  const sameShip: { startsAt: Date; endsAt: Date }[] = [];
  for (const a of firstAssignments.rows) {
    for (const b of secondAssignments.rows) {
      if (a.ship_id !== b.ship_id) continue;
      const nextDay = (date:string) => new Date(new Date(`${date}T00:00:00Z`).getTime()+86400000);
      const interval = intersectIntervals(new Date(`${a.start_date}T00:00:00Z`), nextDay(a.end_date), new Date(`${b.start_date}T00:00:00Z`), nextDay(b.end_date));
      if (!interval) continue;
      sameShip.push(interval);
      await upsertOverlap(db, { userLow, userHigh, type: "same_ship", ...interval, portCalls: [], distanceKm: null, suppressed: false });
    }
  }
  const threshold = Number(setting.rows[0]?.nearby_port_threshold_km ?? 50);
  for (const candidate of findPortOverlaps(firstCalls.map(timed), secondCalls.map(timed), threshold)) {
    const suppressed = sameShip.some((interval) => intersectIntervals(candidate.startsAt, candidate.endsAt, interval.startsAt, interval.endsAt));
    await upsertOverlap(db, { userLow, userHigh, type: candidate.type, startsAt: candidate.startsAt, endsAt: candidate.endsAt, portCalls: candidate.locations, distanceKm: candidate.distanceKm, suppressed });
  }
}

async function callsForUser(db: Database, userId: string) {
  const result = await db.query<CallRow>(
    `SELECT p.port_id, p.port_name, GREATEST(p.arrival_at,a.start_date::timestamp AT TIME ZONE 'UTC') arrival_at,
            LEAST(p.departure_at,(a.end_date+1)::timestamp AT TIME ZONE 'UTC') departure_at, p.latitude, p.longitude
       FROM assignments a JOIN port_calls p ON p.ship_id = a.ship_id
      WHERE a.user_id = $1 AND p.arrival_at::date <= a.end_date AND p.departure_at::date >= a.start_date`, [userId],
  );
  return result.rows;
}

async function upsertOverlap(db: Database, value: { userLow: string; userHigh: string; type: string; startsAt: Date; endsAt: Date; portCalls: unknown; distanceKm: number | null; suppressed: boolean }) {
  const key = fingerprint(value.userLow, value.userHigh, value.type, value.startsAt.toISOString(), value.endsAt.toISOString());
  await db.query(
    `INSERT INTO overlap_events(id, fingerprint, user_low, user_high, type, starts_at, ends_at, port_calls, distance_km, suppressed)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10)
     ON CONFLICT(fingerprint) DO UPDATE SET port_calls=EXCLUDED.port_calls, distance_km=EXCLUDED.distance_km, suppressed=EXCLUDED.suppressed`,
    [randomUUID(), key, value.userLow, value.userHigh, value.type, value.startsAt, value.endsAt, JSON.stringify(value.portCalls), value.distanceKm, value.suppressed],
  );
}
