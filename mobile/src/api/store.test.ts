import { describe, it, expect, beforeEach } from 'vitest';
import { PortMateStore } from './store';

describe('PortMateStore Domain Logic', () => {
  let store: PortMateStore;

  beforeEach(() => {
    // Reset store before each test
    store = new PortMateStore();
  });

  it('initializes with default user and contracts', () => {
    const user = store.getUser();
    expect(user.username).toBe('donci');
    expect(user.nearbyRadiusKm).toBe(50);

    const contracts = store.getContracts();
    expect(contracts.length).toBeGreaterThanOrEqual(1);
    expect(contracts[0].shipName).toBe('Wonder of the Seas');
  });

  it('adds and deletes a contract', () => {
    const initialCount = store.getContracts().length;
    const added = store.addContract({
      cruiseLine: 'Virgin Voyages',
      shipName: 'Scarlet Lady',
      startDate: '2027-01-10',
      endDate: '2027-06-15',
      role: 'DJ / Entertainment',
      status: 'upcoming',
    });

    expect(added.id).toBeDefined();
    expect(store.getContracts().length).toBe(initialCount + 1);

    store.deleteContract(added.id);
    expect(store.getContracts().length).toBe(initialCount);
  });

  it('establishes immediate two-way connection on QR scan without approval prompts', () => {
    const initialConnections = store.getConnections().length;
    const res = store.addConnectionFromQR('portmate://connect?u=captain_jack');

    expect(res.success).toBe(true);
    expect(res.mate?.username).toBe('captain_jack');
    expect(store.getConnections().length).toBe(initialConnections + 1);

    const connections = store.getConnections();
    const found = connections.find((c) => c.mate.username === 'captain_jack');
    expect(found).toBeDefined();
  });

  it('handles poke / meeting intent response correctly', () => {
    const notifs = store.getNotifications();
    const pokeNotif = notifs.find((n) => n.type === 'POKE_RECEIVED');
    expect(pokeNotif).toBeDefined();

    store.respondToPoke(pokeNotif!.id, 'INTERESTED');
    const updated = store.getNotifications().find((n) => n.id === pokeNotif!.id);
    expect(updated?.read).toBe(true);
    expect(updated?.body).toContain('Interested');
  });

  it('updates user profile settings and nearby radius', () => {
    store.updateUser({
      displayName: 'Captain Dönci',
      nearbyRadiusKm: 75,
    });

    const user = store.getUser();
    expect(user.displayName).toBe('Captain Dönci');
    expect(user.nearbyRadiusKm).toBe(75);
  });
});
