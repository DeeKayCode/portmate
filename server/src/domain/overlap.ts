export interface TimedLocation {
  portId: string;
  portName: string;
  arrivalAt: Date;
  departureAt: Date;
  latitude: number;
  longitude: number;
}

export interface OverlapCandidate {
  type: "same_port" | "nearby_port";
  startsAt: Date;
  endsAt: Date;
  distanceKm: number;
  locations: [TimedLocation, TimedLocation];
}

export function intersectIntervals(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  const startsAt = new Date(Math.max(aStart.getTime(), bStart.getTime()));
  const endsAt = new Date(Math.min(aEnd.getTime(), bEnd.getTime()));
  return startsAt < endsAt ? { startsAt, endsAt } : null;
}

export function haversineKm(a: Pick<TimedLocation, "latitude" | "longitude">, b: Pick<TimedLocation, "latitude" | "longitude">) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371.0088;
  const latitudeDelta = radians(b.latitude - a.latitude);
  const longitudeDelta = radians(b.longitude - a.longitude);
  const h = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function findPortOverlaps(aCalls: TimedLocation[], bCalls: TimedLocation[], thresholdKm = 50): OverlapCandidate[] {
  const result: OverlapCandidate[] = [];
  for (const a of aCalls) {
    for (const b of bCalls) {
      const interval = intersectIntervals(a.arrivalAt, a.departureAt, b.arrivalAt, b.departureAt);
      if (!interval) continue;
      const distanceKm = haversineKm(a, b);
      if (a.portId === b.portId) result.push({ type: "same_port", ...interval, distanceKm: 0, locations: [a, b] });
      else if (distanceKm <= thresholdKm) result.push({ type: "nearby_port", ...interval, distanceKm, locations: [a, b] });
    }
  }
  return result;
}

export function lifecycle(startsAt: Date, endsAt: Date, now = new Date()): "future" | "current" | "expired" {
  if (endsAt <= now) return "expired";
  if (startsAt > now) return "future";
  return "current";
}

export function suppressDuringSameShip<T extends { startsAt: Date; endsAt: Date }>(ordinary: T[], sameShip: T[]) {
  return ordinary.filter((candidate) => !sameShip.some((strong) => intersectIntervals(
    candidate.startsAt, candidate.endsAt, strong.startsAt, strong.endsAt,
  )));
}
