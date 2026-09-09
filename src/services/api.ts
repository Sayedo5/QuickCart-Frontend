import { env } from '@/config/env';
import { mockApi } from './api.mock';
import { remoteApi } from './api.remote';
import { QuickCartApi } from './api.types';

/**
 * The API used by screens and stores. Backed by the real backend when
 * EXPO_PUBLIC_API_BASE_URL is set (and EXPO_PUBLIC_USE_MOCK_API is not "true"),
 * otherwise by the in-repo mock so the app runs standalone for demos.
 */
export const api: QuickCartApi = env.useMockApi ? mockApi : remoteApi;

export const isMockApi = env.useMockApi;

export { ApiError, toApiError } from './http';
export { DEMO_OTP } from './api.mock';
export type * from './api.types';
