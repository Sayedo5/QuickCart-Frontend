import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { tokenStorage } from './tokens';

/**
 * Central HTTP client.
 *  - base URL from env
 *  - attaches the bearer token from SecureStore
 *  - on 401: refreshes the token once (queueing concurrent requests), retries, or forces logout
 *  - normalizes every failure into ApiError so screens render errors consistently
 */

export class ApiError extends Error {
  code: string;
  status?: number;
  details?: unknown;
  constructor(code: string, message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/** Backend response envelope: { success, data, message, error }. */
export interface Envelope<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: { code?: string; message?: string; details?: unknown };
}

type LogoutHandler = () => void;
let onForceLogout: LogoutHandler | null = null;
/** Registered by the auth store so a failed refresh can reset the session. */
export const setForceLogoutHandler = (handler: LogoutHandler | null) => {
  onForceLogout = handler;
};

export const http: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 20_000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Client': `quickcart-mobile/${env.appVersion}` },
});

http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const tokens = await tokenStorage.get();
  if (tokens?.accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const tokens = await tokenStorage.get();
  if (!tokens?.refreshToken) return null;
  try {
    // Use a bare axios call so this request is not intercepted again.
    const res = await axios.post<Envelope<{ accessToken: string; refreshToken: string }>>(
      `${env.apiBaseUrl}/auth/refresh`,
      { refreshToken: tokens.refreshToken },
      { timeout: 15_000 },
    );
    const next = res.data.data;
    await tokenStorage.set({ accessToken: next.accessToken, refreshToken: next.refreshToken });
    return next.accessToken;
  } catch {
    await tokenStorage.clear();
    onForceLogout?.();
    return null;
  }
};

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<Envelope<unknown>>) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retried && !original.url?.includes('/auth/')) {
      original._retried = true;
      refreshing = refreshing ?? refreshAccessToken().finally(() => (refreshing = null));
      const token = await refreshing;
      if (token) {
        original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${token}` };
        return http.request(original);
      }
    }

    throw toApiError(error);
  },
);

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data as Envelope<unknown> | undefined;
    if (!error.response) {
      if (error.code === 'ECONNABORTED') return new ApiError('TIMEOUT', 'The request timed out. Please try again.');
      return new ApiError('NETWORK', 'No internet connection. Check your network and try again.');
    }
    const code = body?.error?.code ?? (status === 401 ? 'UNAUTHORIZED' : status === 404 ? 'NOT_FOUND' : status === 422 || status === 400 ? 'VALIDATION' : status && status >= 500 ? 'SERVER' : 'HTTP_ERROR');
    const message = body?.error?.message ?? body?.message ?? (status && status >= 500 ? 'Our servers are having trouble. Please try again shortly.' : 'Something went wrong. Please try again.');
    return new ApiError(code, message, status, body?.error?.details);
  }
  if (error instanceof Error) return new ApiError('UNKNOWN', error.message);
  return new ApiError('UNKNOWN', 'Something went wrong.');
};

/** Unwraps the backend envelope, throwing ApiError when success is false. */
export const unwrap = <T>(envelope: Envelope<T>): T => {
  if (!envelope.success) {
    throw new ApiError(envelope.error?.code ?? 'REQUEST_FAILED', envelope.error?.message ?? envelope.message ?? 'Request failed.');
  }
  return envelope.data;
};

export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => unwrap((await http.get<Envelope<T>>(url, config)).data);
export const post = async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> => unwrap((await http.post<Envelope<T>>(url, body, config)).data);
export const put = async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> => unwrap((await http.put<Envelope<T>>(url, body, config)).data);
export const patch = async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> => unwrap((await http.patch<Envelope<T>>(url, body, config)).data);
export const del = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => unwrap((await http.delete<Envelope<T>>(url, config)).data);
