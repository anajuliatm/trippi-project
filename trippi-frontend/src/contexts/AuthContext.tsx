import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getMeRequest,
  loginRequest,
  registerRequest,
} from "../services/authService";
import { TOKEN_STORAGE_KEY } from "../services/api";
import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "../types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persistSession(data: AuthResponse) {
  localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
}

function clearSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const me = await getMeRequest();
        setUser(me);
        setToken(storedToken);
      } catch {
        clearSession();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  async function login(payload: LoginPayload) {
    const data = await loginRequest(payload);

    persistSession(data);
    setToken(data.access_token);
    setUser(data.user);
  }

  async function register(payload: RegisterPayload) {
    const data = await registerRequest(payload);

    persistSession(data);
    setToken(data.access_token);
    setUser(data.user);
  }

  function logout() {
    clearSession();
    setToken(null);
    setUser(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
    }),
    [loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}