import { useState, useCallback } from 'react';
import { authApi } from '../api/auth.api';
import type { LoginCredentials, AuthUser } from '../types/auth.types';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(credentials);
      setUser(response.user);
      localStorage.setItem('token', response.token);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      localStorage.removeItem('token');
    }
  }, []);

  const checkSession = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await authApi.me();
      setUser(response.user);
    } catch {
      localStorage.removeItem('token');
    }
  }, []);

  return { user, isLoading, error, login, logout, checkSession };
}
