const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4002/api/v1";

export async function apiFetch(path: string, opts: RequestInit = {}, retry = true): Promise<any> {
  const r = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });

  // Auto-refresh on 401
  if (r.status === 401 && retry && !path.includes("/auth/refresh")) {
    const refreshed = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) return apiFetch(path, opts, false);
  }

  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as any).message || `Error ${r.status}`);
  return j;
}
