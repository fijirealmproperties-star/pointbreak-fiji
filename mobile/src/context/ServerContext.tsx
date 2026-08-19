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

const DISCOVERY_URLS = [
  "https://washing-duchess-purge.ngrok-free.dev",
  "http://10.0.2.2:3001",
  "http://localhost:3001",
];

interface ServerContextValue {
  serverUrl: string;
  configured: boolean;
  connected: boolean;
  checking: boolean;
  discovering: boolean;
  setServerUrl: (url: string) => Promise<boolean>;
  resetServer: () => Promise<void>;
}

const ServerContext = createContext<ServerContextValue | null>(null);

export function ServerProvider({ children }: { children: React.ReactNode }) {
  const [serverUrl, setServerUrlState] = useState(DISCOVERY_URLS[0]);
  const [configured, setConfigured] = useState(false);
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(false);
  const [discovering, setDiscovering] = useState(true);

  const ping = useCallback(async (url: string) => {
    try {
      setBaseUrl(url);
      await api.get<unknown[]>("/api/locations");
      setConnected(true);
      return true;
    } catch {
      setConnected(false);
      return false;
    }
  }, []);

  useEffect(() => {
    (async () => {
      setChecking(true);
      setDiscovering(true);

      const stored = await getItem("serverUrl");
      const urls = stored
        ? [stored, ...DISCOVERY_URLS.filter((u) => u !== stored)]
        : DISCOVERY_URLS;

      for (const url of urls) {
        const ok = await ping(url);
        if (ok) {
          setServerUrlState(url);
          setBaseUrl(url);
          await setItem("serverUrl", url);
          setConfigured(true);
          setChecking(false);
          setDiscovering(false);
          return;
        }
      }

      setChecking(false);
      setDiscovering(false);
    })();
  }, []);

  const setServerUrl = useCallback(
    async (url: string) => {
      const normalized = url.replace(/\/+$/, "");
      setChecking(true);
      const ok = await ping(normalized);
      if (ok) {
        setServerUrlState(normalized);
        await setItem("serverUrl", normalized);
        setConfigured(true);
      }
      setChecking(false);
      return ok;
    },
    [ping],
  );

  const resetServer = useCallback(async () => {
    disconnectSocket();
    setServerUrlState(DISCOVERY_URLS[0]);
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
        discovering,
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
