import { User, Contract, PortCall, Connection, NotificationItem, OverlapSummary } from '../types';
import {
  apiClient,
  ApiProfile,
  ApiAssignment,
  ApiAssignmentInput,
  ApiConnection,
  ApiNotification,
  ApiOverlap,
  ApiSettings,
  ApiCompany,
  ApiShip,
  ApiProfileUpdate,
  ApiMeetingIntentResponse,
} from './client';

export interface UserCacheData {
  user: User;
  contracts: Contract[];
  connections: Connection[];
  notifications: NotificationItem[];
  portCalls: PortCall[];
  overlaps: ApiOverlap[];
  settings?: ApiSettings;
  timestamp: number;
}

function mapProfile(apiProfile: ApiProfile): User {
  const labelMap: Record<string, string> = {
    recently: 'Active recently',
    hours_ago: 'Active a few hours ago',
    yesterday: 'Active yesterday',
    older: 'Active earlier this week',
  };
  return {
    id: apiProfile.id,
    email: undefined,
    username: apiProfile.username,
    displayName: apiProfile.displayName || apiProfile.username,
    avatarUrl: apiProfile.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(apiProfile.username)}`,
    nearbyRadiusKm: 50,
    lastActiveAt: apiProfile.lastActiveLabel ? labelMap[apiProfile.lastActiveLabel] : undefined,
    emailVerified: apiProfile.emailVerified,
  };
}

export class PortMateStore {
  private user: User | null = null;
  private contracts: Contract[] = [];
  private connections: Connection[] = [];
  private notifications: NotificationItem[] = [];
  private portCalls: PortCall[] = [];
  private overlaps: ApiOverlap[] = [];
  private settings: ApiSettings | null = null;
  private companies: ApiCompany[] = [];
  private ships: ApiShip[] = [];

  private isOffline = !navigator.onLine;
  private isStale = false;
  private isLoading = false;
  private listeners: (() => void)[] = [];

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    try {
      const token = apiClient.getToken();
      if (!token) {
        this.clearSessionState();
        return;
      }

      const storedUserJson = localStorage.getItem('portmate_session_user');
      if (storedUserJson) {
        this.user = JSON.parse(storedUserJson);
        if (this.user?.id) {
          this.loadCachedData(this.user.id);
        }
      }
    } catch {
      this.clearSessionState();
    }
  }

  private loadCachedData(userId: string) {
    try {
      const cached = localStorage.getItem(`portmate_cache_${userId}`);
      if (cached) {
        const data: UserCacheData = JSON.parse(cached);
        this.contracts = data.contracts || [];
        this.connections = data.connections || [];
        this.notifications = data.notifications || [];
        this.portCalls = data.portCalls || [];
        this.overlaps = data.overlaps || [];
        if (data.settings) this.settings = data.settings;
        this.isStale = true;
      }
    } catch {
      // ignore corrupt cache
    }
  }

  private saveCache() {
    if (!this.user?.id) return;
    try {
      localStorage.setItem('portmate_session_user', JSON.stringify(this.user));
      const cacheData: UserCacheData = {
        user: this.user,
        contracts: this.contracts,
        connections: this.connections,
        notifications: this.notifications,
        portCalls: this.portCalls,
        overlaps: this.overlaps,
        settings: this.settings || undefined,
        timestamp: Date.now(),
      };
      localStorage.setItem(`portmate_cache_${this.user.id}`, JSON.stringify(cacheData));
    } catch {
      // ignore storage quota errors
    }
    this.notify();
  }

  private clearSessionState() {
    this.user = null;
    this.contracts = [];
    this.connections = [];
    this.notifications = [];
    this.portCalls = [];
    this.overlaps = [];
    this.settings = null;
    this.isStale = false;
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // Getters
  public isAuthenticated(): boolean {
    return !!apiClient.getToken() && !!this.user;
  }

  public getUser(): User | null {
    return this.user;
  }

  public getContracts(): Contract[] {
    return this.contracts;
  }

  public getConnections(): Connection[] {
    return this.connections;
  }

  public getNotifications(): NotificationItem[] {
    return this.notifications;
  }

  public getPortCalls(): PortCall[] {
    return this.portCalls;
  }

  public getOverlaps(): ApiOverlap[] {
    return this.overlaps;
  }

  public getSettings(): ApiSettings | null {
    return this.settings;
  }

  public getCompanies(): ApiCompany[] {
    return this.companies;
  }

  public getShips(): ApiShip[] {
    return this.ships;
  }

  public getIsOffline(): boolean {
    return this.isOffline;
  }

  public getIsStale(): boolean {
    return this.isStale;
  }

  public getIsLoading(): boolean {
    return this.isLoading;
  }

  public setOfflineStatus(offline: boolean) {
    this.isOffline = offline;
    this.notify();
  }

  // Auth Operations
  public async login(email: string, password: string): Promise<User> {
    this.isLoading = true;
    this.notify();
    try {
      const session = await apiClient.login(email, password);
      this.user = mapProfile(session.user);
      this.clearSessionState();
      this.user = mapProfile(session.user);
      await this.syncFromServer();
      return this.user;
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  public async register(email: string, password: string, username: string) {
    return apiClient.register(email, password, username);
  }

  public async verifyEmail(token: string) {
    return apiClient.verifyEmail(token);
  }

  public async googleLogin(idToken: string): Promise<User> {
    this.isLoading = true;
    this.notify();
    try {
      const session = await apiClient.googleLogin(idToken);
      this.clearSessionState();
      this.user = mapProfile(session.user);
      await this.syncFromServer();
      return this.user;
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  public logout() {
    const oldUserId = this.user?.id;
    apiClient.logout();
    this.clearSessionState();
    try {
      localStorage.removeItem('portmate_session_user');
      if (oldUserId) {
        localStorage.removeItem(`portmate_cache_${oldUserId}`);
      }
    } catch {
      // ignore
    }
    this.notify();
  }

  // Profile & Settings
  public async updateUser(partial: ApiProfileUpdate): Promise<void> {
    if (this.isOffline) throw new Error('Offline: cannot update profile while disconnected.');
    const updated = await apiClient.updateMe(partial);
    if (this.user) {
      this.user = {
        ...this.user,
        username: updated.username,
        displayName: updated.displayName || updated.username,
        avatarUrl: updated.avatarUrl || this.user.avatarUrl,
      };
      this.saveCache();
    }
  }

  public async updateSettings(settings: Partial<ApiSettings>): Promise<void> {
    if (this.isOffline) throw new Error('Offline: cannot update settings while disconnected.');
    const updated = await apiClient.updateSettings(settings);
    this.settings = updated;
    if (this.user && updated.nearbyPortThresholdKm != null) {
      this.user.nearbyRadiusKm = updated.nearbyPortThresholdKm;
    }
    this.saveCache();
  }

  // Server Synchronization
  public async syncFromServer(): Promise<boolean> {
    if (!apiClient.getToken()) {
      return false;
    }

    try {
      this.isLoading = true;
      this.notify();

      // 1. Fetch current profile
      const me = await apiClient.getMe();
      this.user = mapProfile(me);

      // 2. Fetch settings
      try {
        const settings = await apiClient.getSettings();
        this.settings = settings;
        if (settings?.nearbyPortThresholdKm) {
          this.user.nearbyRadiusKm = settings.nearbyPortThresholdKm;
        }
      } catch {
        // settings might fail gracefully
      }

      // 3. Fetch catalog
      try {
        const [comps, shps] = await Promise.all([
          apiClient.listCompanies(),
          apiClient.listShips(),
        ]);
        this.companies = comps || [];
        this.ships = shps || [];
      } catch {
        // catalog failure handled gracefully
      }

      // 4. Fetch assignments
      const assignments = await apiClient.listAssignments();
      const rawAssignments = assignments || [];
      this.contracts = rawAssignments.map((a: ApiAssignment) => ({
        id: a.id,
        userId: this.user!.id,
        cruiseLine: a.companyId,
        shipName: a.shipId,
        startDate: a.startDate,
        endDate: a.endDate,
        status: new Date(a.endDate) < new Date() ? 'past' : new Date(a.startDate) <= new Date() ? 'active' : 'upcoming',
      }));

      // 5. Fetch overlaps
      const rawOverlaps = await apiClient.listOverlaps();
      this.overlaps = rawOverlaps || [];

      // 6. Fetch connections
      const rawConnections = await apiClient.listConnections();
      this.connections = (rawConnections || []).map((c: ApiConnection) => ({
        id: c.id,
        mate: mapProfile(c.profile),
        connectedAt: c.createdAt,
      }));

      // 7. Fetch itineraries for all assignments
      const itineraryPortCalls: PortCall[] = [];
      for (const assignment of rawAssignments) {
        try {
          const itin = await apiClient.getItinerary(assignment.id);
          if (itin?.portCalls && itin.portCalls.length > 0) {
            // Find ship name from catalog if possible
            const matchedShip = this.ships.find((s) => s.id === assignment.shipId);
            const displayShip = matchedShip ? matchedShip.name : assignment.shipId;

            for (const pc of itin.portCalls) {
              // Find matching overlaps for this port call
              const matchingOverlaps: OverlapSummary[] = [];

              for (const ov of this.overlaps) {
                const ovStart = new Date(ov.startsAt).getTime();
                const ovEnd = new Date(ov.endsAt).getTime();
                const pcStart = new Date(pc.arrivalAt).getTime();
                const pcEnd = new Date(pc.departureAt).getTime();

                // Check overlap time window intersection
                const hasTimeOverlap = Math.max(ovStart, pcStart) < Math.min(ovEnd, pcEnd);

                if (hasTimeOverlap) {
                  const sharedStart = new Date(Math.max(ovStart, pcStart)).toISOString();
                  const sharedEnd = new Date(Math.min(ovEnd, pcEnd)).toISOString();
                  const sharedHours = Math.max(1, Math.round((new Date(sharedEnd).getTime() - new Date(sharedStart).getTime()) / (1000 * 60 * 60)));

                  matchingOverlaps.push({
                    id: ov.id,
                    type: ov.type === 'same_ship' ? 'same-ship' : ov.type === 'same_port' ? 'same-port' : 'nearby-port',
                    mate: mapProfile(ov.connection),
                    distanceKm: ov.distanceKm,
                    sharedStart,
                    sharedEnd,
                    sharedHours,
                    pokeStatus: ov.meetingIntent?.status || 'none',
                    lifecycle: ov.lifecycle,
                  });
                }
              }

              itineraryPortCalls.push({
                id: `${assignment.id}_${pc.portId}_${pc.arrivalAt}`,
                contractId: assignment.id,
                shipName: displayShip,
                portName: pc.portName,
                portCity: pc.portName.split(',')[0].trim(),
                country: pc.countryCode || '',
                latitude: pc.latitude,
                longitude: pc.longitude,
                arrivalDate: pc.arrivalAt,
                departureDate: pc.departureAt,
                overlaps: matchingOverlaps,
              });
            }
          }
        } catch {
          // Itinerary fetch failure handled gracefully
        }
      }

      // Sort port calls by arrival date
      itineraryPortCalls.sort((a, b) => new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime());
      this.portCalls = itineraryPortCalls;

      // 8. Fetch notifications
      const rawNotifs = await apiClient.listNotifications();
      this.notifications = (rawNotifs || []).map((n: ApiNotification) => {
        let title = 'PortMate Notification';
        let body = 'You have a new update.';
        const associatedOverlap = n.overlapId ? this.overlaps.find((o) => o.id === n.overlapId) : undefined;
        const mateName = associatedOverlap ? (associatedOverlap.connection.displayName || associatedOverlap.connection.username) : 'A PortMate';

        if (n.type === 'poke_received') {
          title = `Meeting Intent from ${mateName}`;
          body = `${mateName} wants to know if you'd like to meet up during your shared cruise stop!`;
        } else if (n.type === 'poke_response') {
          title = `Response from ${mateName}`;
          body = associatedOverlap?.meetingIntent?.status === 'interested'
            ? `${mateName} is also interested in meeting up!`
            : `${mateName} responded to your meeting request.`;
        } else if (n.type === 'overlap_upcoming') {
          title = `Upcoming Overlap with ${mateName}`;
          body = `You and ${mateName} will cross paths soon!`;
        }

        return {
          id: n.id,
          type: n.type === 'poke_received' ? 'POKE_RECEIVED' : n.type === 'poke_response' ? 'POKE_RESPONSE' : 'OVERLAP_FOUND',
          title,
          body,
          read: n.read,
          createdAt: n.createdAt,
          data: {
            overlapId: n.overlapId,
            mateName,
          },
        };
      });

      this.isStale = false;
      this.isOffline = false;
      this.saveCache();
      return true;
    } catch {
      // In offline / network failure mode, load from cache and mark stale
      this.isOffline = true;
      if (this.user?.id) {
        this.loadCachedData(this.user.id);
      }
      return false;
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  // Assignment Mutations
  public async createAssignment(assignment: ApiAssignmentInput): Promise<void> {
    if (this.isOffline) throw new Error('Offline: cannot add sailings while disconnected.');
    await apiClient.createAssignment(assignment);
    await this.syncFromServer();
  }

  public async updateAssignment(assignmentId: string, assignment: ApiAssignmentInput): Promise<void> {
    if (this.isOffline) throw new Error('Offline: cannot update sailing while disconnected.');
    await apiClient.updateAssignment(assignmentId, assignment);
    await this.syncFromServer();
  }

  public async deleteAssignment(assignmentId: string): Promise<void> {
    if (this.isOffline) throw new Error('Offline: cannot delete sailing while disconnected.');
    await apiClient.deleteAssignment(assignmentId);
    await this.syncFromServer();
  }

  // Connection & QR Mutations
  public async createQrToken() {
    if (this.isOffline) throw new Error('Offline: cannot mint connection tokens while disconnected.');
    return apiClient.createQrToken();
  }

  public async claimConnectionToken(token: string): Promise<void> {
    if (this.isOffline) throw new Error('Offline: cannot connect with PortMates while disconnected.');
    await apiClient.claimToken(token.trim());
    await this.syncFromServer();
  }

  public async removeConnection(connectionId: string): Promise<void> {
    if (this.isOffline) throw new Error('Offline: cannot remove connections while disconnected.');
    await apiClient.removeConnection(connectionId);
    await this.syncFromServer();
  }

  public async blockUser(userId: string): Promise<void> {
    if (this.isOffline) throw new Error('Offline: cannot block users while disconnected.');
    await apiClient.blockUser(userId);
    await this.syncFromServer();
  }

  // Meeting Intent & Pokes
  public async sendPoke(overlapId: string): Promise<void> {
    if (this.isOffline) throw new Error('Offline: cannot send pokes while disconnected.');
    await apiClient.poke(overlapId);
    await this.syncFromServer();
  }

  public async respondToPoke(overlapId: string, status: ApiMeetingIntentResponse['status']): Promise<void> {
    if (this.isOffline) throw new Error('Offline: cannot respond to pokes while disconnected.');
    await apiClient.respondToPoke(overlapId, status);
    await this.syncFromServer();
  }
}

export const store = new PortMateStore();
