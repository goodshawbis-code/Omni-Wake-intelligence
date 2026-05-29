// Thin API client. All routes are prefixed with /api per ingress config.
const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

async function request<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn(`[api] ${method} ${path} ${res.status} ${text}`);
      return null;
    }
    if (res.status === 204) return null;
    return (await res.json()) as T;
  } catch (e) {
    console.warn(`[api] ${method} ${path} failed`, e);
    return null;
  }
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};

export const PUBLIC_SHARE_URL = (token: string) =>
  `${BASE}/share/view/${token}`;
