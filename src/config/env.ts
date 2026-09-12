import Constants, { ExecutionEnvironment } from 'expo-constants';
import { isRunningInExpoGo } from 'expo';

/**
 * Public runtime configuration for the mobile app.
 *
 * Everything here comes from `EXPO_PUBLIC_*` environment variables, which Expo
 * inlines into the bundle at build time, plus `extra` values set in
 * app.config.ts. Nothing secret belongs in this file — the values ship inside
 * the APK and are readable by anyone who unpacks it. Server-side secrets
 * (database URL, JWT secrets, SMTP credentials) live in QuickCart-Backend only.
 */

const extra = (Constants.expoConfig?.extra ?? {}) as {
  appEnv?: string;
  mapsConfigured?: boolean;
  eas?: { projectId?: string };
};

/** Trailing slashes break URL joining in axios, so normalise them away. */
const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const rawSocketUrl = process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

/**
 * Expo Go cannot load custom native modules, and remote push notification
 * registration was removed in Expo Go as of SDK 53+.
 *
 * In modern Expo SDKs, `Constants.appOwnership` is deprecated and returns `null`
 * on Android inside Expo Go. We check `isRunningInExpoGo()` along with
 * `Constants.appOwnership` and `Constants.executionEnvironment` to reliably
 * identify Expo Go.
 *
 * In a real production standalone APK, `isRunningInExpoGo()` is false,
 * `Constants.appOwnership` is null, and `Constants.executionEnvironment` is
 * 'standalone' (ExecutionEnvironment.Standalone), so `isExpoGo` evaluates to false.
 */
const isExpoGo =
  isRunningInExpoGo() ||
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.executionEnvironment !== ExecutionEnvironment.Standalone;

export const env = {
  apiBaseUrl: trimTrailingSlash(rawApiBaseUrl),
  socketUrl: trimTrailingSlash(rawSocketUrl),
  appEnv: extra.appEnv ?? process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
  appVersion: Constants.expoConfig?.version ?? '1.0.0',
  easProjectId: extra.eas?.projectId ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? undefined,
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  /**
   * Whether a Maps SDK for Android key was baked in at build time. False means
   * the native map would render as a blank grey grid, so the tracking screen
   * shows its text fallback instead. Expo Go has no Maps key of its own either.
   */
  mapsConfigured: (extra.mapsConfigured ?? !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY) && !isExpoGo,
  isExpoGo,
} as const;

export type AppEnv = typeof env;
