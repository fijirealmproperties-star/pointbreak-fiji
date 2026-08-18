import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, setBaseUrl } from "../api/client";
import { disconnectSocket } from "../api/socket";
import { getItem, setItem } from "../storage";

interface ServerContextValue {
  serverUrl: string;
  configured: boolean;
  connected: boolean;
  checking: boolean;
  setServerUrl: (url: string) => Promise<boolean>;
  resetServer: () => Promise<void>;
}

const ServerContext = createContext<ServerContextValue | null>(null);

export function ServerProvider({ children }: { children: React.ReactNode }) {
  const [serverUrl, setServerUrlState] = useState("http://10.0.2.2:3001");
  const [configured, setConfigured] = useState(false);
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await getItem("serverUrl");
      if (stored) {
        setServerUrlState(stored);
        setBaseUrl(stored);
        setConfigured(true);
        await ping(stored);
      }
    })();
  }, []);

  const ping = useCallback(async (url: string) => {
    setChecking(true);
    try {
      setBaseUrl(url);
      await api.get<unknown[]>("/api/locations");
      setConnected(true);
      return true;
    } catch {
      setConnected(false);
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  const setServerUrl = useCallback(
    async (url: string) => {
      const normalized = url.replace(/\/+$/, "");
      const ok = await ping(normalized);
      if (ok) {
        setServerUrlState(normalized);
        await setItem("serverUrl", normalized);
        setConfigured(true);
      }
      return ok;
    },
    [ping],
  );

  const resetServer = useCallback(async () => {
    disconnectSocket();
    setServerUrlState("http://10.0.2.2:3001");
    setConfigured(false);
    setConnected(false);
    await setItem("serverUrl", "");
  }, []);

  return (
    <ServerContext.Provider
      value={{
        serverUrl,
        configured,
        connected,
        checking,
        setServerUrl,
        resetServer,
      }}
    >
      {children}
    </ServerContext.Provider>
  );
}

export function useServer() {
  const ctx = useContext(ServerContext);
  if (!ctx) throw new Error("useServer must be used within ServerProvider");
  return ctx;
}
