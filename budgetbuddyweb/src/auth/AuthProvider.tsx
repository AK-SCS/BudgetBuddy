import { useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '../api/axios';
import { AuthCtx } from './authContext';
import type { User } from './authTypes';
import { jwtDecode } from 'jwt-decode';

type Jwt = { exp?: number; [k: string]: unknown };

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('bb_token'));
  const [user, setUser] = useState<User>(null);

  // ✅ Centralized logout
  const hardLogout = useCallback(() => {
    localStorage.removeItem('bb_token');
    setToken(null);
    setUser(null);
  }, []);

  // ✅ Validate existing token on first load
  useEffect(() => {
    if (!token) return;
    try {
      const payload = jwtDecode<Jwt>(token);
      const exp = payload.exp ? payload.exp * 1000 : 0; // convert seconds → ms
      if (!exp || Date.now() >= exp) {
        // expired or invalid
        hardLogout();
      }
    } catch {
      hardLogout();
    }
  }, [token, hardLogout]);

  // ✅ Login
  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/api/Auth/login', { email, password });
    localStorage.setItem('bb_token', data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  // ✅ Register + auto-login
  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      await api.post('/api/Auth/register', { email, password, fullName });
      await login(email, password);
    },
    [login]
  );

  // ✅ Logout
  const logout = useCallback(() => {
    hardLogout();
  }, [hardLogout]);

  // ✅ Stable context value (fixes ESLint dependency warning)
  const value = useMemo(
    () => ({ user, token, login, register, logout }),
    [user, token, login, register, logout]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
