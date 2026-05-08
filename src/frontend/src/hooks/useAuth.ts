import { ADMIN_CREDENTIALS, AUTH_KEY, type AuthState } from "@/types/guest";
import { useCallback, useEffect, useState } from "react";

function readAuth(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return { isAuthenticated: false, email: null };
    return JSON.parse(raw) as AuthState;
  } catch {
    return { isAuthenticated: false, email: null };
  }
}

function writeAuth(state: AuthState) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(readAuth);

  useEffect(() => {
    const handler = () => setAuthState(readAuth());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const login = useCallback((email: string, password: string): boolean => {
    if (
      email.trim().toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() &&
      password === ADMIN_CREDENTIALS.password
    ) {
      const state: AuthState = { isAuthenticated: true, email: email.trim() };
      writeAuth(state);
      setAuthState(state);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    const state: AuthState = { isAuthenticated: false, email: null };
    writeAuth(state);
    setAuthState(state);
  }, []);

  return {
    isAuthenticated: authState.isAuthenticated,
    email: authState.email,
    login,
    logout,
  };
}
