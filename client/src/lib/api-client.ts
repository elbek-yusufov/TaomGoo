import { useAuthStore } from '../stores/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export async function apiClient<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`);

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const { tokens, logout, setAuth, user } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (tokens?.access) {
    headers['Authorization'] = `Bearer ${tokens.access}`;
  }

  try {
    const response = await fetch(url.toString(), {
      ...options,
      headers,
    });

    if (response.status === 401) {
      if (!tokens?.refresh) {
        logout();
        window.location.href = '/login';
        throw new ApiError(401, 'Sessiya muddati tugadi');
      }

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          // Attempt token refresh: POST /api/v1/auth/token/refresh/
          const refreshRes = await fetch(`${BASE_URL}/api/v1/auth/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: tokens.refresh }),
          });

          if (!refreshRes.ok) {
            throw new Error('Refresh failed');
          }

          const refreshData = await refreshRes.json();
          const newAccess = refreshData.access;
          if (user) {
            setAuth({ access: newAccess, refresh: tokens.refresh }, user);
          }
          isRefreshing = false;
          onRefreshed(newAccess);
        } catch (refreshErr) {
          isRefreshing = false;
          logout();
          window.location.href = '/login';
          throw new ApiError(401, 'Sessiya muddati tugadi, qaytadan kiring');
        }
      }

      // Wait for the new token
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(async (newToken) => {
          headers['Authorization'] = `Bearer ${newToken}`;
          try {
            const retryRes = await fetch(url.toString(), { ...options, headers });
            const data = await retryRes.json();
            resolve(data);
          } catch (e) {
            reject(e);
          }
        });
      });
    }

    if (!response.ok) {
      let errorBody = {};
      try {
        errorBody = await response.json();
      } catch {
        // ignore
      }
      throw new ApiError(response.status, `Server xatosi: ${response.status}`, errorBody);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error
    throw new ApiError(0, "Server bilan bog'lanishda xatolik yuz berdi");
  }
}
