"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface LoginResponse {
  user: AuthUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    try {
      const user = await api<AuthUser>("/auth/me", {
        allowUnauthenticated: true,
      });
      setState({ user, loading: false });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setState({ user: null, loading: false });
        return;
      }
      setState({ user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user } = await api<LoginResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setState({ user, loading: false });
      return user;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // ignore — logging out should never throw to the UI
    }
    setState({ user: null, loading: false });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, refresh, login, logout }),
    [state, refresh, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
