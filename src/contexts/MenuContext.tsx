import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import api from "../config/api";
import { useAuth } from "./AuthContext";

export type MenuTab = {
  key: string;        // nombre de la ruta (ej: "Home")
  label: string;      // texto visible
  icon: string;       // nombre del icon (Ionicons)
  visible: boolean;   // si se muestra
  requiresAuth?: boolean;
  rolesAllowed?: string[];
};

type MenuConfig = {
  tabs: MenuTab[];
};

type MenuContextType = {
  menu: MenuConfig | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const MenuContext = createContext<MenuContextType>({
  menu: null,
  loading: true,
  refresh: async () => {},
});

export function MenuProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, token } = useAuth();

  const [menu, setMenu] = useState<MenuConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!token) {
      setMenu(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await api.get("/ui/menu");
      setMenu(res.data);
    } catch (err) {
      console.warn("Error cargando menú:", err);
      setMenu(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setMenu(null);
      setLoading(false);
      return;
    }

    refresh();
  }, [isAuthenticated]);

  return (
    <MenuContext.Provider value={{ menu, loading, refresh }}>
      {children}
    </MenuContext.Provider>
  );
}

export const useMenu = () => useContext(MenuContext);