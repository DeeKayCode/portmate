/**
 * PortMate API Client for /api/v1 endpoints adhering strictly to canonical OpenAPI contracts
 */

const API_BASE = '/api/v1';

import type { components } from '../../../contracts/api';

export type ApiProfile = components['schemas']['Profile'];
export type ApiProfileUpdate = components['schemas']['ProfileUpdate'];
export type ApiSession = components['schemas']['Session'];
export type ApiSettings = components['schemas']['Settings'];
export type ApiCompany = components['schemas']['CruiseCompany'];
export type ApiShip = components['schemas']['Ship'];
export type ApiAssignmentInput = components['schemas']['AssignmentInput'];
export type ApiAssignment = components['schemas']['Assignment'];
export type ApiPortCall = components['schemas']['PortCall'];
export type ApiItinerary = components['schemas']['Itinerary'];
export type ApiConnection = components['schemas']['Connection'];
export type ApiConnectionToken = components['schemas']['ConnectionToken'];
export type ApiOverlap = components['schemas']['Overlap'];
export type ApiMeetingIntent = components['schemas']['MeetingIntent'];
export type ApiMeetingIntentResponse = components['schemas']['MeetingIntentResponse'];
export type ApiNotification = components['schemas']['Notification'];
export type ApiVerificationPending = components['schemas']['VerificationPending'];

export class ApiClient {
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
    if (!this.token) {
      try {
        this.token = localStorage.getItem('portmate_access_token');
      } catch {
        this.token = null;
      }
    }
    return this.token;
  }

  public logout() {
    this.setToken(null);
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    // CRITICAL: Only set Content-Type if there is an actual request body!
    // Fastify rejects requests with Content-Type: application/json when body is empty.
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token && !headers['Authorization']) {
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
        // use default status message
      }

      if (response.status === 401) {
        // Clear invalid/expired token
        this.setToken(null);
      }

      throw new Error(errorMessage);
    }

    // Handle empty response bodies (204 No Content, 201 Created with empty body, Content-Length: 0)
    if (response.status === 204) {
      return {} as T;
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') {
      return {} as T;
    }

    const text = await response.text();
    if (!text || text.trim() === '') {
      return {} as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return {} as T;
    }
  }

  // Health
  public async getHealth(): Promise<components['schemas']['Health']> {
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

  public async register(email: string, password: string, username: string): Promise<ApiVerificationPending> {
    return this.request<ApiVerificationPending>('/auth/register', {
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

  public async updateMe(profile: ApiProfileUpdate): Promise<ApiProfile> {
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

  // Ships & Companies
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

  public async updateAssignment(assignmentId: string, assignment: ApiAssignmentInput): Promise<ApiAssignment> {
    return this.request(`/assignments/${assignmentId}`, {
      method: 'PATCH',
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
    // Bodyless POST request
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
    // Body has { userId }, returns 201 with no body
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

  public async poke(overlapId: string): Promise<ApiMeetingIntent> {
    // Bodyless POST request
    return this.request(`/overlaps/${overlapId}/poke`, {
      method: 'POST',
    });
  }

  public async respondToPoke(overlapId: string, status: ApiMeetingIntentResponse['status']): Promise<ApiMeetingIntent> {
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
