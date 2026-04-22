import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { saveSession, getToken, getUser, clearSession } from "../services/authStorage";
import { getMe, UserProfile } from "../services/userService";

type AuthUser = {
  uid: string;
  email: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  loading: boolean;
  logout: () => Promise<void>;
  setSession: (token: string, user: AuthUser) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const storedToken = await getToken();

    if (!storedToken) {
      setProfile(null);
      return;
    }

    try {
      const profileResponse = await getMe();
      setProfile(profileResponse);
    } catch (error) {
      console.warn("No se pudo cargar el perfil:", error);
      setProfile(null);
    }
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
          await refreshProfile();
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setToken(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("Error cargando sesión inicial:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadSession();
  }, []);

  const setSession = async (newToken: string, newUser: AuthUser) => {
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
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        token,
        profile,
        refreshProfile,
        loading,
        logout,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};