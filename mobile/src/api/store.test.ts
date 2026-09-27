import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient } from './client';
import { PortMateStore } from './store';

// Provide robust in-memory mock for localStorage and navigator in Node/Vitest test environment
const storageMock = (() => {
  let memory: Record<string, string> = {};
  return {
    getItem: (key: string) => memory[key] || null,
    setItem: (key: string, value: string) => {
      memory[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete memory[key];
    },
    clear: () => {
      memory = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true,
});

if (typeof navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: true },
    writable: true,
  });
}

describe('ApiClient Unit Tests', () => {
  let client: ApiClient;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    client = new ApiClient();
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    localStorage.clear();
  });

  it('manages bearer authentication tokens and persistence', () => {
    expect(client.getToken()).toBeNull();
    client.setToken('test-token-123');
    expect(client.getToken()).toBe('test-token-123');
    expect(localStorage.getItem('portmate_access_token')).toBe('test-token-123');

    client.logout();
    expect(client.getToken()).toBeNull();
    expect(localStorage.getItem('portmate_access_token')).toBeNull();
  });

  it('does NOT send Content-Type on bodyless POST requests (like poke and createQrToken)', async () => {
    let capturedHeaders: Record<string, string> = {};

    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      return new Response(JSON.stringify({ token: 'tok_123', expiresAt: '2026-10-01T00:00:00Z' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    client.setToken('auth-token-abc');
    await client.createQrToken();

    expect(capturedHeaders['Authorization']).toBe('Bearer auth-token-abc');
    expect(capturedHeaders['Accept']).toBe('application/json');
    expect(capturedHeaders['Content-Type']).toBeUndefined();
  });

  it('sends Content-Type: application/json when body is provided', async () => {
    let capturedHeaders: Record<string, string> = {};

    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      return new Response(JSON.stringify({ id: 'conn_1' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await client.claimToken('claimed-token-123');
    expect(capturedHeaders['Content-Type']).toBe('application/json');
  });

  it('handles 204 No Content and empty 201 response bodies without failing JSON parsing', async () => {
    // 204 No Content
    globalThis.fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 }));
    const deleteRes = await client.deleteAssignment('asgn_1');
    expect(deleteRes).toEqual({});

    // 201 Created with empty body (as returned by POST /blocks)
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response('', {
        status: 201,
        headers: { 'Content-Length': '0' },
      })
    );
    const blockRes = await client.blockUser('usr_blocked');
    expect(blockRes).toEqual({});
  });

  it('clears token on 401 Unauthorized and throws problem detail', async () => {
    client.setToken('expired-token');

    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ title: 'Unauthorized', detail: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/problem+json' },
      })
    );

    await expect(client.getMe()).rejects.toThrow('Session expired');
    expect(client.getToken()).toBeNull();
  });
});

describe('PortMateStore Live Synchronization & Domain Logic', () => {
  let store: PortMateStore;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    originalFetch = globalThis.fetch;
    store = new PortMateStore();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    localStorage.clear();
  });

  it('initializes in unauthenticated state without fake mock user', () => {
    expect(store.isAuthenticated()).toBe(false);
    expect(store.getUser()).toBeNull();
    expect(store.getContracts()).toEqual([]);
    expect(store.getConnections()).toEqual([]);
    expect(store.getPortCalls()).toEqual([]);
  });

  it('authenticates user, stores session, and clears on logout', async () => {
    const mockUser = {
      id: 'usr_real_1',
      username: 'sailor_dan',
      displayName: 'Dan Sailor',
      emailVerified: true,
      lastActiveLabel: 'recently' as const,
    };

    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/auth/login')) {
        return new Response(JSON.stringify({ accessToken: 'jwt_token_123', user: mockUser }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/me')) {
        return new Response(JSON.stringify(mockUser), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });

    const user = await store.login('dan@example.com', 'password123456');
    expect(user.username).toBe('sailor_dan');
    expect(store.isAuthenticated()).toBe(true);

    // Logout
    store.logout();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.getUser()).toBeNull();
    expect(store.getContracts()).toEqual([]);
  });

  it('isolates cache between different user accounts', async () => {
    const userA = { id: 'usr_a', username: 'alice', emailVerified: true };
    const userB = { id: 'usr_b', username: 'bob', emailVerified: true };

    // Simulate user A cache
    localStorage.setItem(
      'portmate_cache_usr_a',
      JSON.stringify({
        user: userA,
        contracts: [{ id: 'cnt_a', userId: 'usr_a', cruiseLine: 'Royal', shipName: 'Ship A', startDate: '2026-10-01', endDate: '2026-10-10', status: 'active' }],
        connections: [],
        notifications: [],
        portCalls: [],
        overlaps: [],
        timestamp: Date.now(),
      })
    );

    // Simulate user B cache
    localStorage.setItem(
      'portmate_cache_usr_b',
      JSON.stringify({
        user: userB,
        contracts: [{ id: 'cnt_b', userId: 'usr_b', cruiseLine: 'Celebrity', shipName: 'Ship B', startDate: '2027-01-01', endDate: '2027-01-10', status: 'upcoming' }],
        connections: [],
        notifications: [],
        portCalls: [],
        overlaps: [],
        timestamp: Date.now(),
      })
    );

    // Simulate session restore for user B
    localStorage.setItem('portmate_access_token', 'token_b');
    localStorage.setItem('portmate_session_user', JSON.stringify(userB));

    const restoredStore = new PortMateStore();
    expect(restoredStore.getUser()?.username).toBe('bob');
    const contracts = restoredStore.getContracts();
    expect(contracts.length).toBe(1);
    expect(contracts[0].id).toBe('cnt_b');
    expect(contracts[0].userId).toBe('usr_b');
  });

  it('syncs assignments and associates overlaps with itinerary port calls', async () => {
    const mockUser = { id: 'usr_sync', username: 'dan', emailVerified: true };
    const mockAssignments = [
      { id: 'asgn_1', companyId: 'royal-caribbean', shipId: 'wonder', startDate: '2026-10-10', endDate: '2026-10-20', createdAt: '2026-09-01T00:00:00Z' },
    ];
    const mockItinerary = {
      assignmentId: 'asgn_1',
      portCalls: [
        {
          portId: 'miami',
          portName: 'Port of Miami',
          countryCode: 'US',
          arrivalAt: '2026-10-12T08:00:00Z',
          departureAt: '2026-10-12T18:00:00Z',
          latitude: 25.77,
          longitude: -80.19,
        },
      ],
    };
    const mockOverlaps = [
      {
        id: 'ov_1',
        connection: { id: 'usr_mate', username: 'sarah', displayName: 'Sarah Ocean', emailVerified: true },
        type: 'same_port' as const,
        lifecycle: 'future' as const,
        startsAt: '2026-10-12T09:00:00Z',
        endsAt: '2026-10-12T17:00:00Z',
        meetingIntent: { status: 'poked' as const },
      },
    ];

    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/auth/login')) return new Response(JSON.stringify({ accessToken: 'tok', user: mockUser }), { status: 200 });
      if (url.includes('/me')) return new Response(JSON.stringify(mockUser), { status: 200 });
      if (url.includes('/assignments')) return new Response(JSON.stringify(mockAssignments), { status: 200 });
      if (url.includes('/itinerary')) return new Response(JSON.stringify(mockItinerary), { status: 200 });
      if (url.includes('/overlaps')) return new Response(JSON.stringify(mockOverlaps), { status: 200 });
      if (url.includes('/connections')) return new Response(JSON.stringify([]), { status: 200 });
      if (url.includes('/notifications')) return new Response(JSON.stringify([]), { status: 200 });
      if (url.includes('/settings')) return new Response(JSON.stringify({ nearbyPortThresholdKm: 50, emailNotifications: true }), { status: 200 });
      return new Response(JSON.stringify([]), { status: 200 });
    });

    await store.login('dan@example.com', 'password123456');

    const portCalls = store.getPortCalls();
    expect(portCalls.length).toBe(1);
    expect(portCalls[0].portName).toBe('Port of Miami');
    expect(portCalls[0].overlaps?.length).toBe(1);

    const overlap = portCalls[0].overlaps![0];
    expect(overlap.id).toBe('ov_1');
    expect(overlap.type).toBe('same-port');
    expect(overlap.mate.displayName).toBe('Sarah Ocean');
    expect(overlap.pokeStatus).toBe('poked');
  });

  it('rejects mutations when offline and preserves stale cache integrity', async () => {
    store.setOfflineStatus(true);

    await expect(
      store.createAssignment({
        companyId: 'royal',
        shipId: 'wonder',
        startDate: '2026-10-01',
        endDate: '2026-10-05',
      })
    ).rejects.toThrow(/Offline/);

    await expect(store.claimConnectionToken('token-123')).rejects.toThrow(/Offline/);
    await expect(store.sendPoke('ov-123')).rejects.toThrow(/Offline/);
  });
});
