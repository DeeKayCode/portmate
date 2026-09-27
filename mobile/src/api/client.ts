/**
 * PortMate API Client for /api/v1 endpoints adhering to OpenAPI contracts
 */

const API_BASE = '/api/v1';

import type { components } from '../../../contracts/api';
export type ApiProfile = components['schemas']['Profile'];
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
export type ApiNotification = components['schemas']['Notification'];

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

  public async register(email: string, password: string, username: string): Promise<components['schemas']['VerificationPending']> {
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

  public async updateMe(profile: components['schemas']['ProfileUpdate']): Promise<ApiProfile> {
    return this.request('/me', {
      method: 'PATCH',
      body: JSON.stringify(profile),
    });
  }

  // Settings
  public async getSettings(): Promise<ApiSettings> {
    return this.request('/settings');
  }

  public async updateSettings(settings: ApiSettings): Promise<ApiSettings> {
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

  public async poke(overlapId: string): Promise<components['schemas']['MeetingIntent']> {
    return this.request(`/overlaps/${overlapId}/poke`, {
      method: 'POST',
    });
  }

  public async respondToPoke(overlapId: string, status: components['schemas']['MeetingIntentResponse']['status']): Promise<components['schemas']['MeetingIntent']> {
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
