/**
 * PortMate API Client for /api/v1 endpoints adhering to OpenAPI contracts
 */

const API_BASE = '/api/v1';

export interface ApiProfile {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  lastActiveLabel: 'recently' | 'hours_ago' | 'yesterday' | 'older';
}

export interface ApiSession {
  accessToken: string;
  user: ApiProfile;
}

export interface ApiSettings {
  nearbyPortThresholdKm: number;
  emailNotifications: boolean;
}

export interface ApiCompany {
  id: string;
  name: string;
}

export interface ApiShip {
  id: string;
  name: string;
  company: ApiCompany;
}

export interface ApiAssignmentInput {
  companyId: string;
  shipId: string;
  startDate: string;
  endDate: string;
}

export interface ApiAssignment extends ApiAssignmentInput {
  id: string;
  createdAt: string;
}

export interface ApiPortCall {
  portId: string;
  portName: string;
  countryCode?: string;
  arrivalAt: string;
  departureAt: string;
  latitude: number;
  longitude: number;
}

export interface ApiItinerary {
  assignmentId: string;
  portCalls: ApiPortCall[];
  sourceUpdatedAt?: string;
}

export interface ApiConnection {
  id: string;
  profile: ApiProfile;
  createdAt: string;
}

export interface ApiConnectionToken {
  token: string;
  expiresAt: string;
}

export interface ApiOverlap {
  id: string;
  connection: ApiProfile;
  type: 'same_port' | 'nearby_port' | 'same_ship';
  lifecycle: 'future' | 'current' | 'expired';
  startsAt: string;
  endsAt: string;
  portCalls?: ApiPortCall[];
  distanceKm?: number;
  meetingIntent?: {
    status: 'none' | 'poked' | 'interested' | 'not_interested';
    updatedAt?: string;
  };
}

export interface ApiNotification {
  id: string;
  type: 'overlap_upcoming' | 'poke_received' | 'poke_response';
  createdAt: string;
  read: boolean;
  overlapId?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    try {
      this.token = localStorage.getItem('portmate_access_token');
    } catch {
      this.token = null;
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    try {
      if (token) {
        localStorage.setItem('portmate_access_token', token);
      } else {
        localStorage.removeItem('portmate_access_token');
      }
    } catch {
      // ignore in constrained contexts
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        errorMessage = errorJson.detail || errorJson.title || errorMessage;
      } catch {
        // use default message
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Health
  public async getHealth(): Promise<{ status: string; database?: string }> {
    return this.request('/health');
  }

  // Auth
  public async login(email: string, password: string): Promise<ApiSession> {
    const session = await this.request<ApiSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(session.accessToken);
    return session;
  }

  public async register(email: string, password: string, username: string): Promise<{ verificationRequired: boolean }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });
  }

  public async verifyEmail(token: string): Promise<void> {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  public async googleLogin(idToken: string): Promise<ApiSession> {
    const session = await this.request<ApiSession>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    this.setToken(session.accessToken);
    return session;
  }

  // Profile
  public async getMe(): Promise<ApiProfile> {
    return this.request('/me');
  }

  public async updateMe(profile: Partial<{ username: string; displayName: string | null; avatarUrl: string | null }>): Promise<ApiProfile> {
    return this.request('/me', {
      method: 'PATCH',
      body: JSON.stringify(profile),
    });
  }

  // Settings
  public async getSettings(): Promise<ApiSettings> {
    return this.request('/settings');
  }

  public async updateSettings(settings: Partial<ApiSettings>): Promise<ApiSettings> {
    return this.request('/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  // Ships
  public async listCompanies(): Promise<ApiCompany[]> {
    return this.request('/ships/companies');
  }

  public async listShips(companyId?: string): Promise<ApiShip[]> {
    const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    return this.request(`/ships${query}`);
  }

  // Assignments
  public async listAssignments(): Promise<ApiAssignment[]> {
    return this.request('/assignments');
  }

  public async createAssignment(assignment: ApiAssignmentInput): Promise<ApiAssignment> {
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
  }

  public async deleteAssignment(assignmentId: string): Promise<void> {
    return this.request(`/assignments/${assignmentId}`, {
      method: 'DELETE',
    });
  }

  // Itinerary
  public async getItinerary(assignmentId: string): Promise<ApiItinerary> {
    return this.request(`/itinerary?assignmentId=${encodeURIComponent(assignmentId)}`);
  }

  // Connections
  public async listConnections(): Promise<ApiConnection[]> {
    return this.request('/connections');
  }

  public async createQrToken(): Promise<ApiConnectionToken> {
    return this.request('/connections/qr', {
      method: 'POST',
    });
  }

  public async claimToken(token: string): Promise<ApiConnection> {
    return this.request('/connections/claim', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  public async removeConnection(connectionId: string): Promise<void> {
    return this.request(`/connections/${connectionId}`, {
      method: 'DELETE',
    });
  }

  public async blockUser(userId: string): Promise<void> {
    return this.request('/blocks', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Overlaps
  public async listOverlaps(lifecycle?: 'future' | 'current' | 'expired'): Promise<ApiOverlap[]> {
    const query = lifecycle ? `?lifecycle=${lifecycle}` : '';
    return this.request(`/overlaps${query}`);
  }

  public async poke(overlapId: string): Promise<{ status: string; updatedAt: string }> {
    return this.request(`/overlaps/${overlapId}/poke`, {
      method: 'POST',
    });
  }

  public async respondToPoke(overlapId: string, status: 'interested' | 'not_interested'): Promise<{ status: string; updatedAt: string }> {
    return this.request(`/overlaps/${overlapId}/intent`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Notifications
  public async listNotifications(): Promise<ApiNotification[]> {
    return this.request('/notifications');
  }
}

export const apiClient = new ApiClient();
