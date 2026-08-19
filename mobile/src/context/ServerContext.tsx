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
  "https://pointbreak-fiji.onrender.com",
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

async function tryPing(url: string, timeoutMs: number): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${url}/api/locations`, {
      method: "GET",
      headers: {
        "ngrok-skip-browser-warning": "true",
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return false;
    const text = await res.text();
    try { JSON.parse(text); } catch { return false; }
    return true;
  } catch {
    return false;
  }
}

export function ServerProvider({ children }: { children: React.ReactNode }) {
  const [serverUrl, setServerUrlState] = useState(DISCOVERY_URLS[0]);
  const [configured, setConfigured] = useState(false);
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(false);
  const [discovering, setDiscovering] = useState(false);

  const ping = useCallback(async (url: string) => {
    setChecking(true);
    const ok = await tryPing(url, 40000);
    setConnected(ok);
    setChecking(false);
    return ok;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setChecking(true);

      const stored = await getItem("serverUrl");
      const urls = stored
        ? [stored, ...DISCOVERY_URLS.filter((u) => u !== stored)]
        : DISCOVERY_URLS;

      for (const url of urls) {
        if (cancelled) return;

        const timeout = url.includes("onrender.com") ? 40000 : 10000;
        const ok = await tryPing(url, timeout);

        if (ok && !cancelled) {
          setServerUrlState(url);
          setBaseUrl(url);
          await setItem("serverUrl", url);
          setConfigured(true);
          setConnected(true);
          setChecking(false);
          setDiscovering(false);
          return;
        }
      }

      if (!cancelled) {
        setChecking(false);
        setDiscovering(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const setServerUrl = useCallback(
    async (url: string) => {
      const normalized = url.replace(/\/+$/, "");
      setChecking(true);
      const timeout = normalized.includes("onrender.com") ? 40000 : 10000;
      const ok = await tryPing(normalized, timeout);
      if (ok) {
        setServerUrlState(normalized);
        setBaseUrl(normalized);
        await setItem("serverUrl", normalized);
        setConfigured(true);
        setConnected(true);
      } else {
        setConnected(false);
      }
      setChecking(false);
      return ok;
    },
    [],
  );

  const resetServer = useCallback(async () => {
    disconnectSocket();
    setServerUrlState(DISCOVERY_URLS[0]);
    setBaseUrl(DISCOVERY_URLS[0]);
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
