const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function apiFetch<T>(path: string, token: string | undefined, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export function apiLogin(email: string, password: string) {
  return apiFetch<{ token: string }>('/auth/login', undefined, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function apiMe(token: string) {
  return apiFetch<{ id: string; email: string; name: string }>('/me', token);
}

export function apiPlans(token: string) {
  return apiFetch<{ plans: { _id: string; slug: string; title: string; goal: string; raceDate: string | null; startDate: string }[] }>(
    '/plans',
    token
  );
}

export function apiPlan(token: string, slug: string) {
  return apiFetch<import('./types').Plan>(`/plans/${slug}`, token);
}

export function apiProgress(token: string, planId: string) {
  return apiFetch<{ entries: import('./types').ProgressEntry[] }>(`/progress?planId=${encodeURIComponent(planId)}`, token);
}

export function apiToggleProgress(token: string, planId: string, sessionId: string) {
  return apiFetch<{ done: boolean; doneAt?: string }>('/progress/toggle', token, {
    method: 'POST',
    body: JSON.stringify({ planId, sessionId }),
  });
}
