export interface ProviderPortCall {
  id: string;
  shipId: string;
  portId: string;
  portName: string;
  countryCode: string;
  arrivalAt: Date;
  departureAt: Date;
  latitude: number;
  longitude: number;
}

export interface CruiseDataProvider {
  readonly name: string;
  getPortCalls(shipId: string, startsAt: Date, endsAt: Date): Promise<ProviderPortCall[]>;
}

export class DeterministicCruiseProvider implements CruiseDataProvider {
  readonly name = "deterministic";

  async getPortCalls(shipId: string, startsAt: Date, endsAt: Date): Promise<ProviderPortCall[]> {
    const ports = [
      ["miami", "Miami", "US", 25.7617, -80.1918],
      ["nassau", "Nassau", "BS", 25.0443, -77.3504],
      ["cococay", "CocoCay", "BS", 25.8173, -77.9386],
    ] as const;
    const calls: ProviderPortCall[] = [];
    const cursor = new Date(startsAt);
    cursor.setUTCHours(8, 0, 0, 0);
    while (cursor <= endsAt) {
      const index = Math.floor(cursor.getTime() / 86400000);
      const port = ports[index % ports.length];
      const departureAt = new Date(cursor.getTime() + 10 * 60 * 60 * 1000);
      calls.push({ id: `${shipId}-${cursor.toISOString().slice(0, 10)}`, shipId, portId: port[0], portName: port[1], countryCode: port[2], arrivalAt: new Date(cursor), departureAt, latitude: port[3], longitude: port[4] });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return calls;
  }
}
