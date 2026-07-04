"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * Auth state provider — three explicit session states:
 *   guest   -> unauthenticated; navbar shows Log In / Sign Up
 *   diner   -> authenticated User account (consumer dashboard)
 *   cook    -> authenticated Business account (kitchen dashboard)
 *
 * Mock credentials: login is an email lookup against the database (no
 * passwords in the MVP); signup writes a real User (+ CookProfile for
 * kitchens). The session email persists in localStorage and is re-validated
 * against the API on mount, so state changes never need a hard refresh.
 */

export interface SessionAddress {
  label: string;
  line1: string;
  city: string;
  isDefault: boolean;
}

export interface SessionUser {
  id: string;
  key: string;
  name: string;
  email: string;
  role: "diner" | "cook";
  addresses: SessionAddress[];
  favoriteCookIds: string[];
  cookProfileId: string | null;
  kitchenName: string | null;
  joinedAt: string | null;
}

export type AuthStatus = "loading" | "guest" | "authed";
export type AuthModalMode = "login" | "signup" | null;

export interface SignupInput {
  name: string;
  email: string;
  role: "diner" | "cook";
  kitchenName?: string;
  locationLabel?: string;
}

interface AuthContextValue {
  status: AuthStatus;
  user: SessionUser | null;
  /** Returns an error message, or null on success. */
  login: (email: string) => Promise<string | null>;
  signup: (input: SignupInput) => Promise<string | null>;
  logout: () => void;
  toggleFavorite: (cookId: string) => Promise<void>;
  authModal: AuthModalMode;
  openAuth: (mode: Exclude<AuthModalMode, null>) => void;
  closeAuth: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  status: "loading",
  user: null,
  login: async () => "Auth not ready",
  signup: async () => "Auth not ready",
  logout: () => {},
  toggleFavorite: async () => {},
  authModal: null,
  openAuth: () => {},
  closeAuth: () => {},
});

const STORAGE_KEY = "fablefare.auth.email";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authModal, setAuthModal] = useState<AuthModalMode>(null);

  const applySession = useCallback((u: SessionUser) => {
    setUser(u);
    setStatus("authed");
    localStorage.setItem(STORAGE_KEY, u.email);
  }, []);

  const login = useCallback(
    async (email: string): Promise<string | null> => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const json = await res.json();
        if (!res.ok) return json.error ?? "Login failed";
        applySession(json.user);
        return null;
      } catch {
        return "Network error — is the server running?";
      }
    },
    [applySession]
  );

  const signup = useCallback(
    async (input: SignupInput): Promise<string | null> => {
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const json = await res.json();
        if (!res.ok) return json.error ?? "Signup failed";
        applySession(json.user);
        return null;
      } catch {
        return "Network error — is the server running?";
      }
    },
    [applySession]
  );

  const logout = useCallback(() => {
    setUser(null);
    setStatus("guest");
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const toggleFavorite = useCallback(
    async (cookId: string) => {
      if (!user || user.role !== "diner") return;
      const has = user.favoriteCookIds.includes(cookId);
      // Optimistic update
      setUser({
        ...user,
        favoriteCookIds: has
          ? user.favoriteCookIds.filter((id) => id !== cookId)
          : [...user.favoriteCookIds, cookId],
      });
      try {
        const res = await fetch("/api/users/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userKey: user.key,
            cookId,
            action: has ? "remove" : "add",
          }),
        });
        const json = await res.json();
        if (res.ok && Array.isArray(json.favoriteCookIds)) {
          setUser((prev) =>
            prev ? { ...prev, favoriteCookIds: json.favoriteCookIds } : prev
          );
        }
      } catch (err) {
        console.error("Favorite toggle failed", err);
      }
    },
    [user]
  );

  // Restore session on mount by re-validating the stored email
  useEffect(() => {
    const savedEmail = localStorage.getItem(STORAGE_KEY);
    if (!savedEmail) {
      setStatus("guest");
      return;
    }
    login(savedEmail).then((error) => {
      if (error) {
        localStorage.removeItem(STORAGE_KEY);
        setStatus("guest");
      }
    });
  }, [login]);

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        login,
        signup,
        logout,
        toggleFavorite,
        authModal,
        openAuth: (mode) => setAuthModal(mode),
        closeAuth: () => setAuthModal(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
