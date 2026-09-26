import { User, Contract, PortCall, Connection, NotificationItem } from '../types';

const STORAGE_KEYS = {
  USER: 'portmate_user',
  CONTRACTS: 'portmate_contracts',
  CONNECTIONS: 'portmate_connections',
  NOTIFICATIONS: 'portmate_notifications',
};

// Initial Mock Seed Data
const DEFAULT_USER: User = {
  id: 'usr_me',
  email: 'donci@portmate.app',
  username: 'donci',
  displayName: 'Dönci',
  role: 'crew',
  bio: 'Stage Manager & Acoustic Specialist aboard Royal Caribbean',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  nearbyRadiusKm: 50,
  lastActiveAt: 'Active recently',
};

const DEFAULT_CONTRACTS: Contract[] = [
  {
    id: 'cnt_1',
    userId: 'usr_me',
    cruiseLine: 'Royal Caribbean',
    shipName: 'Wonder of the Seas',
    startDate: '2026-10-01',
    endDate: '2027-04-15',
    role: 'Entertainment Crew',
    status: 'active',
  },
  {
    id: 'cnt_2',
    userId: 'usr_me',
    cruiseLine: 'Celebrity Cruises',
    shipName: 'Celebrity Apex',
    startDate: '2027-05-01',
    endDate: '2027-10-30',
    role: 'Stage Technician',
    status: 'upcoming',
  }
];

const DEFAULT_MATES: User[] = [
  {
    id: 'usr_alex',
    email: 'alex@example.com',
    username: 'alex_sea',
    displayName: 'Alex Rivers',
    role: 'crew',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    nearbyRadiusKm: 50,
    lastActiveAt: 'Active 1h ago',
  },
  {
    id: 'usr_maria',
    email: 'maria@example.com',
    username: 'maria_sound',
    displayName: 'Maria Garcia',
    role: 'officer',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    nearbyRadiusKm: 50,
    lastActiveAt: 'Active 3h ago',
  },
  {
    id: 'usr_carlos',
    email: 'carlos@example.com',
    username: 'carlos_bar',
    displayName: 'Carlos Vega',
    role: 'crew',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    nearbyRadiusKm: 50,
    lastActiveAt: 'Active yesterday',
  }
];

const DEFAULT_CONNECTIONS: Connection[] = [
  {
    id: 'conn_1',
    mate: DEFAULT_MATES[0],
    connectedAt: '2026-09-15T10:00:00Z',
    currentPortCity: 'Miami, USA',
    currentShip: 'Wonder of the Seas',
    nextOverlap: 'Same Ship (Oct 1 - Apr 15)',
  },
  {
    id: 'conn_2',
    mate: DEFAULT_MATES[1],
    connectedAt: '2026-09-20T14:30:00Z',
    currentPortCity: 'Nassau, Bahamas',
    currentShip: 'Symphony of the Seas',
    nextOverlap: 'Nassau (Oct 14)',
  },
  {
    id: 'conn_3',
    mate: DEFAULT_MATES[2],
    connectedAt: '2026-09-22T18:00:00Z',
    currentPortCity: 'Cozumel, Mexico',
    currentShip: 'Carnival Celebration',
    nextOverlap: 'Cozumel (Oct 16)',
  }
];

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    type: 'POKE_RECEIVED',
    title: 'Meeting Intent from Alex',
    body: 'Alex expressed interest in meeting during your shared stop in Nassau!',
    read: false,
    createdAt: '2026-09-26T20:00:00Z',
    data: {
      mateId: 'usr_alex',
      mateName: 'Alex Rivers',
      portName: 'Nassau',
      date: 'Oct 14, 2026',
    },
  },
  {
    id: 'notif_2',
    type: 'OVERLAP_FOUND',
    title: 'New Port Overlap Discovered',
    body: 'You and Maria Garcia will both be docked in Cozumel on Oct 16.',
    read: true,
    createdAt: '2026-09-25T11:15:00Z',
    data: {
      mateId: 'usr_maria',
      mateName: 'Maria Garcia',
      portName: 'Cozumel',
      date: 'Oct 16, 2026',
    },
  },
];

export class PortMateStore {
  private user: User;
  private contracts: Contract[];
  private connections: Connection[];
  private notifications: NotificationItem[];
  private listeners: (() => void)[] = [];

  constructor() {
    this.user = this.load(STORAGE_KEYS.USER, DEFAULT_USER);
    this.contracts = this.load(STORAGE_KEYS.CONTRACTS, DEFAULT_CONTRACTS);
    this.connections = this.load(STORAGE_KEYS.CONNECTIONS, DEFAULT_CONNECTIONS);
    this.notifications = this.load(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
  }

  private load<T>(key: string, fallback: T): T {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.user));
      localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(this.contracts));
      localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(this.connections));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
    } catch {
      // ignore storage quota errors in edge contexts
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // User & Profile
  public getUser(): User {
    return this.user;
  }

  public updateUser(partial: Partial<User>) {
    this.user = { ...this.user, ...partial };
    this.save();
  }

  // Contracts
  public getContracts(): Contract[] {
    return [...this.contracts];
  }

  public addContract(contract: Omit<Contract, 'id' | 'userId'>) {
    const newContract: Contract = {
      ...contract,
      id: 'cnt_' + Date.now(),
      userId: this.user.id,
    };
    this.contracts = [newContract, ...this.contracts];
    this.save();
    return newContract;
  }

  public deleteContract(id: string) {
    this.contracts = this.contracts.filter(c => c.id !== id);
    this.save();
  }

  // Connections
  public getConnections(): Connection[] {
    return [...this.connections];
  }

  public addConnectionFromQR(qrData: string): { success: boolean; mate?: User; message: string } {
    // Zero-friction instant connect logic
    let targetUsername = 'new_friend';
    try {
      if (qrData.startsWith('portmate://connect?u=')) {
        const url = new URL(qrData.replace('portmate://', 'http://dummy/'));
        targetUsername = url.searchParams.get('u') || targetUsername;
      } else if (qrData.includes('portmate.app/c/')) {
        targetUsername = qrData.split('portmate.app/c/')[1] || targetUsername;
      } else if (qrData.startsWith('@')) {
        targetUsername = qrData.replace('@', '');
      } else {
        targetUsername = qrData;
      }
    } catch {
      targetUsername = qrData;
    }

    const newMate: User = {
      id: 'usr_' + Date.now(),
      email: `${targetUsername}@cruises.org`,
      username: targetUsername,
      displayName: targetUsername.charAt(0).toUpperCase() + targetUsername.slice(1),
      role: 'crew',
      nearbyRadiusKm: 50,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUsername}`,
      lastActiveAt: 'Active just now',
    };

    const newConnection: Connection = {
      id: 'conn_' + Date.now(),
      mate: newMate,
      connectedAt: new Date().toISOString(),
      currentPortCity: 'San Juan, Puerto Rico',
      currentShip: 'Celebrity Beyond',
      nextOverlap: 'San Juan (Nov 02)',
    };

    this.connections = [newConnection, ...this.connections];
    
    // Add toast notification
    this.notifications = [
      {
        id: 'notif_' + Date.now(),
        type: 'OVERLAP_FOUND',
        title: `Connected with @${targetUsername}!`,
        body: `You are now PortMates with ${newMate.displayName}. Found 2 upcoming port overlaps.`,
        read: false,
        createdAt: new Date().toISOString(),
        data: { mateId: newMate.id, mateName: newMate.displayName }
      },
      ...this.notifications
    ];

    this.save();
    return { success: true, mate: newMate, message: `Connected with @${targetUsername}!` };
  }

  public removeConnection(mateId: string) {
    this.connections = this.connections.filter(c => c.mate.id !== mateId);
    this.save();
  }

  public blockUser(mateId: string) {
    this.removeConnection(mateId);
  }

  // Notifications & Pokes
  public getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  public markNotificationRead(id: string) {
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    this.save();
  }

  public markAllNotificationsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.save();
  }

  public respondToPoke(notificationId: string, response: 'INTERESTED' | 'NOT_INTERESTED') {
    this.notifications = this.notifications.map(n => {
      if (n.id === notificationId) {
        return {
          ...n,
          read: true,
          body: response === 'INTERESTED' 
            ? `You responded "Interested" to ${n.data?.mateName || 'your mate'}. They have been informed!`
            : `You dismissed this meeting reminder.`,
        };
      }
      return n;
    });
    this.save();
  }

  // Itinerary & Overlaps
  public getPortCalls(): PortCall[] {
    return [
      {
        id: 'port_1',
        contractId: 'cnt_1',
        shipName: 'Wonder of the Seas',
        portName: 'Port of Miami (Terminal A)',
        portCity: 'Miami',
        country: 'United States',
        latitude: 25.7743,
        longitude: -80.1937,
        arrivalDate: '2026-10-12T06:00:00Z',
        departureDate: '2026-10-12T17:00:00Z',
        overlaps: [
          {
            id: 'ov_1',
            type: 'same-ship',
            mate: DEFAULT_MATES[0],
            sharedStart: '2026-10-12T06:00:00Z',
            sharedEnd: '2026-10-12T17:00:00Z',
            sharedHours: 11,
            pokeStatus: 'none',
          }
        ]
      },
      {
        id: 'port_2',
        contractId: 'cnt_1',
        shipName: 'Wonder of the Seas',
        portName: 'Prince George Wharf',
        portCity: 'Nassau',
        country: 'Bahamas',
        latitude: 25.0784,
        longitude: -77.3392,
        arrivalDate: '2026-10-14T08:00:00Z',
        departureDate: '2026-10-14T17:30:00Z',
        overlaps: [
          {
            id: 'ov_2',
            type: 'same-port',
            mate: DEFAULT_MATES[1],
            sharedStart: '2026-10-14T09:00:00Z',
            sharedEnd: '2026-10-14T17:00:00Z',
            sharedHours: 8,
            pokeStatus: 'interested',
          }
        ]
      },
      {
        id: 'port_3',
        contractId: 'cnt_1',
        shipName: 'Wonder of the Seas',
        portName: 'Punta Langosta Pier',
        portCity: 'Cozumel',
        country: 'Mexico',
        latitude: 20.5083,
        longitude: -86.9535,
        arrivalDate: '2026-10-16T07:30:00Z',
        departureDate: '2026-10-16T18:00:00Z',
        overlaps: [
          {
            id: 'ov_3',
            type: 'nearby-port',
            distanceKm: 18,
            mate: DEFAULT_MATES[2],
            sharedStart: '2026-10-16T08:00:00Z',
            sharedEnd: '2026-10-16T16:00:00Z',
            sharedHours: 8,
            pokeStatus: 'none',
          }
        ]
      },
      {
        id: 'port_4',
        contractId: 'cnt_1',
        shipName: 'Wonder of the Seas',
        portName: 'Roatán Cruise Port',
        portCity: 'Roatán',
        country: 'Honduras',
        latitude: 16.3278,
        longitude: -86.5378,
        arrivalDate: '2026-10-18T08:00:00Z',
        departureDate: '2026-10-18T16:00:00Z',
        overlaps: []
      }
    ];
  }
}

export const store = new PortMateStore();
