import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../services/auth';
import { authService } from '../services/auth';

// ─────────────────────────────────────────────────────────────────────────────
// AUTH_BYPASS — When VITE_AUTH_BYPASS=true the AuthContext immediately
// resolves with loading=false and isAuthenticated=true so the app renders
// without waiting for the backend. Token/user remain null in this mode.
//
// Backend security is NOT affected — JWT middleware still enforces auth on
// every API call. Pages that need the API will show demo/error states.
// ─────────────────────────────────────────────────────────────────────────────
const AUTH_BYPASS = import.meta.env.VITE_AUTH_BYPASS === 'true';

interface AuthContextType {
  user: User | null;
  business: { id: string; name: string; defaultDuePeriod?: number } | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User, business: any) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [business, setBusiness] = useState<any | null>(null);
  const [token, setToken]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(!AUTH_BYPASS); // skip loading in bypass

  useEffect(() => {
    if (AUTH_BYPASS) return; // don't touch the backend in preview mode

    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      authService.getMe()
        .then((data) => {
          if (data) {
            setToken(storedToken);
            setUser(data.user);
            setBusiness(data.business);
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      setBusiness(null);
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, []);

  const login = (newToken: string, newUser: User, newBusiness: any) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    setBusiness(newBusiness);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setBusiness(null);
  };

  // In bypass mode: treat as authenticated so ProtectedRoute passes through.
  const isAuthenticated = AUTH_BYPASS ? true : !!token;

  return (
    <AuthContext.Provider value={{ user, business, token, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
