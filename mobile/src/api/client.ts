import { getJson } from "../storage";

export interface StoredSession {
  user: { id: string; name: string; phone: string; email?: string | null; role: string };
  accessToken: string;
  refreshToken: string;
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

let baseUrl = "https://washing-duchess-purge.ngrok-free.dev";
let token: string | null = null;
let refreshTokenValue: string | null = null;

export function setBaseUrl(url: string) {
  baseUrl = url.replace(/\/+$/, "");
}

export function getBaseUrl() {
  return baseUrl;
}

export function setAccessToken(t: string | null) {
  token = t;
}

export function setRefreshToken(t: string | null) {
  refreshTokenValue = t;
}

const MAX_RETRIES = 3;
const BASE_TIMEOUT = 15000;
const RETRY_DELAYS = [2000, 5000, 10000];

let lastNetworkQuality: "fast" | "slow" | "offline" = "fast";
export function getNetworkQuality() {
  return lastNetworkQuality;
}

function getTimeout(): number {
  if (lastNetworkQuality === "slow") return 30000;
  if (lastNetworkQuality === "offline") return 10000;
  return BASE_TIMEOUT;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout?: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout ?? getTimeout());
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
    });
    clearTimeout(timer);

    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 5_000_000) {
      throw new ApiError(0, "Response too large");
    }

    return res;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      lastNetworkQuality = "slow";
    }
    throw err;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  attempt = 0,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    "Accept": "application/json",
    "Accept-Encoding": "gzip",
    "Connection": "keep-alive",
  };
  const authToken = token ?? (await getJson<StoredSession>("session"))?.accessToken;
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let res: Response;
  try {
    res = await fetchWithTimeout(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    lastNetworkQuality = "fast";
  } catch (err: any) {
    const isNetworkError =
      err.name === "AbortError" ||
      err.message?.includes("Network") ||
      err.message?.includes("Failed to fetch") ||
      err.message?.includes("TypeError");

    if (isNetworkError && attempt < MAX_RETRIES) {
      lastNetworkQuality = attempt === 0 ? "slow" : "offline";
      const delay = RETRY_DELAYS[Math.min(attempt, RETRY_DELAYS.length - 1)];
      await new Promise((r) => setTimeout(r, delay));
      return request<T>(method, path, body, attempt + 1);
    }

    lastNetworkQuality = "offline";
    if (attempt > 0) {
      throw new ApiError(0, "Slow or no internet connection. Please try again.");
    }
    throw new ApiError(0, "Cannot reach server. Check your internet connection.");
  }

  if (
    res.status === 401 &&
    refreshTokenValue &&
    path !== "/api/auth/login" &&
    path !== "/api/auth/refresh"
  ) {
    try {
      const refreshRes = await fetchWithTimeout(
        `${baseUrl}/api/auth/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: refreshTokenValue }),
        },
        10000,
      );
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        token = data.accessToken;
        refreshTokenValue = data.refreshToken;
        headers.Authorization = `Bearer ${token}`;
        res = await fetchWithTimeout(`${baseUrl}${path}`, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
        });
      }
    } catch {}
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      (data as { error?: string })?.error ||
      (data as { message?: string })?.message ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string, body?: unknown) => request<T>("DELETE", path, body),
};
