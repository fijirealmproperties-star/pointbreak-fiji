import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, setAccessToken, setRefreshToken, StoredSession } from "../api/client";
import { connectSocket, disconnectSocket } from "../api/socket";
import { getItem, getJson, removeItem, setJson, setItem } from "../storage";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  keepSignedIn: boolean;
  setKeepSignedIn: (value: boolean) => Promise<void>;
  login: (session: StoredSession, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [keepSignedIn, setKeepSignedInState] = useState(true);

  useEffect(() => {
    (async () => {
      const keep = await getItem("keepSignedIn");
      const keepValue = keep === null ? true : keep === "true";
      setKeepSignedInState(keepValue);
      const session = keepValue ? await getJson<StoredSession>("session") : null;
      if (keepValue && session?.accessToken && session.user) {
        setAccessToken(session.accessToken);
        setRefreshToken(session.refreshToken);
        setAccessTokenState(session.accessToken);
        setUser(session.user as User);
        const sock = connectSocket();
        sock.emit("rider:join", session.user.id);
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(
    async (session: StoredSession, remember = true) => {
      setAccessToken(session.accessToken);
      setRefreshToken(session.refreshToken);
      setAccessTokenState(session.accessToken);
      setUser(session.user as User);
      if (remember) {
        await setJson("session", session);
      } else {
        await removeItem("session");
      }
      const sock = connectSocket();
      sock.emit("rider:join", session.user.id);
    },
    [],
  );

  const logout = useCallback(async () => {
    setAccessToken(null);
    setRefreshToken(null);
    setAccessTokenState(null);
    setUser(null);
    await removeItem("session");
    disconnectSocket();
  }, []);

  const updateProfile = useCallback(async (next: User) => {
    setUser(next);
    const session = await getJson<StoredSession>("session");
    if (session) {
      await setJson("session", { ...session, user: next });
    }
  }, []);

  const setKeepSignedIn = useCallback(async (value: boolean) => {
    setKeepSignedInState(value);
    await setItem("keepSignedIn", String(value));
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      keepSignedIn,
      setKeepSignedIn,
      login,
      logout,
      updateProfile,
    }),
    [user, accessToken, loading, keepSignedIn, setKeepSignedIn, login, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
