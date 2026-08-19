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

const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 15000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = REQUEST_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
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
  } catch (err: any) {
    if (attempt < MAX_RETRIES && (err.name === "AbortError" || err.message?.includes("Network"))) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      return request<T>(method, path, body, attempt + 1);
    }
    throw new ApiError(0, "Cannot reach server. Check your internet connection.");
  }

  if (res.status === 401 && refreshTokenValue && path !== "/api/auth/login" && path !== "/api/auth/refresh") {
    try {
      const refreshRes = await fetchWithTimeout(`${baseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });
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
