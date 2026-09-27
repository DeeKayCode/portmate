export type ConnectionType = 'nearby-port' | 'same-port' | 'same-ship';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  role: 'crew' | 'officer' | 'guest' | 'entertainer' | 'other';
  nearbyRadiusKm: number;
  lastActiveAt: string; // e.g., "Active 2h ago" or ISO
}

export interface Contract {
  id: string;
  userId: string;
  cruiseLine: string;
  shipName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  role?: string;
  status: 'active' | 'upcoming' | 'past';
}

export interface PortCall {
  id: string;
  contractId: string;
  shipName: string;
  portName: string;
  portCity: string;
  country: string;
  latitude: number;
  longitude: number;
  arrivalDate: string;   // ISO timestamp
  departureDate: string; // ISO timestamp
  overlaps?: OverlapSummary[];
}

export interface OverlapSummary {
  id: string;
  type: ConnectionType;
  mate: User;
  distanceKm?: number;
  sharedStart: string;
  sharedEnd: string;
  sharedHours: number;
  pokeStatus?: 'none' | 'sent' | 'interested' | 'not_interested';
}

export interface OverlapDetail extends OverlapSummary {
  userPortCall: PortCall;
  matePortCall: PortCall;
}

export interface Connection {
  id: string;
  mate: User;
  connectedAt: string;
  currentPortCity?: string;
  currentShip?: string;
  nextOverlap?: string;
}

export interface NotificationItem {
  id: string;
  type: 'OVERLAP_FOUND' | 'POKE_RECEIVED' | 'POKE_RESPONSE';
  title: string;
  body: string;
  data?: {
    overlapId?: string;
    mateId?: string;
    mateName?: string;
    portName?: string;
    date?: string;
  };
  read: boolean;
  createdAt: string;
}
