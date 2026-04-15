// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { saveSession, getToken, getUser, clearSession } from '../services/authStorage';
import { getMe } from "../services/userService";

type AuthContextType = {
  isAuthenticated: boolean;
  user: { uid: string; email: string } | null;
  token: string | null;
  profile: any | null;
  refreshProfile: () => Promise<void>;
  loading: boolean;
  logout: () => Promise<void>;
  setSession: (token: string, user: any) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const profile = await getMe();
    setProfile(profile);
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedToken = await getToken();
        const storedUser = await getUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          setIsAuthenticated(true);
        }
        await refreshProfile();
      } catch (err) {
        console.error('Error cargando sesión inicial', err);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const setSession = async (newToken: string, newUser: any) => {
    await saveSession(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
    await refreshProfile();
  };

  const logout = async () => {
    await clearSession();
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    setProfile(null);
    // navigation.reset(...) si quieres forzar redirect
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, token, loading, logout, profile, refreshProfile, setSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};