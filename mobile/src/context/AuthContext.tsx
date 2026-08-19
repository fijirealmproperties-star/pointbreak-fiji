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
import { getJson, removeItem, setJson } from "../storage";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (session: StoredSession) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const session = await getJson<StoredSession>("session");
      if (session?.accessToken && session.user) {
        setAccessToken(session.accessToken);
        setRefreshToken(session.refreshToken);
        setAccessTokenState(session.accessToken);
        setUser(session.user as User);
        connectSocket();
        connectSocket().emit("rider:join", session.user.id);
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (session: StoredSession) => {
    setAccessToken(session.accessToken);
    setRefreshToken(session.refreshToken);
    setAccessTokenState(session.accessToken);
    setUser(session.user as User);
    await setJson("session", session);
    connectSocket();
    connectSocket().emit(session.user.role === "driver" ? "provider:join" : "rider:join", session.user.id);
  }, []);

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

  const value = useMemo(
    () => ({ user, accessToken, loading, login, logout, updateProfile }),
    [user, accessToken, loading, login, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
