import { remoteApi } from './api.remote';
import { QuickCartApi } from './api.types';

/**
 * The API used by screens and stores. Always the real backend — the base URL
 * comes from EXPO_PUBLIC_API_URL (see src/config/env.ts).
 */
export const api: QuickCartApi = remoteApi;

export { ApiError, toApiError } from './http';
export type * from './api.types';
