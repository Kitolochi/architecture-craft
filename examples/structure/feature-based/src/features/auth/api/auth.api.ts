import type {
  LoginCredentials,
  AuthResponse,
  MeResponse,
} from '../types/auth.types';

const API_BASE = '/api/v1/auth';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const authApi = {
  login(credentials: LoginCredentials): Promise<AuthResponse> {
    return request(`${API_BASE}/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  logout(): Promise<void> {
    return request(`${API_BASE}/logout`, { method: 'POST' });
  },

  me(): Promise<MeResponse> {
    return request(`${API_BASE}/me`);
  },
};
